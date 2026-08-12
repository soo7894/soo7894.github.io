"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { House, Plus, Search, TentTree, UserRound } from "lucide-react";
import { supabase } from "../lib/supabase";

const TOSS_TEST_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbPOW43n07xlzm";

type PreparedPayment = {
  orderId: string;
  orderName: string;
  amount: number;
  currency: "KRW";
  testMode: true;
};

type PaymentResult = {
  status: "DONE";
  orderId: string;
  orderName: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
  testMode: true;
};

async function paymentErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "context" in error) {
    const context = error.context;
    if (context && typeof context === "object" && "json" in context && typeof context.json === "function") {
      try {
        const payload = await context.json() as { error?: unknown; message?: unknown };
        const serverMessage = typeof payload.error === "string" ? payload.error : payload.message;
        if (typeof serverMessage === "string" && serverMessage.trim()) return serverMessage.slice(0, 160);
      } catch {
        // Fall back to the SDK message below when the response has no JSON body.
      }
    }
  }
  if (error && typeof error === "object" && "code" in error) {
    const code = String(error.code || "");
    if (code === "USER_CANCEL" || code === "PAY_PROCESS_CANCELED") return "토스 테스트 결제를 취소했어요.";
    if (code === "INVALID_METADATA") return "결제 주문 정보 형식을 확인하지 못했어요. 다시 시도해 주세요.";
    if (code === "NETWORK_ERROR") return "결제창 연결이 원활하지 않아요. 네트워크를 확인한 뒤 다시 시도해 주세요.";
    if (code === "UNKNOWN") return "결제창에서 주문 정보를 처리하지 못했어요. 창을 닫고 다시 시도해 주세요.";
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message).slice(0, 160);
  }
  return fallback;
}

type KakaoPostcodeData = {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  sido: string;
  sigungu: string;
};

type KakaoPostcodeConstructor = new (options: {
  oncomplete: (data: KakaoPostcodeData) => void;
  width?: string | number;
  height?: string | number;
}) => {
  embed: (element: HTMLElement, options?: { autoClose?: boolean }) => void;
};

declare global {
  interface Window {
    kakao?: { Postcode?: KakaoPostcodeConstructor };
    daum?: { Postcode?: KakaoPostcodeConstructor };
  }
}

const KAKAO_POSTCODE_SCRIPT =
  "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
let postcodeLoader: Promise<KakaoPostcodeConstructor> | null = null;

function loadKakaoPostcode() {
  const available = window.kakao?.Postcode ?? window.daum?.Postcode;
  if (available) return Promise.resolve(available);
  if (postcodeLoader) return postcodeLoader;

  postcodeLoader = new Promise<KakaoPostcodeConstructor>((resolve, reject) => {
    const finish = () => {
      const Postcode = window.kakao?.Postcode ?? window.daum?.Postcode;
      if (Postcode) resolve(Postcode);
      else reject(new Error("Kakao Postcode did not initialize."));
    };
    const fail = () => {
      postcodeLoader = null;
      reject(new Error("Kakao Postcode script failed to load."));
    };
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-kakao-postcode]",
    );
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", fail, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = KAKAO_POSTCODE_SCRIPT;
    script.async = true;
    script.dataset.kakaoPostcode = "true";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", fail, { once: true });
    document.head.appendChild(script);
  });

  return postcodeLoader;
}

type Gear = {
  id: number;
  title: string;
  category: string;
  price: string;
  location: string;
  time: string;
  condition: string;
  image: string;
  tags: string[];
  passport: number;
  seller: string;
  sellerScore: string;
  description: string;
};

type Panel =
  | "gear"
  | "favorites"
  | "login"
  | "sell"
  | "logs"
  | "safety"
  | "guide"
  | "policy"
  | "faq"
  | "contact"
  | "notices"
  | "question"
  | "profile"
  | "chat"
  | "terms"
  | "privacy"
  | null;

type ListingPhoto = {
  id: string;
  name: string;
  url: string;
  file: File;
};

type PersistedGearListing = {
  id: number;
  title: string;
  category: string;
  price: number;
  location: string;
  condition: string;
  image_url: string;
  tags: string[] | null;
  passport: number;
  seller_name: string;
  description: string;
  created_at: string;
};

function persistedListingToGear(row: PersistedGearListing): Gear {
  return {
    id: Number(row.id),
    title: row.title,
    category: row.category,
    price: `${Number(row.price).toLocaleString("ko-KR")}원`,
    location: row.location,
    time: new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(row.created_at)),
    condition: row.condition,
    image: row.image_url,
    tags: row.tags ?? [],
    passport: row.passport,
    seller: row.seller_name,
    sellerScore: "등록 판매자",
    description: row.description,
  };
}

const passportChecklist = [
  { id: "skin", title: "스킨·메쉬", detail: "오염, 찢김, 곰팡이를 확인했어요." },
  { id: "pole", title: "폴대", detail: "휨, 균열, 연결 상태를 확인했어요." },
  { id: "zipper", title: "지퍼", detail: "모든 지퍼의 작동 상태를 확인했어요." },
  { id: "waterproof", title: "누수", detail: "누수와 방수 코팅 상태를 확인했어요." },
  { id: "parts", title: "구성품", detail: "팩, 로프 등 구성품 수량을 확인했어요." },
  { id: "care", title: "관리", detail: "세척, 건조, 수선 이력을 확인했어요." },
] as const;

const conditionGuides = [
  { value: "A급", detail: "1~3회 사용 · 오염과 손상이 거의 없고 기능이 모두 정상" },
  { value: "사용감 적음", detail: "생활 오염이나 미세한 스크래치는 있지만 큰 손상 없이 기능 정상" },
  { value: "B+급", detail: "눈에 띄는 사용 흔적이나 경미한 수선·오염이 있으나 핵심 기능 정상" },
  { value: "미사용급", detail: "실외 사용·설치 이력이 없고 구성품과 포장이 대부분 보존됨" },
] as const;

const listingCategories = [
  "텐트",
  "타프",
  "테이블",
  "의자",
  "침낭",
  "매트",
  "조명",
  "식기",
  "조리도구",
  "버너·화로",
  "수납",
  "기타",
] as const;

const gearItems: Gear[] = [
  {
    id: 1,
    title: "스노우피크 아메니티돔 M 세트",
    category: "텐트",
    price: "298,000원",
    location: "서울 성동구",
    time: "12분 전",
    condition: "A급",
    image: "/products/amenity-dome-m-v2.png",
    tags: ["4인", "3계절", "풀구성"],
    passport: 96,
    seller: "성수캠퍼",
    sellerScore: "매너 4.9",
    description:
      "지난 가을까지 총 6회 사용했습니다. 스킨과 폴대 모두 이상 없고, 우천 사용 후 완전 건조해 보관했습니다.",
  },
  {
    id: 2,
    title: "헬리녹스 체어원 탄 컬러 2개",
    category: "의자",
    price: "126,000원",
    location: "경기 하남시",
    time: "36분 전",
    condition: "사용감 적음",
    image: "/products/chair-one-tan-pair-v2.png",
    tags: ["2개 세트", "경량", "정품"],
    passport: 91,
    seller: "미사피크닉",
    sellerScore: "매너 5.0",
    description:
      "솔로 캠핑에서 3회 사용한 정품 체어원입니다. 프레임 찍힘 없이 깨끗하고 수납 파우치까지 있습니다.",
  },
  {
    id: 3,
    title: "크레모아 3페이스 미니 라이트",
    category: "조명",
    price: "59,000원",
    location: "서울 마포구",
    time: "1시간 전",
    condition: "A급",
    image: "/products/three-face-mini-light-v2.png",
    tags: ["충전 정상", "파우치", "웜톤"],
    passport: 88,
    seller: "망원노을",
    sellerScore: "매너 4.8",
    description:
      "배터리 성능 정상이고 생활 기스만 조금 있습니다. 밝기 단계와 색온도 모두 정상 작동합니다.",
  },
  {
    id: 4,
    title: "씨투써밋 컴포트 플러스 매트",
    category: "매트",
    price: "145,000원",
    location: "인천 연수구",
    time: "2시간 전",
    condition: "미사용급",
    image: "/products/comfort-plus-mat-v2.png",
    tags: ["R-value 4", "더블밸브", "수선 없음"],
    passport: 98,
    seller: "송도백패커",
    sellerScore: "매너 4.9",
    description:
      "선물 받은 뒤 실내에서 한 번 펼쳐본 제품입니다. 누기 테스트 완료했고 펌프색과 수선 키트 모두 포함입니다.",
  },
  {
    id: 5,
    title: "코베아 구이바다 M 풀세트",
    category: "버너·화로",
    price: "74,000원",
    location: "서울 은평구",
    time: "어제",
    condition: "B+급",
    image: "/products/kovea-grill-fullset-v2.png",
    tags: ["점화 확인", "전골팬", "가방 포함"],
    passport: 84,
    seller: "북한산토끼",
    sellerScore: "매너 4.7",
    description:
      "사용감은 있으나 점화와 화력 모두 정상입니다. 세척 완료했으며 전골팬, 뚜껑, 전용 가방 구성입니다.",
  },
  {
    id: 6,
    title: "네이처하이크 다운 침낭 800FP",
    category: "침낭",
    price: "92,000원",
    location: "경기 고양시",
    time: "어제",
    condition: "사용감 적음",
    image: "/products/down-sleepingbag-800fp-v2.png",
    tags: ["800FP", "세탁 완료", "동계"],
    passport: 93,
    seller: "일산밤공기",
    sellerScore: "매너 4.9",
    description:
      "동계 캠핑 4회 사용 후 전문 세탁했습니다. 다운 뭉침 없고 보관망과 압축색 모두 드립니다.",
  },
];

