"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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

const gearItems: Gear[] = [
  {
    id: 1,
    title: "스노우피크 아메니티돔 M 세트",
    category: "텐트·타프",
    price: "298,000원",
    location: "서울 성동구",
    time: "12분 전",
    condition: "A급",
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=85",
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
    category: "테이블·체어",
    price: "126,000원",
    location: "경기 하남시",
    time: "36분 전",
    condition: "사용감 적음",
    image:
      "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=85",
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
    image:
      "https://images.unsplash.com/photo-1475483768296-6163e08872a1?auto=format&fit=crop&w=1200&q=85",
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
    category: "침낭·매트",
    price: "145,000원",
    location: "인천 연수구",
    time: "2시간 전",
    condition: "미사용급",
    image:
      "https://images.unsplash.com/photo-1525811902-f2342640856e?auto=format&fit=crop&w=1200&q=85",
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
    category: "키친",
    price: "74,000원",
    location: "서울 은평구",
    time: "어제",
    condition: "B+급",
    image:
      "https://images.unsplash.com/photo-1529385101576-4e03aae38ffc?auto=format&fit=crop&w=1200&q=85",
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
    category: "침낭·매트",
    price: "92,000원",
    location: "경기 고양시",
    time: "어제",
    condition: "사용감 적음",
    image:
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=85",
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
  { name: "텐트·타프", icon: "△", copy: "1,842개" },
  { name: "테이블·체어", icon: "▱", copy: "1,129개" },
  { name: "침낭·매트", icon: "≈", copy: "934개" },
  { name: "조명", icon: "✦", copy: "642개" },
  { name: "키친", icon: "◒", copy: "781개" },
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
  const [questions, setQuestions] = useState<string[]>([
    "2인 오토캠핑, 첫 텐트는 어떤 게 좋을까요?",
  ]);
  const [chatGear, setChatGear] = useState<Gear | null>(null);
  const [messages, setMessages] = useState<string[]>([
    "안녕하세요! 장비 상태표 확인 후 궁금한 점을 남겨주세요.",
  ]);

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
    if (!selectedGear && !selectedNote && !panel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedGear(null);
        setSelectedNote(null);
        setPanel(null);
      }
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedGear, selectedNote, panel]);

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

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "캠퍼");
    setProfileName(email.split("@")[0] || "캠퍼");
    setPanel("profile");
    showToast("캠프루프에 로그인했어요.");
  }

  function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const numericPrice = String(data.get("price") || "0").replace(/[^0-9]/g, "");
    const newItem: Gear = {
      id: Date.now(),
      title: String(data.get("title") || "새 캠핑 장비"),
      category: String(data.get("category") || "텐트·타프"),
      price: `${Number(numericPrice || 0).toLocaleString("ko-KR")}원`,
      location: String(data.get("location") || "서울 성동구"),
      time: "방금 전",
      condition: String(data.get("condition") || "상태 확인 중"),
      image:
        "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1200&q=85",
      tags: ["신규 등록", "상태표 작성", "직거래"],
      passport: 72,
      seller: profileName || "새 캠퍼",
      sellerScore: "첫 거래",
      description: String(data.get("description") || "꼼꼼하게 관리한 캠핑 장비입니다."),
    };
    setListingItems((items) => [newItem, ...items]);
    setActiveCategory("전체");
    setQuery("");
    setPanel(null);
    showToast("장비가 등록됐어요. 새 장비 목록에서 확인해보세요.");
    window.setTimeout(() => document.querySelector("#gear")?.scrollIntoView({ behavior: "smooth" }), 80);
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
        <form className="service-form" onSubmit={submitLogin}>
          <p className="panel-lead">캠프루프에 로그인하고 찜 목록과 내 장비를 관리하세요.</p>
          <label>이메일<input name="email" type="email" placeholder="camper@example.com" required /></label>
          <label>비밀번호<input name="password" type="password" placeholder="8자 이상 입력" minLength={8} required /></label>
          <button className="primary-action" type="submit">로그인</button>
          <button className="social-action" type="button" onClick={() => { setProfileName("캠핑고수"); setPanel("profile"); showToast("체험 계정으로 로그인했어요."); }}>체험 계정으로 둘러보기</button>
        </form>
      );
    }

    if (panel === "profile") {
      return (
        <div className="profile-panel">
          <div className="profile-hero"><span>{(profileName || "캠").charAt(0)}</span><div><h3>{profileName || "게스트 캠퍼"}</h3><p>{profileName ? "오토캠핑 · 장비 패스포트 멤버" : "로그인하고 내 캠프를 만들어보세요."}</p></div></div>
          <div className="profile-stats"><div><b>{favorites.size}</b><span>찜한 장비</span></div><div><b>{listingItems.length - gearItems.length}</b><span>판매 장비</span></div><div><b>{questions.length - 1}</b><span>내 질문</span></div></div>
          <div className="panel-menu-list">
            <button type="button" onClick={() => setPanel("favorites")}><span>♡</span><div><b>찜한 장비</b><small>관심 장비를 한곳에서 확인</small></div><i>→</i></button>
            <button type="button" onClick={() => setPanel("sell")}><span>＋</span><div><b>판매 장비 관리</b><small>새 장비 등록과 판매 현황</small></div><i>→</i></button>
            <button type="button" onClick={() => setPanel("logs")}><span>♧</span><div><b>내 캠핑로그</b><small>질문과 저장한 경험 보기</small></div><i>→</i></button>
          </div>
          {profileName ? <button className="danger-action" type="button" onClick={() => { setProfileName(""); setPanel(null); showToast("로그아웃했어요."); }}>로그아웃</button> : <button className="primary-action" type="button" onClick={() => setPanel("login")}>로그인하기</button>}
        </div>
      );
    }

    if (panel === "sell") {
      return (
        <form className="service-form listing-form" onSubmit={submitListing}>
          <div className="step-chip"><b>1</b> 장비 기본 정보 <span>상태표는 등록 후 이어서 작성할 수 있어요.</span></div>
          <div className="form-grid">
            <label>카테고리<select name="category" defaultValue="텐트·타프">{categories.slice(1).map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
            <label>상태<select name="condition" defaultValue="A급"><option>A급</option><option>사용감 적음</option><option>B+급</option><option>미사용급</option></select></label>
          </div>
          <label>장비명<input name="title" placeholder="브랜드와 모델명을 입력하세요" required /></label>
          <div className="form-grid"><label>판매 가격<input name="price" inputMode="numeric" placeholder="예: 180000" required /></label><label>거래 지역<input name="location" placeholder="예: 서울 성동구" required /></label></div>
          <label>장비 설명<textarea name="description" rows={4} placeholder="사용 횟수, 보관 방법, 구성품을 적어주세요." required /></label>
          <label className="check-label"><input type="checkbox" required /> 결함과 누락 구성품을 빠짐없이 고지했습니다.</label>
          <button className="primary-action" type="submit">장비 등록하기</button>
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
      return <div className="notice-list"><article><time>2026.08.11</time><h3>캠프루프 로컬 베타를 시작합니다</h3><p>캠핑 특화 장비 상태표와 커뮤니티 연결 기능을 먼저 선보입니다.</p></article><article><time>2026.08.08</time><h3>안전거래 운영 원칙 안내</h3><p>화기·배터리 등 고위험 장비의 등록과 거래 유의사항을 확인해주세요.</p></article><article><time>2026.08.01</time><h3>초기 카테고리 운영 안내</h3><p>텐트·타프, 테이블·체어, 침낭·매트, 조명, 키친부터 시작합니다.</p></article></div>;
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
            src="https://images.unsplash.com/photo-1508873699372-7aeab60b44ab?auto=format&fit=crop&w=1500&q=88"
            alt="숲속에 설치된 텐트와 캠핑 장비"
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
            {categories.slice(0, 5).map((category) => (
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
        <a href="#top"><span>⌂</span>홈</a>
        <a href="#gear"><span>⌕</span>장비찾기</a>
        <button type="button" onClick={() => openPanel("sell")}><span>＋</span>판매</button>
        <button type="button" onClick={() => openPanel("logs")}><span>♧</span>캠핑로그</button>
        <button type="button" onClick={() => openPanel(profileName ? "profile" : "login")}><span>○</span>마이</button>
      </nav>

      {selectedGear && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedGear(null)}>
          <section
            className="gear-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onMouseDown={(event) => event.stopPropagation()}
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
              </div>
            </div>
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
