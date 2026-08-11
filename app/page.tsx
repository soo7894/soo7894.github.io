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
  const [favorites, setFavorites] = useState<Set<number>>(new Set([2]));
  const [toast, setToast] = useState("");
  const [selectedGear, setSelectedGear] = useState<Gear | null>(null);

  const filteredGear = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return gearItems.filter((item) => {
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
  }, [activeCategory, query]);

  useEffect(() => {
    if (!selectedGear) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedGear(null);
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedGear]);

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
              onClick={() => showToast(`찜한 장비가 ${favorites.size}개 있어요.`)}
            >
              ♡<span className="count-badge">{favorites.size}</span>
            </button>
            <button
              className="login-button"
              type="button"
              onClick={() => showToast("로그인 기능은 다음 단계에서 연결할 수 있어요.")}
            >
              로그인
            </button>
            <button
              className="sell-button"
              type="button"
              onClick={() => showToast("판매 등록을 시작할 준비가 됐어요.")}
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
          <a href="#gear" className="text-link">전체 장비 보기 →</a>
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
          <a className="outline-link" href="#community">안심거래 방식 알아보기 <span>→</span></a>
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
          <a href="#community" className="text-link" onClick={(event) => { event.preventDefault(); showToast("새 필드노트가 매일 업데이트돼요."); }}>캠핑로그 전체보기 →</a>
        </div>
        <div className="community-grid">
          {fieldNotes.map((note, index) => (
            <article className={`note-card ${index === 0 ? "featured" : ""}`} key={note.title}>
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
            <h3>“2인 오토캠핑, 첫 텐트는 어떤 게 좋을까요?”</h3>
          </div>
          <div className="answer-avatars" aria-label="답변한 캠퍼 18명">
            <span>캠</span><span>핑</span><span>고</span><b>+15</b>
          </div>
          <button type="button" onClick={() => showToast("질문 작성 화면은 다음 단계에서 연결할 수 있어요.")}>질문하기</button>
        </div>
      </section>

      <section className="cta-section">
        <span className="cta-tent" aria-hidden="true">△</span>
        <div>
          <span className="section-kicker light">PASS IT FORWARD</span>
          <h2>잠들어 있는 장비를<br />다음 캠핑으로 보내주세요.</h2>
          <p>모델만 찾으면 상태표가 자동으로 준비돼요. 평균 3분이면 충분합니다.</p>
        </div>
        <button type="button" onClick={() => showToast("장비 모델 찾기를 시작할 준비가 됐어요.")}>내 장비 판매하기 <span>→</span></button>
      </section>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand"><Logo /><p>좋은 장비가 다음 캠퍼에게,<br />좋은 경험이 다음 캠핑으로.</p></div>
          <div className="footer-links"><b>서비스</b><a href="#gear">중고장비</a><a href="#passport">장비 패스포트</a><a href="#community">캠핑로그</a></div>
          <div className="footer-links"><b>이용안내</b><a href="#passport">안심거래</a><a href="#passport">판매 가이드</a><a href="#top">운영정책</a></div>
          <div className="footer-links"><b>고객지원</b><a href="#community">자주 묻는 질문</a><a href="#community">문의하기</a><a href="#top">공지사항</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 CampLoop. All rights reserved.</span><span>이용약관 · 개인정보처리방침</span></div>
      </footer>

      <nav className="mobile-nav" aria-label="모바일 주요 메뉴">
        <a href="#top"><span>⌂</span>홈</a>
        <a href="#gear"><span>⌕</span>장비찾기</a>
        <button type="button" onClick={() => showToast("장비 판매 등록을 시작해요.")}><span>＋</span>판매</button>
        <a href="#community"><span>♧</span>캠핑로그</a>
        <button type="button" onClick={() => showToast("로그인 후 내 캠프를 만들 수 있어요.")}><span>○</span>마이</button>
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
                <button type="button" onClick={() => showToast("판매자에게 보낼 첫 메시지를 준비했어요.")}>판매자와 대화하기</button>
              </div>
            </div>
          </section>
        </div>
      )}

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </main>
  );
}