const categories = [
  { name: "전체", icon: "⌁", copy: "모든 장비" },
  { name: "텐트", icon: "△", copy: "1,126개" },
  { name: "타프", icon: "⌁", copy: "716개" },
  { name: "테이블", icon: "▱", copy: "624개" },
  { name: "의자", icon: "∪", copy: "505개" },
  { name: "침낭", icon: "≈", copy: "516개" },
  { name: "매트", icon: "▬", copy: "418개" },
  { name: "조명", icon: "✦", copy: "642개" },
  { name: "식기", icon: "○", copy: "286개" },
  { name: "조리도구", icon: "⌇", copy: "274개" },
  { name: "버너·화로", icon: "◒", copy: "221개" },
  { name: "수납", icon: "▤", copy: "506개" },
];

const fieldNotes = [
  {
    type: "필드노트",
    title: "영하 8도, 이 조합이면 충분했어요",
    copy: "동계 입문자가 꼭 챙겨야 할 보온 레이어와 결로를 줄인 실제 세팅을 정리했습니다.",
    meta: "일산밤공기 · 장비 7개 태그",
    image:
      "https://images.unsplash.com/photo-1487730116645-74489c95b41b?auto=format&fit=crop&w=1000&q=85",
  },
  {
    type: "세팅 공유",
    title: "경차에 들어가는 2인 미니멀 세팅",
    copy: "부피는 줄이고 잠자리는 포기하지 않은 주말 오토캠핑 장비 리스트입니다.",
    meta: "차박하는윤 · 저장 128",
    image:
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1000&q=85",
  },
  {
    type: "캠핑 Q&A",
    title: "리빙쉘 4인 가족에게 너무 클까요?",
    copy: "설치 크기, 차량 적재, 우천 시 장단점을 실제 사용자 14명이 답했습니다.",
    meta: "답변 14 · 채택 완료",
    image:
      "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1000&q=85",
  },
];

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="캠프루프 홈">
      <span className="brand-mark" aria-hidden="true">
        C
      </span>
      <span>캠프루프</span>
    </a>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const [listingItems, setListingItems] = useState<Gear[]>(gearItems);
  const [favorites, setFavorites] = useState<Set<number>>(new Set([2]));
  const [toast, setToast] = useState("");
  const [selectedGear, setSelectedGear] = useState<Gear | null>(null);
  const [selectedNote, setSelectedNote] = useState<(typeof fieldNotes)[number] | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [questions, setQuestions] = useState<string[]>([
    "2인 오토캠핑, 첫 텐트는 어떤 게 좋을까요?",
  ]);
  const [chatGear, setChatGear] = useState<Gear | null>(null);
  const [messages, setMessages] = useState<string[]>([
    "안녕하세요! 장비 상태표 확인 후 궁금한 점을 남겨주세요.",
  ]);
  const [postcode, setPostcode] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [tradeLocation, setTradeLocation] = useState("");
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const [listingPhotos, setListingPhotos] = useState<ListingPhoto[]>([]);
  const [passportChecks, setPassportChecks] = useState<Set<string>>(new Set());
  const [listingCondition, setListingCondition] = useState("A급");
  const [listingCategory, setListingCategory] = useState("텐트");
  const [customListingCategory, setCustomListingCategory] = useState("");
  const [listingSubmitting, setListingSubmitting] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("home");
  const [paymentGear, setPaymentGear] = useState<Gear | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const paymentWindowRef = useRef<{ destroy: () => void } | null>(null);
  const postcodeLayerRef = useRef<HTMLDivElement>(null);
  const addressDetailRef = useRef<HTMLInputElement>(null);

  const filteredGear = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return listingItems.filter((item) => {
      const categoryMatch =
        activeCategory === "전체" || item.category === activeCategory;
      const queryMatch =
        !normalized ||
        [item.title, item.category, item.location, ...item.tags]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, query, listingItems]);

  useEffect(() => {
    let active = true;

    const applyUser = (user: User | null) => {
      if (!active) return;
      if (!user) {
        setProfileName("");
        setProfileEmail("");
        setProfileAvatar("");
        return;
      }
      const email = user.email ?? "";
      const displayName = String(user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0] || "캠퍼");
      setProfileName(displayName);
      setProfileEmail(email);
      setProfileAvatar(String(user.user_metadata?.avatar_url || user.user_metadata?.picture || ""));
    };

    void supabase.auth.getSession().then(({ data }) => {
      applyUser(data.session?.user ?? null);
      if (active) setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      applyUser(session?.user ?? null);
      setAuthLoading(false);
      if (event === "SIGNED_IN") {
        setPanel("profile");
        showToast("Google 계정으로 로그인했어요.");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    void supabase
      .from("gear_listings")
      .select("id,title,category,price,location,condition,image_url,tags,passport,seller_name,description,created_at")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("장비 목록을 불러오지 못했습니다.", error);
          return;
        }
        const savedListings = (data ?? []).map((row) => persistedListingToGear(row as PersistedGearListing));
        setListingItems([...savedListings, ...gearItems]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedGear && !selectedNote && !panel && !paymentGear && !paymentResult && !paymentError) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedGear(null);
        setSelectedNote(null);
        setPanel(null);
        setPaymentGear(null);
        setPaymentResult(null);
        setPaymentError("");
      }
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedGear, selectedNote, panel, paymentGear, paymentResult, paymentError]);

  useEffect(() => {
    let active = true;

    void (async () => {
      await Promise.resolve();
      const params = new URLSearchParams(window.location.search);
      const paymentState = params.get("payment");
      if (!paymentState || !active) return;

      const clearPaymentQuery = () => {
        const url = new URL(window.location.href);
        ["payment", "paymentKey", "orderId", "amount", "code", "message"].forEach((key) => url.searchParams.delete(key));
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      };

      if (paymentState === "fail") {
        const code = params.get("code");
        const message = params.get("message");
        setPaymentError(code === "PAY_PROCESS_CANCELED" ? "테스트 결제를 취소했어요." : message || "테스트 결제 인증에 실패했습니다.");
        clearPaymentQuery();
        return;
      }

      const paymentKey = params.get("paymentKey");
      const orderId = params.get("orderId");
      const amount = Number(params.get("amount"));
      if (paymentState !== "success" || !paymentKey || !orderId || !Number.isSafeInteger(amount) || amount <= 0) {
        setPaymentError("결제 결과 정보가 올바르지 않습니다. 다시 시도해주세요.");
        clearPaymentQuery();
        return;
      }

      setPaymentLoading(true);
      const { data, error } = await supabase.functions.invoke<PaymentResult>("toss-payment", {
        body: { action: "confirm", paymentKey, orderId, amount },
      });
      if (!active) return;
      if (error || !data) {
        setPaymentError(await paymentErrorMessage(error, "테스트 결제 승인에 실패했습니다."));
      } else {
        setPaymentResult(data);
      }
      setPaymentLoading(false);
      clearPaymentQuery();
    })();

    return () => {
      active = false;
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function toggleFavorite(id: number) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
        showToast("찜 목록에서 제외했어요.");
      } else {
        next.add(id);
        showToast("내 장비 찜 목록에 담았어요.");
      }
      return next;
    });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.querySelector("#gear")?.scrollIntoView({ behavior: "smooth" });
    showToast(query ? `‘${query}’ 검색 결과를 모았어요.` : "새로 올라온 장비를 보여드릴게요.");
  }

  function openPanel(nextPanel: Exclude<Panel, null>) {
    setSelectedGear(null);
    setSelectedNote(null);
    setPanel(nextPanel);
  }

  async function signInWithGoogle() {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/?auth=google`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      setAuthLoading(false);
      showToast(error.message.includes("provider is not enabled") ? "Google 로그인 제공자 설정이 필요해요." : "Google 로그인을 시작하지 못했어요.");
    }
  }

  async function signOut() {
    setAuthLoading(true);
    const { error } = await supabase.auth.signOut();
    setAuthLoading(false);
    if (error) {
      showToast("로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setPanel(null);
    showToast("안전하게 로그아웃했어요.");
  }

  function openTestPayment(gear: Gear) {
    setSelectedGear(null);
    setPaymentResult(null);
    setPaymentError("");
    setPaymentGear(gear);
  }

  function closeTestPayment() {
    paymentWindowRef.current?.destroy();
    paymentWindowRef.current = null;
    setPaymentGear(null);
  }

  async function startTestPayment() {
    if (!paymentGear || paymentLoading) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      setPaymentGear(null);
      setPanel("login");
      showToast("테스트 결제를 하려면 먼저 로그인해주세요.");
      return;
    }

    setPaymentLoading(true);
    setPaymentError("");
    try {
      const { data, error } = await supabase.functions.invoke<PreparedPayment>("toss-payment", {
        body: {
          action: "prepare",
          gearId: paymentGear.id,
          testGear: {
            name: paymentGear.title,
            amount: Number(paymentGear.price.replace(/[^0-9]/g, "")),
          },
        },
      });
      if (error || !data) throw error || new Error("테스트 주문을 만들지 못했습니다.");

      const tossPayments = await loadTossPayments(TOSS_TEST_CLIENT_KEY);
      const widgets = tossPayments.widgets({ customerKey: session.user.id });
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      await widgets.setAmount({ currency: data.currency, value: data.amount });
      paymentWindowRef.current?.destroy();
      paymentWindowRef.current = null;
      const paymentWindow = await widgets.renderPaymentWindow();
      paymentWindowRef.current = paymentWindow;

      paymentWindow.on("paymentRequest", async () => {
        setPaymentLoading(true);
        setPaymentError("");
        try {
          await widgets.requestPayment({
            orderId: data.orderId,
            orderName: data.orderName,
            successUrl: `${baseUrl}?payment=success`,
            failUrl: `${baseUrl}?payment=fail`,
            customerEmail: session.user.email,
            customerName: profileName || undefined,
            windowTarget: "self",
          });
        } catch (error) {
          paymentWindow.destroy();
          if (paymentWindowRef.current === paymentWindow) paymentWindowRef.current = null;
          const message = await paymentErrorMessage(error, "토스 테스트 결제 요청을 처리하지 못했습니다.");
          setPaymentError(message);
          setPaymentLoading(false);
        }
      });
      setPaymentLoading(false);
    } catch (error) {
      paymentWindowRef.current?.destroy();
      paymentWindowRef.current = null;
      const message = await paymentErrorMessage(error, "토스 테스트 결제창을 열지 못했습니다.");
      setPaymentError(message);
      setPaymentLoading(false);
    }
  }

  async function openKakaoPostcode() {
    setPostcodeOpen(true);
    try {
      const Postcode = await loadKakaoPostcode();
      await new Promise<void>((resolve) =>
        window.requestAnimationFrame(() => resolve()),
      );
      const target = postcodeLayerRef.current;
      if (!target) throw new Error("Postcode layer is unavailable.");
      target.replaceChildren();
      new Postcode({
        width: "100%",
        height: "100%",
        oncomplete: (data) => {
          const selectedAddress =
            data.roadAddress || data.jibunAddress || data.address;
          const location =
            [data.sido, data.sigungu].filter(Boolean).join(" ") ||
            selectedAddress.split(" ").slice(0, 2).join(" ");
          setPostcode(data.zonecode);
          setBaseAddress(selectedAddress);
          setTradeLocation(location);
          setPostcodeOpen(false);
          window.setTimeout(() => addressDetailRef.current?.focus(), 80);
        },
      }).embed(target, { autoClose: true });
    } catch {
      setPostcodeOpen(false);
      showToast("주소 검색창을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (listingSubmitting) return;
    const resolvedCategory = listingCategory === "기타" ? customListingCategory.trim() : listingCategory;
    if (!resolvedCategory) {
      showToast("기타 카테고리 이름을 직접 입력해 주세요.");
      return;
    }
    if (!listingPhotos.length) {
      showToast("장비 사진을 한 장 이상 등록해 주세요.");
      return;
    }
    if (passportChecks.size !== passportChecklist.length) {
      showToast("장비 패스포트 점검 항목을 모두 확인해 주세요.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const numericPrice = String(data.get("price") || "0").replace(/[^0-9]/g, "");
    const price = Number(numericPrice || 0);
    if (price < 100 || price > 10_000_000) {
      showToast("판매 가격은 100원부터 1,000만원까지 입력해 주세요.");
      return;
    }
    const usageCount = String(data.get("usageCount") || "사용 횟수 미입력");
    const publicLocation = [
      tradeLocation,
      String(data.get("location") || ""),
      baseAddress.split(/\s+/).slice(0, 2).join(" "),
    ].map((value) => value.trim()).find(Boolean) ?? "";
    if (!publicLocation) {
      showToast("카카오 주소 검색으로 거래 지역을 선택해 주세요.");
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setPanel("login");
      showToast("장비를 안전하게 저장하려면 Google 로그인이 필요해요.");
      return;
    }

    const uploadedPaths: string[] = [];
    setListingSubmitting(true);
    try {
      for (const photo of listingPhotos) {
        const extension = photo.file.type === "image/png" ? "png" : photo.file.type === "image/webp" ? "webp" : "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("gear-listings")
          .upload(path, photo.file, { cacheControl: "3600", contentType: photo.file.type, upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
      }

      const { data: publicImage } = supabase.storage.from("gear-listings").getPublicUrl(uploadedPaths[0]);
      const title = String(data.get("title") || "새 캠핑 장비").trim();
      const description = String(data.get("description") || "꼼꼼하게 관리한 캠핑 장비입니다.").trim();
      const tags = [usageCount, "상태표 6/6", "직거래"];
      const { data: savedListing, error: insertError } = await supabase
        .from("gear_listings")
        .insert({
          user_id: user.id,
          title,
          category: resolvedCategory,
          price,
          location: publicLocation,
          condition: listingCondition,
          image_url: publicImage.publicUrl,
          image_paths: uploadedPaths,
          usage_count: usageCount,
          tags,
          passport: 96,
          seller_name: profileName || String(user.user_metadata?.full_name || user.email?.split("@")[0] || "새 캠퍼"),
          description,
        })
        .select("id,title,category,price,location,condition,image_url,tags,passport,seller_name,description,created_at")
        .single();
      if (insertError) throw insertError;

      const newItem = persistedListingToGear(savedListing as PersistedGearListing);
      setListingItems((items) => [newItem, ...items]);
      listingPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
      setPostcode("");
      setBaseAddress("");
      setAddressDetail("");
      setTradeLocation("");
      setListingPhotos([]);
      setPassportChecks(new Set());
      setListingCondition("A급");
      setListingCategory("텐트");
      setCustomListingCategory("");
      setActiveCategory("전체");
      setQuery("");
      setPanel(null);
      showToast("장비가 안전하게 저장됐어요. 새로고침 후에도 유지됩니다.");
      window.setTimeout(() => document.querySelector("#gear")?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (error) {
      if (uploadedPaths.length) {
        await supabase.storage.from("gear-listings").remove(uploadedPaths);
      }
      console.error("장비 등록에 실패했습니다.", error);
      const message = error instanceof Error ? error.message : "";
      showToast(
        message.includes("gear_listings_location_check")
          ? "거래 지역을 확인하지 못했어요. 카카오 주소 검색을 다시 진행해 주세요."
          : "장비를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setListingSubmitting(false);
    }
  }

  function addListingPhotos(event: ChangeEvent<HTMLInputElement>) {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    const files = Array.from(event.currentTarget.files ?? []);
    const selected = files.filter((file) => allowedTypes.has(file.type) && file.size <= 10 * 1024 * 1024);
    const availableSlots = Math.max(0, 6 - listingPhotos.length);
    const nextPhotos = selected.slice(0, availableSlots).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    }));
    if (nextPhotos.length) setListingPhotos((current) => [...current, ...nextPhotos]);
    if (selected.length !== files.length) showToast("JPG, PNG, WEBP 사진만 장당 10MB까지 등록할 수 있어요.");
    if (selected.length > availableSlots) showToast("사진은 최대 6장까지 등록할 수 있어요.");
    event.currentTarget.value = "";
  }

  function removeListingPhoto(id: string) {
    setListingPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((photo) => photo.id !== id);
    });
  }

  function togglePassportCheck(id: string) {
    setPassportChecks((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const question = String(data.get("question") || "").trim();
    if (!question) return;
    setQuestions((items) => [question, ...items]);
    setPanel("logs");
    showToast("질문이 캠핑 Q&A에 등록됐어요.");
  }

  function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPanel(null);
    showToast("문의가 접수됐어요. 답변 알림을 보내드릴게요.");
  }

  function submitChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = String(data.get("message") || "").trim();
    if (!message) return;
    setMessages((items) => [...items, message]);
    event.currentTarget.reset();
  }

  function startChat(item: Gear) {
    setChatGear(item);
    setSelectedGear(null);
    setPanel("chat");
  }

  const panelTitles: Record<Exclude<Panel, null>, string> = {
    gear: "전체 중고장비",
    favorites: "찜한 장비",
    login: "로그인",
    sell: "장비 판매 등록",
    logs: "캠핑로그",
    safety: "안심거래 안내",
    guide: "판매 가이드",
    policy: "운영정책",
    faq: "자주 묻는 질문",
    contact: "고객센터 문의",
    notices: "공지사항",
    question: "캠핑 Q&A 작성",
    profile: "마이 캠프",
    chat: chatGear ? `${chatGear.seller}님과 대화` : "판매자와 대화",
    terms: "이용약관",
    privacy: "개인정보처리방침",
  };

  function renderPanelContent() {
    if (!panel) return null;

    if (panel === "login") {
      return (
        <div className="service-form auth-panel">
          <div className="auth-intro"><span> C </span><div><h3>다시 캠핑을 이어가세요.</h3><p>Google 계정으로 로그인하면 찜 목록과 판매 장비, 캠핑로그를 안전하게 관리할 수 있어요.</p></div></div>
          <button className="google-action" type="button" onClick={signInWithGoogle} disabled={authLoading}>
            <span className="google-mark" aria-hidden="true">G</span>
            {authLoading ? "로그인 상태 확인 중…" : "Google로 계속하기"}
          </button>
          <p className="auth-policy">계속하면 캠프루프의 <button type="button" onClick={() => setPanel("terms")}>이용약관</button>과 <button type="button" onClick={() => setPanel("privacy")}>개인정보처리방침</button>에 동의하게 됩니다.</p>
          <div className="auth-divider"><span>또는</span></div>
          <button className="social-action" type="button" onClick={() => { setProfileName("캠핑고수"); setProfileEmail("preview@camploop.kr"); setPanel("profile"); showToast("체험 계정으로 로그인했어요."); }}>체험 계정으로 둘러보기</button>
        </div>
      );
    }

    if (panel === "profile") {
      return (
        <div className="profile-panel">
          <div className="profile-hero">{profileAvatar ? <img src={profileAvatar} alt="" referrerPolicy="no-referrer" /> : <span>{(profileName || "캠").charAt(0)}</span>}<div><h3>{profileName || "게스트 캠퍼"}</h3><p>{profileEmail || (profileName ? "오토캠핑 · 장비 패스포트 멤버" : "로그인하고 내 캠프를 만들어보세요.")}</p></div></div>
          <div className="profile-stats"><div><b>{favorites.size}</b><span>찜한 장비</span></div><div><b>{listingItems.length - gearItems.length}</b><span>판매 장비</span></div><div><b>{questions.length - 1}</b><span>내 질문</span></div></div>
          <div className="panel-menu-list">
            <button type="button" onClick={() => setPanel("favorites")}><span>♡</span><div><b>찜한 장비</b><small>관심 장비를 한곳에서 확인</small></div><i>→</i></button>
            <button type="button" onClick={() => setPanel("sell")}><span>＋</span><div><b>판매 장비 관리</b><small>새 장비 등록과 판매 현황</small></div><i>→</i></button>
            <button type="button" onClick={() => setPanel("logs")}><span>♧</span><div><b>내 캠핑로그</b><small>질문과 저장한 경험 보기</small></div><i>→</i></button>
          </div>
          {profileName ? <button className="danger-action" type="button" onClick={signOut} disabled={authLoading}>{authLoading ? "처리 중…" : "로그아웃"}</button> : <button className="primary-action" type="button" onClick={() => setPanel("login")}>로그인하기</button>}
        </div>
      );
    }

    if (panel === "sell") {
      return (
        <form className="service-form listing-form" onSubmit={submitListing}>
          <div className="step-chip"><b>1</b> 장비 기본 정보 <span>상태표는 등록 후 이어서 작성할 수 있어요.</span></div>
          <fieldset className="category-field">
            <legend>카테고리 <small>장비에 가장 잘 맞는 항목을 하나 골라주세요.</small></legend>
            <div className="listing-category-grid">
              {listingCategories.map((category) => (
                <label className={listingCategory === category ? "selected" : ""} key={category}>
                  <input
                    type="radio"
                    name="category"
                    value={category}
                    checked={listingCategory === category}
                    onChange={() => {
                      setListingCategory(category);
                      if (category !== "기타") setCustomListingCategory("");
                    }}
                  />
                  <span aria-hidden="true" />
                  <b>{category}</b>
                </label>
              ))}
            </div>
            {listingCategory === "기타" && (
              <label className="custom-category-field">
                직접 입력
                <input
                  name="customCategory"
                  value={customListingCategory}
                  onChange={(event) => setCustomListingCategory(event.target.value)}
                  placeholder="예: 해먹, 카라비너"
                  maxLength={20}
                  autoFocus
                  required
                />
              </label>
            )}
          </fieldset>
          <fieldset className="condition-field">
            <legend>상태 <small>등급별 기준을 비교해 가장 가까운 상태를 골라주세요.</small></legend>
            <div className="condition-grade-grid">
              {conditionGuides.map((guide) => (
                <label className={listingCondition === guide.value ? "selected" : ""} key={guide.value}>
                  <input type="radio" name="condition" value={guide.value} checked={listingCondition === guide.value} onChange={() => setListingCondition(guide.value)} />
                  <span aria-hidden="true">{listingCondition === guide.value ? "✓" : ""}</span>
                  <span><b>{guide.value}</b><small>{guide.detail}</small></span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>장비명<input name="title" placeholder="브랜드와 모델명을 입력하세요" required /></label>
          <label>판매 가격<input name="price" inputMode="numeric" placeholder="예: 180000" required /></label>
          <fieldset className="listing-section photo-section">
            <div className="listing-section-head">
              <div><b><span>2</span> 장비 사진</b><small>첫 번째 사진이 목록의 대표 사진으로 보여요.</small></div>
              <em>{listingPhotos.length}/6</em>
            </div>
            <label className="photo-picker">
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addListingPhotos} aria-label="장비 사진 선택" />
              <span aria-hidden="true">＋</span>
              <strong>사진 추가하기</strong>
              <small>정면, 뒷면, 구성품과 사용 흔적을 선명하게 보여주세요.</small>
            </label>
            {listingPhotos.length > 0 && (
              <div className="photo-preview-grid" aria-label="등록할 장비 사진">
                {listingPhotos.map((photo, index) => (
                  <figure className="photo-preview" key={photo.id}>
                    <img src={photo.url} alt={`${photo.name} 미리보기`} />
                    {index === 0 && <figcaption>대표</figcaption>}
                    <button type="button" aria-label={`${photo.name} 삭제`} onClick={() => removeListingPhoto(photo.id)}>×</button>
                  </figure>
                ))}
              </div>
            )}
          </fieldset>
          <fieldset className="address-field">
            <legend>거래 주소</legend>
            <div className="address-search-row">
              <input name="postcode" value={postcode} placeholder="우편번호" readOnly required aria-label="우편번호" />
              <button type="button" onClick={openKakaoPostcode}>카카오 주소 검색</button>
            </div>
            <input name="address" value={baseAddress} placeholder="주소 검색 버튼을 눌러주세요" readOnly required aria-label="기본 주소" />
            <input ref={addressDetailRef} name="addressDetail" value={addressDetail} onChange={(event) => setAddressDetail(event.target.value)} placeholder="상세주소를 입력하세요 (선택)" aria-label="상세 주소" />
            <input type="hidden" name="location" value={tradeLocation} />
            <small>목록에는 시·구까지만 표시되고, 상세주소는 공개되지 않아요.</small>
          </fieldset>
          <label>사용 횟수<select name="usageCount" defaultValue="" required><option value="" disabled>사용 횟수를 선택하세요</option><option>미사용</option><option>1-3회</option><option>5-10회</option><option>10회 이상</option></select></label>
          <label>장비 설명<textarea name="description" rows={4} placeholder="보관 방법, 구성품, 사용 흔적과 수선 이력을 적어주세요." required /></label>
          <fieldset className="listing-section passport-form-section">
            <div className="listing-section-head">
              <div><b><span>3</span> 장비 패스포트 체크</b><small>확인한 상태를 바탕으로 결함과 수선 이력은 설명란에 적어주세요.</small></div>
              <em>{passportChecks.size}/{passportChecklist.length}</em>
            </div>
            <div className="passport-form-grid">
              {passportChecklist.map((item) => {
                const checked = passportChecks.has(item.id);
                return (
                  <label className={`passport-form-item${checked ? " checked" : ""}`} key={item.id}>
                    <input type="checkbox" name="passportCheck" value={item.id} checked={checked} onChange={() => togglePassportCheck(item.id)} />
                    <span aria-hidden="true">{checked ? "✓" : ""}</span>
                    <span><b>{item.title}</b><small>{item.detail}</small></span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="check-label"><input type="checkbox" required /> 결함과 누락 구성품을 빠짐없이 고지했습니다.</label>
          <button className="primary-action" type="submit" disabled={listingSubmitting}>
            {listingSubmitting ? "사진과 장비를 저장하는 중…" : "장비 등록하기"}
          </button>
          {postcodeOpen && (
            <div className="postcode-backdrop" role="presentation" onMouseDown={() => setPostcodeOpen(false)}>
              <section className="postcode-layer" role="dialog" aria-modal="true" aria-labelledby="postcode-title" onMouseDown={(event) => event.stopPropagation()}>
                <header><div><b id="postcode-title">카카오 주소 검색</b><small>도로명이나 건물명을 검색해 주세요.</small></div><button type="button" aria-label="주소 검색 닫기" onClick={() => setPostcodeOpen(false)}>×</button></header>
                <div className="postcode-embed" ref={postcodeLayerRef} />
              </section>
            </div>
          )}
        </form>
      );
    }

    if (panel === "favorites" || panel === "gear") {
      const items = panel === "favorites" ? listingItems.filter((item) => favorites.has(item.id)) : listingItems;
      return items.length ? (
        <div className="panel-gear-list">
          {items.map((item) => (
            <article key={item.id}>
              <img src={item.image} alt="" />
              <div><span>{item.category} · {item.condition}</span><h3>{item.title}</h3><strong>{item.price}</strong><small>{item.location} · {item.time}</small></div>
              <div className="panel-row-actions"><button type="button" onClick={() => { setPanel(null); setSelectedGear(item); }}>상세보기</button><button type="button" onClick={() => toggleFavorite(item.id)}>{favorites.has(item.id) ? "찜 해제" : "찜하기"}</button></div>
            </article>
          ))}
        </div>
      ) : <div className="panel-empty"><span>♡</span><h3>아직 찜한 장비가 없어요.</h3><button type="button" onClick={() => setPanel("gear")}>장비 둘러보기</button></div>;
    }

    if (panel === "logs") {
      return (
        <div className="logs-panel">
          <div className="logs-tabs"><button className="active" type="button">필드노트</button><button type="button" onClick={() => setPanel("question")}>+ 질문 작성</button></div>
          <div className="panel-note-list">{fieldNotes.map((note) => <button type="button" key={note.title} onClick={() => { setPanel(null); setSelectedNote(note); }}><img src={note.image} alt="" /><span><small>{note.type}</small><b>{note.title}</b><p>{note.copy}</p></span></button>)}</div>
          <div className="my-questions"><h3>최근 캠핑 Q&A</h3>{questions.map((question, index) => <div key={`${question}-${index}`}><span>Q</span><p>{question}</p><small>{index === 0 ? "답변을 기다리는 중" : "답변 18 · 채택 완료"}</small></div>)}</div>
        </div>
      );
    }

    if (panel === "question") {
      return <form className="service-form" onSubmit={submitQuestion}><p className="panel-lead">상황을 구체적으로 적을수록 경험 있는 캠퍼에게 좋은 답변을 받을 수 있어요.</p><label>캠핑 조건<input name="context" placeholder="예: 2인, 주말 오토캠핑, 경차" /></label><label>질문<textarea name="question" rows={6} placeholder="궁금한 점을 자세히 적어주세요." required /></label><button className="primary-action" type="submit">질문 등록하기</button></form>;
    }

    if (panel === "chat") {
      return (
        <div className="chat-panel">
          {chatGear && <div className="chat-product"><img src={chatGear.image} alt="" /><p><b>{chatGear.title}</b><span>{chatGear.price} · {chatGear.condition}</span></p></div>}
          <div className="chat-messages">{messages.map((message, index) => <p className={index === 0 ? "received" : "sent"} key={`${message}-${index}`}>{message}</p>)}</div>
          <form className="chat-form" onSubmit={submitChat}><label className="sr-only" htmlFor="chat-message">메시지</label><input id="chat-message" name="message" placeholder="거래 가능 여부를 물어보세요" autoComplete="off" /><button type="submit">보내기</button></form>
        </div>
      );
    }

    if (panel === "safety") {
      return <div className="info-panel"><p className="panel-lead">사람, 장비, 거래 과정의 증거를 함께 확인해 분쟁을 줄입니다.</p><div className="info-steps"><div><span>01</span><h3>상태표 확인</h3><p>품목별 필수 사진, 작동 상태, 수선과 누락 정보를 확인합니다.</p></div><div><span>02</span><h3>안전결제</h3><p>결제와 배송 정보를 플랫폼 안에 남기고 수령 전까지 보호합니다.</p></div><div><span>03</span><h3>수령 체크</h3><p>등록된 상태표와 실제 장비를 비교한 뒤 거래를 확정합니다.</p></div></div><div className="notice-box">화기·배터리·연료 장비는 제조사 지침과 운송 규정을 우선 확인해주세요.</div></div>;
    }

    if (panel === "guide") {
      return <div className="info-panel"><p className="panel-lead">모델 찾기부터 거래 완료까지 평균 3분 등록 흐름입니다.</p><ol className="guide-list"><li><b>모델 선택</b><span>브랜드와 모델을 찾으면 기본 규격이 자동 입력됩니다.</span></li><li><b>상태와 구성품 기록</b><span>안내된 각도의 사진과 품목별 상태를 체크합니다.</span></li><li><b>가격·거래 방법 설정</b><span>유사 매물을 참고해 가격과 직거래·택배 여부를 정합니다.</span></li><li><b>문의와 인수</b><span>플랫폼 채팅과 인수 체크로 증빙을 남깁니다.</span></li></ol><button className="primary-action" type="button" onClick={() => setPanel("sell")}>판매 등록 시작</button></div>;
    }

    if (panel === "faq") {
      return <div className="faq-list">{[["안전결제는 어떻게 진행되나요?", "구매자가 결제하면 수령 확인 전까지 결제 금액을 보호하고, 거래 확정 후 판매자에게 전달합니다."],["대형 텐트도 택배 거래할 수 있나요?", "가능하지만 파손 위험과 운임을 고려해 가까운 지역 직거래를 우선 권장합니다."],["장비 패스포트는 누가 작성하나요?", "모델 기본 정보는 캠프루프가 제공하고, 개별 장비의 상태와 이력은 판매자가 증빙과 함께 작성합니다."],["문제가 생기면 어떻게 하나요?", "채팅, 상태표, 사진, 배송 기록을 보존한 뒤 거래 상세에서 문제를 신고할 수 있습니다."]].map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>;
    }

    if (panel === "contact") {
      return <form className="service-form" onSubmit={submitContact}><label>문의 유형<select name="type"><option>거래 문의</option><option>신고·분쟁</option><option>서비스 제안</option><option>기타</option></select></label><label>이메일<input name="email" type="email" placeholder="답변받을 이메일" required /></label><label>문의 내용<textarea name="message" rows={7} placeholder="문의 내용을 자세히 입력해주세요." required /></label><button className="primary-action" type="submit">문의 접수하기</button></form>;
    }

    if (panel === "notices") {
      return <div className="notice-list"><article><time>2026.08.11</time><h3>캠프루프 로컬 베타를 시작합니다</h3><p>캠핑 특화 장비 상태표와 커뮤니티 연결 기능을 먼저 선보입니다.</p></article><article><time>2026.08.08</time><h3>안전거래 운영 원칙 안내</h3><p>화기·배터리 등 고위험 장비의 등록과 거래 유의사항을 확인해주세요.</p></article><article><time>2026.08.01</time><h3>초기 카테고리 운영 안내</h3><p>텐트, 타프, 테이블, 의자와 식기·조리도구 등 실제 장비 단위로 나누어 운영합니다.</p></article></div>;
    }

    if (panel === "policy") {
      return <div className="info-panel prose-panel"><h3>안전과 신뢰를 우선합니다</h3><p>불법·위조·리콜 미조치 품목과 안전성이 훼손된 개조 장비는 등록할 수 없습니다. 반복적인 허위 상태 고지, 외부 결제 유도, 상업성 스팸은 이용이 제한됩니다.</p><h3>커뮤니티 이해관계를 표시합니다</h3><p>협찬, 제품 제공, 판매자 이해관계가 있는 게시물은 반드시 표시해야 합니다.</p><h3>분쟁은 플랫폼 증빙을 기준으로 합니다</h3><p>상태표, 사진, 채팅, 결제와 배송 기록을 우선 확인해 일관된 기준으로 처리합니다.</p></div>;
    }

    if (panel === "terms" || panel === "privacy") {
      return <div className="info-panel prose-panel"><p className="document-date">시행일 2026. 08. 11</p>{panel === "terms" ? <><h3>서비스 이용</h3><p>캠프루프는 캠핑 장비의 거래 정보와 커뮤니티 공간을 제공합니다. 이용자는 정확한 상품 정보와 거래 조건을 제공해야 합니다.</p><h3>거래 책임</h3><p>플랫폼 안에 남은 상태표와 거래 기록을 기준으로 분쟁을 지원하며, 금지 품목과 외부 결제 유도는 제한합니다.</p><h3>콘텐츠</h3><p>이용자가 작성한 필드노트와 답변의 권리는 작성자에게 있으며, 서비스 운영과 노출을 위해 필요한 범위에서 사용됩니다.</p></> : <><h3>수집 항목</h3><p>로그인 정보, 거래·채팅 기록, 서비스 이용 기록을 서비스 제공과 안전 관리에 필요한 범위에서 처리합니다.</p><h3>이용 목적</h3><p>회원 식별, 거래 지원, 분쟁 처리, 서비스 개선과 보안 목적으로 사용합니다.</p><h3>보관과 삭제</h3><p>법령상 보관 의무가 있는 정보를 제외하고 목적 달성 또는 회원 탈퇴 후 안전하게 삭제합니다.</p></>}</div>;
    }

    return null;
  }

  return (
    <main id="top">
      <header className="site-header">
        <div className="header-inner">
          <Logo />
          <nav className="desktop-nav" aria-label="주요 메뉴">
            <a href="#gear">중고장비</a>
            <a href="#passport">안심거래</a>
            <a href="#community">캠핑로그</a>
          </nav>
          <div className="header-actions">
            <button
              className="icon-button"
              type="button"
              aria-label="찜 목록"
              onClick={() => openPanel("favorites")}
            >
              ♡<span className="count-badge">{favorites.size}</span>
            </button>
            <button
              className="login-button"
              type="button"
              onClick={() => openPanel(profileName ? "profile" : "login")}
            >
              {profileName ? `${profileName}님` : "로그인"}
            </button>
            <button
              className="sell-button"
              type="button"
              onClick={() => openPanel("sell")}
            >
              + 장비 팔기
            </button>
          </div>
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span /> 캠핑을 아는 중고거래</div>
          <h1 id="hero-title">
            다음 캠핑도,<br />
            <em>좋은 장비로.</em>
          </h1>
          <p className="hero-description">
            장비의 상태부터 내 캠핑과의 궁합까지.<br className="desktop-only" />
            캠퍼들이 함께 확인하고, 믿고 거래해요.
          </p>
          <form className="hero-search" onSubmit={handleSearch} role="search">
            <span aria-hidden="true">⌕</span>
            <label className="sr-only" htmlFor="hero-search-input">
              캠핑 장비 검색
            </label>
            <input
              id="hero-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="찾고 있는 장비나 브랜드를 검색해보세요"
            />
            <button type="submit">장비 찾기</button>
          </form>
          <div className="popular-searches" aria-label="인기 검색어">
            <span>인기</span>
            {['아메니티돔', '헬리녹스', '동계 침낭', 'IGT'].map((term) => (
              <button
                type="button"
                key={term}
                onClick={() => {
                  setQuery(term);
                  document.querySelector("#gear")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <img
            src="/hero/quiet-forest-camp-v2.png"
            alt="고요한 호숫가 소나무 숲에 정돈된 베이지 텐트와 캠핑 의자"
          />
          <div className="hero-overlay" />
          <div className="hero-label">
            <span className="live-dot" />
            <span>
              <b>지금 캠퍼들이 찾는 장비</b>
              오늘 새로 등록된 장비 284개
            </span>
          </div>
          <div className="hero-card">
            <div>
              <span className="mini-label">장비 패스포트 확인</span>
              <b>아메니티돔 M</b>
              <small>상태 정보 12/12 · 구성품 확인</small>
            </div>
            <span className="passport-score">96</span>
          </div>
        </div>
      </section>

      <section className="category-section" aria-labelledby="category-title">
        <div className="section-heading compact-heading">
          <div>
            <span className="section-kicker">BROWSE BY GEAR</span>
            <h2 id="category-title">어떤 장비를 찾으세요?</h2>
          </div>
          <button type="button" className="text-link link-button" onClick={() => openPanel("gear")}>전체 장비 보기 →</button>
        </div>
        <div className="category-grid">
          {categories.slice(1).map((category) => (
            <button
              type="button"
              className={`category-card ${activeCategory === category.name ? "active" : ""}`}
              key={category.name}
              aria-pressed={activeCategory === category.name}
              onClick={() => {
                setActiveCategory(category.name);
                document.querySelector("#gear")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="category-icon" aria-hidden="true">{category.icon}</span>
              <span>
                <b>{category.name}</b>
                <small>{category.copy}</small>
              </span>
              <span className="category-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>

      <section className="gear-section" id="gear" aria-labelledby="gear-title">
        <div className="section-heading">
          <div>
            <span className="section-kicker">FRESH GEAR</span>
            <h2 id="gear-title">새로 들어온 좋은 장비</h2>
            <p>상태 정보가 꼼꼼히 채워진 장비부터 보여드려요.</p>
          </div>
          <div className="filter-pills" aria-label="장비 카테고리 필터">
            {categories.map((category) => (
              <button
                type="button"
                key={category.name}
                className={activeCategory === category.name ? "active" : ""}
                aria-pressed={activeCategory === category.name}
                onClick={() => setActiveCategory(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {filteredGear.length ? (
          <div className="gear-grid">
            {filteredGear.slice(0, 4).map((item) => (
              <article className="gear-card" key={item.id}>
                <div className="gear-image-wrap">
                  <img src={item.image} alt="" />
                  <span className="condition-badge">{item.condition}</span>
                  <button
                    type="button"
                    className={`favorite-button ${favorites.has(item.id) ? "active" : ""}`}
                    aria-label={`${item.title} ${favorites.has(item.id) ? "찜 해제" : "찜하기"}`}
                    aria-pressed={favorites.has(item.id)}
                    onClick={() => toggleFavorite(item.id)}
                  >
                    {favorites.has(item.id) ? "♥" : "♡"}
                  </button>
                </div>
                <div className="gear-body">
                  <span className="gear-category">{item.category}</span>
                  <h3>{item.title}</h3>
                  <div className="gear-tags">
                    {item.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <div className="gear-meta">
                    <span>{item.location}</span>
                    <span>{item.time}</span>
                  </div>
                  <div className="gear-price-row">
                    <strong>{item.price}</strong>
                    <button type="button" onClick={() => setSelectedGear(item)}>
                      자세히 보기
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>⌕</span>
            <h3>조건에 맞는 장비를 찾지 못했어요.</h3>
            <p>검색어를 바꾸거나 전체 카테고리에서 다시 찾아보세요.</p>
            <button type="button" onClick={() => { setQuery(""); setActiveCategory("전체"); }}>
              모든 장비 보기
            </button>
          </div>
        )}
      </section>

      <section className="trust-section" id="passport" aria-labelledby="trust-title">
        <div className="trust-copy">
          <span className="section-kicker light">GEAR PASSPORT</span>
          <h2 id="trust-title">사진만 보고 사는 거래는<br />이제 그만.</h2>
          <p>
            캠프루프의 장비 패스포트는 품목마다 꼭 확인해야 할 상태와
            사용·관리 이력을 같은 기준으로 보여줍니다.
          </p>
          <ul>
            <li><span>01</span><div><b>품목별 상태 체크</b><small>텐트 누수부터 배터리 출력까지, 장비에 맞게.</small></div></li>
            <li><span>02</span><div><b>구성품과 관리 이력</b><small>누락품, 세척, 수선과 부품 교체를 한눈에.</small></div></li>
            <li><span>03</span><div><b>캠퍼들의 실사용 기록</b><small>날씨와 인원이 담긴 세팅·후기를 함께 확인.</small></div></li>
          </ul>
          <button className="outline-link outline-button" type="button" onClick={() => openPanel("safety")}>안심거래 방식 알아보기 <span>→</span></button>
        </div>

        <div className="passport-panel">
          <div className="passport-topline">
            <div>
              <span className="passport-logo">C</span>
              <span><b>GEAR PASSPORT</b><small>NO. CP-2026-08241</small></span>
            </div>
            <span className="verified-stamp">확인 완료</span>
          </div>
          <div className="passport-product">
            <img src={gearItems[0].image} alt="장비 패스포트 예시 텐트" />
            <div>
              <span>SNOW PEAK</span>
              <h3>아메니티돔 M</h3>
              <p>SDE-001RH · 2023년형</p>
              <div className="passport-tags"><span>4인</span><span>3계절</span><span>패킹 74cm</span></div>
            </div>
          </div>
          <div className="passport-progress-row">
            <div><span>패스포트 완성도</span><b>96%</b></div>
            <div className="passport-progress"><span /></div>
          </div>
          <div className="check-grid">
            {[
              ["스킨·메쉬", "오염 없음"],
              ["폴대", "휨 없음"],
              ["지퍼", "작동 정상"],
              ["누수", "확인 없음"],
              ["구성품", "12/12 확인"],
              ["관리", "완전 건조"],
            ].map(([label, value]) => (
              <div key={label}><span>✓</span><p><small>{label}</small><b>{value}</b></p></div>
            ))}
          </div>
          <div className="passport-foot">
            <span>최근 사용 2026. 05</span>
            <span>총 6회 사용</span>
            <span>수선 이력 없음</span>
          </div>
        </div>
      </section>

      <section className="community-section" id="community" aria-labelledby="community-title">
        <div className="section-heading">
          <div>
            <span className="section-kicker">FIELD COMMUNITY</span>
            <h2 id="community-title">먼저 써본 캠퍼의 이야기</h2>
            <p>장비 스펙에는 없는 진짜 사용 경험을 만나보세요.</p>
          </div>
          <button type="button" className="text-link link-button" onClick={() => openPanel("logs")}>캠핑로그 전체보기 →</button>
        </div>
        <div className="community-grid">
          {fieldNotes.map((note, index) => (
            <article
              className={`note-card ${index === 0 ? "featured" : ""}`}
              key={note.title}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedNote(note)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") setSelectedNote(note);
              }}
            >
              <img src={note.image} alt="" />
              <div className="note-overlay" />
              <div className="note-content">
                <span>{note.type}</span>
                <h3>{note.title}</h3>
                <p>{note.copy}</p>
                <small>{note.meta}</small>
              </div>
            </article>
          ))}
        </div>
        <div className="question-strip">
          <div className="question-icon" aria-hidden="true">?</div>
          <div>
            <span>무엇이든 물어보세요</span>
            <h3>“{questions[0]}”</h3>
          </div>
          <div className="answer-avatars" aria-label="답변한 캠퍼 18명">
            <span>캠</span><span>핑</span><span>고</span><b>+15</b>
          </div>
          <button type="button" onClick={() => openPanel("question")}>질문하기</button>
        </div>
      </section>

      <section className="cta-section">
        <span className="cta-tent" aria-hidden="true">△</span>
        <div>
          <span className="section-kicker light">PASS IT FORWARD</span>
          <h2>잠들어 있는 장비를<br />다음 캠핑으로 보내주세요.</h2>
          <p>모델만 찾으면 상태표가 자동으로 준비돼요. 평균 3분이면 충분합니다.</p>
        </div>
        <button type="button" onClick={() => openPanel("sell")}>내 장비 판매하기 <span>→</span></button>
      </section>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand"><Logo /><p>좋은 장비가 다음 캠퍼에게,<br />좋은 경험이 다음 캠핑으로.</p></div>
          <div className="footer-links"><b>서비스</b><button type="button" onClick={() => openPanel("gear")}>중고장비</button><button type="button" onClick={() => openPanel("safety")}>장비 패스포트</button><button type="button" onClick={() => openPanel("logs")}>캠핑로그</button></div>
          <div className="footer-links"><b>이용안내</b><button type="button" onClick={() => openPanel("safety")}>안심거래</button><button type="button" onClick={() => openPanel("guide")}>판매 가이드</button><button type="button" onClick={() => openPanel("policy")}>운영정책</button></div>
          <div className="footer-links"><b>고객지원</b><button type="button" onClick={() => openPanel("faq")}>자주 묻는 질문</button><button type="button" onClick={() => openPanel("contact")}>문의하기</button><button type="button" onClick={() => openPanel("notices")}>공지사항</button></div>
        </div>
        <div className="footer-bottom"><span>© 2026 CampLoop. All rights reserved.</span><span><button type="button" onClick={() => openPanel("terms")}>이용약관</button> · <button type="button" onClick={() => openPanel("privacy")}>개인정보처리방침</button></span></div>
      </footer>

      <nav className="mobile-nav" aria-label="모바일 주요 메뉴">
        <a className={activeMobileTab === "home" ? "is-active" : ""} href="#top" aria-current={activeMobileTab === "home" ? "page" : undefined} onClick={() => setActiveMobileTab("home")}><span className="mobile-nav-icon"><House aria-hidden="true" /></span><span className="mobile-nav-label">홈</span></a>
        <a className={activeMobileTab === "gear" ? "is-active" : ""} href="#gear" aria-current={activeMobileTab === "gear" ? "page" : undefined} onClick={() => setActiveMobileTab("gear")}><span className="mobile-nav-icon"><Search aria-hidden="true" /></span><span className="mobile-nav-label">장비찾기</span></a>
        <button className={`mobile-sell${activeMobileTab === "sell" ? " is-active" : ""}`} type="button" aria-current={activeMobileTab === "sell" ? "page" : undefined} onClick={() => { setActiveMobileTab("sell"); openPanel("sell"); }}><span className="mobile-nav-icon"><Plus aria-hidden="true" /></span><span className="mobile-nav-label">판매</span></button>
        <button className={activeMobileTab === "logs" ? "is-active" : ""} type="button" aria-current={activeMobileTab === "logs" ? "page" : undefined} onClick={() => { setActiveMobileTab("logs"); openPanel("logs"); }}><span className="mobile-nav-icon"><TentTree aria-hidden="true" /></span><span className="mobile-nav-label">캠핑로그</span></button>
        <button className={activeMobileTab === "profile" ? "is-active" : ""} type="button" aria-current={activeMobileTab === "profile" ? "page" : undefined} onClick={() => { setActiveMobileTab("profile"); openPanel(profileName ? "profile" : "login"); }}><span className="mobile-nav-icon"><UserRound aria-hidden="true" /></span><span className="mobile-nav-label">마이</span></button>
      </nav>

      {selectedGear && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedGear(null)}>
          <section
            className="gear-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button className="modal-close" type="button" aria-label="닫기" onClick={() => setSelectedGear(null)}>×</button>
            <img className="modal-image" src={selectedGear.image} alt="" />
            <div className="modal-content">
              <span className="gear-category">{selectedGear.category} · {selectedGear.condition}</span>
              <h2 id="modal-title">{selectedGear.title}</h2>
              <strong className="modal-price">{selectedGear.price}</strong>
              <p>{selectedGear.description}</p>
              <div className="modal-passport">
                <span><b>{selectedGear.passport}%</b> 패스포트 완성</span>
                <div><i style={{ width: `${selectedGear.passport}%` }} /></div>
              </div>
              <div className="seller-row"><span>{selectedGear.seller.charAt(0)}</span><p><b>{selectedGear.seller}</b><small>{selectedGear.sellerScore} · {selectedGear.location}</small></p></div>
              <div className="modal-actions">
                <button type="button" className={favorites.has(selectedGear.id) ? "liked" : ""} onClick={() => toggleFavorite(selectedGear.id)}>{favorites.has(selectedGear.id) ? "♥ 찜했어요" : "♡ 찜하기"}</button>
                <button type="button" onClick={() => startChat(selectedGear)}>판매자와 대화하기</button>
                <button className="toss-pay-button" type="button" onClick={() => openTestPayment(selectedGear)}>토스 테스트 결제</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {paymentGear && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !paymentLoading && closeTestPayment()}>
          <section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-title">
            <button className="modal-close" type="button" aria-label="닫기" disabled={paymentLoading} onClick={closeTestPayment}>×</button>
            <span className="test-mode-badge">TEST MODE · 실제 출금 없음</span>
            <h2 id="payment-title">토스페이먼츠 테스트 결제</h2>
            <p className="payment-intro">실제 돈은 결제되지 않습니다. 카드·간편결제 화면과 주문 승인 흐름을 안전하게 확인해보세요.</p>
            <div className="payment-order-card">
              <img src={paymentGear.image} alt="" />
              <div><span>{paymentGear.category}</span><b>{paymentGear.title}</b><strong>{paymentGear.price}</strong></div>
            </div>
            <ul className="payment-safety-list">
              <li>토스페이먼츠 공식 공용 테스트 키만 사용합니다.</li>
              <li>결제 금액은 서버에 저장된 주문 금액과 다시 대조합니다.</li>
              <li>테스트 결제 후 주문 상태가 자동으로 기록됩니다.</li>
            </ul>
            <button className="toss-confirm-button" type="button" disabled={paymentLoading} onClick={startTestPayment}>{paymentLoading ? "테스트 주문 준비 중…" : `${paymentGear.price} 테스트 결제하기`}</button>
            <button className="payment-cancel-button" type="button" disabled={paymentLoading} onClick={closeTestPayment}>다음에 할게요</button>
          </section>
        </div>
      )}

      {(paymentLoading && !paymentGear) && (
        <div className="modal-backdrop payment-progress" role="status" aria-live="polite">
          <section className="payment-result-modal"><div className="payment-spinner" /><h2>테스트 결제를 승인하고 있어요</h2><p>잠시만 기다려주세요. 이 창을 닫지 마세요.</p></section>
        </div>
      )}

      {paymentResult && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPaymentResult(null)}>
          <section className="payment-result-modal" role="dialog" aria-modal="true" aria-labelledby="payment-result-title">
            <span className="payment-result-icon" aria-hidden="true">✓</span>
            <span className="test-mode-badge">TEST PAYMENT</span>
            <h2 id="payment-result-title">테스트 결제가 완료됐어요</h2>
            <p>{paymentResult.orderName}</p>
            <dl><div><dt>결제 금액</dt><dd>{paymentResult.totalAmount.toLocaleString("ko-KR")}원</dd></div><div><dt>결제 수단</dt><dd>{paymentResult.method}</dd></div><div><dt>주문 번호</dt><dd>{paymentResult.orderId}</dd></div></dl>
            <button className="toss-confirm-button" type="button" onClick={() => setPaymentResult(null)}>확인</button>
          </section>
        </div>
      )}

      {paymentError && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPaymentError("")}>
          <section className="payment-result-modal is-error" role="dialog" aria-modal="true" aria-labelledby="payment-error-title">
            <span className="payment-result-icon" aria-hidden="true">!</span>
            <h2 id="payment-error-title">테스트 결제를 완료하지 못했어요</h2>
            <p>{paymentError}</p>
            <button className="toss-confirm-button" type="button" onClick={() => setPaymentError("")}>확인</button>
          </section>
        </div>
      )}

      {selectedNote && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedNote(null)}>
          <article className="story-modal" role="dialog" aria-modal="true" aria-labelledby="story-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="닫기" onClick={() => setSelectedNote(null)}>×</button>
            <img src={selectedNote.image} alt="" />
            <div>
              <span className="gear-category">{selectedNote.type}</span>
              <h2 id="story-title">{selectedNote.title}</h2>
              <p>{selectedNote.copy}</p>
              <div className="story-meta">{selectedNote.meta}</div>
              <h3>필드에서 확인한 핵심 포인트</h3>
              <ul><li>날씨와 인원에 맞춰 장비의 우선순위를 정했어요.</li><li>사진 속 장비를 태그해 같은 조합의 매물을 바로 찾을 수 있어요.</li><li>사용 후 관리 방법까지 기록해 다음 캠핑에도 활용합니다.</li></ul>
              <button className="primary-action" type="button" onClick={() => { setSelectedNote(null); openPanel("gear"); }}>관련 장비 보기</button>
            </div>
          </article>
        </div>
      )}

      {panel && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setPanel(null)}>
          <section className="service-modal" role="dialog" aria-modal="true" aria-labelledby="service-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span className="section-kicker">CAMPLOOP SERVICE</span><h2 id="service-modal-title">{panelTitles[panel]}</h2></div><button type="button" aria-label="닫기" onClick={() => setPanel(null)}>×</button></header>
            <div className="service-modal-body">{renderPanelContent()}</div>
          </section>
        </div>
      )}

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </main>
  );
}
