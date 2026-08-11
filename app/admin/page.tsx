"use client";

import { useMemo, useState } from "react";
import "./admin.css";

type AdminView = "overview" | "listings" | "reports" | "community" | "users" | "settings";
type ListingStatus = "검수 대기" | "판매 중" | "숨김";

type Listing = {
  id: number;
  title: string;
  seller: string;
  category: string;
  price: string;
  status: ListingStatus;
  reported: number;
  created: string;
  image: string;
};

const initialListings: Listing[] = [
  { id: 1048, title: "스노우피크 아메니티돔 M 세트", seller: "성수캠퍼", category: "텐트·타프", price: "298,000원", status: "판매 중", reported: 0, created: "오늘 09:42", image: "/products/amenity-dome-m-v2.png" },
  { id: 1047, title: "헬리녹스 체어원 탄 컬러 2개", seller: "미사워크맨", category: "테이블·체어", price: "126,000원", status: "검수 대기", reported: 0, created: "오늘 09:18", image: "/products/chair-one-tan-pair-v2.png" },
  { id: 1046, title: "크레모아 3페이스 미니 라이트", seller: "망원노을", category: "조명", price: "59,000원", status: "검수 대기", reported: 1, created: "오늘 08:55", image: "/products/three-face-mini-light-v2.png" },
  { id: 1045, title: "씨투써밋 컴포트 플러스 매트", seller: "송도백패커", category: "침낭·매트", price: "145,000원", status: "판매 중", reported: 0, created: "어제 22:14", image: "/products/comfort-plus-mat-v2.png" },
  { id: 1044, title: "코베아 구이바다 M 풀세트", seller: "북한산토끼", category: "키친", price: "74,000원", status: "숨김", reported: 3, created: "어제 20:37", image: "/products/kovea-grill-fullset-v2.png" },
  { id: 1043, title: "네이처하이크 다운 침낭 800FP", seller: "일산밤공기", category: "침낭·매트", price: "92,000원", status: "검수 대기", reported: 0, created: "어제 18:02", image: "/products/down-sleepingbag-800fp-v2.png" },
];

const navItems: { id: AdminView; label: string; icon: string; badge?: number }[] = [
  { id: "overview", label: "대시보드", icon: "⌂" },
  { id: "listings", label: "상품 관리", icon: "▤", badge: 3 },
  { id: "reports", label: "신고 관리", icon: "!", badge: 4 },
  { id: "community", label: "커뮤니티", icon: "◎" },
  { id: "users", label: "회원 관리", icon: "♙" },
  { id: "settings", label: "운영 설정", icon: "⚙" },
];

const reports = [
  { id: "R-284", target: "코베아 구이바다 M 풀세트", reason: "상품 상태가 설명과 다름", reporter: "캠핑곰", age: "18분 전", severity: "높음" },
  { id: "R-283", target: "크레모아 3페이스 미니 라이트", reason: "중복 등록 의심", reporter: "초록텐트", age: "41분 전", severity: "보통" },
  { id: "R-282", target: "동계 침낭 추천 게시글", reason: "과도한 홍보성 링크", reporter: "별보는날", age: "2시간 전", severity: "낮음" },
  { id: "R-281", target: "사용자: camp_deal77", reason: "외부 결제 유도", reporter: "안전거래", age: "3시간 전", severity: "긴급" },
];

const communityPosts = [
  { title: "영하 8도, 이 조합이면 충분했어요", author: "일산밤공기", category: "필드노트", views: "1,248", comments: 36, state: "게시 중" },
  { title: "경차에 들어가는 2인 미니멀 세팅", author: "차박하는날", category: "세팅 공유", views: "986", comments: 22, state: "게시 중" },
  { title: "리빙쉘 4인 가족에게 너무 클까요?", author: "첫캠핑가족", category: "Q&A", views: "612", comments: 14, state: "검토 필요" },
];

const users = [
  { name: "성수캠퍼", email: "seongsu@camploop.kr", deals: 18, score: "4.9", joined: "2025. 11. 02", status: "정상" },
  { name: "미사워크맨", email: "misa@camploop.kr", deals: 7, score: "5.0", joined: "2026. 02. 14", status: "정상" },
  { name: "camp_deal77", email: "deal77@example.com", deals: 2, score: "3.1", joined: "2026. 08. 09", status: "검토" },
  { name: "망원노을", email: "sunset@camploop.kr", deals: 12, score: "4.8", joined: "2025. 12. 21", status: "정상" },
];

function StatusBadge({ status }: { status: string }) {
  return <span className={`admin-status status-${status.replaceAll(" ", "-")}`}>{status}</span>;
}

export default function AdminPage() {
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [listings, setListings] = useState(initialListings);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"전체" | ListingStatus>("전체");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [resolvedReports, setResolvedReports] = useState<string[]>([]);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [autoReview, setAutoReview] = useState(true);
  const [safePay, setSafePay] = useState(true);

  const filteredListings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return listings.filter((item) => {
      const matchesQuery = !normalized || `${item.title} ${item.seller} ${item.category}`.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "전체" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [listings, query, statusFilter]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const updateListing = (id: number, status: ListingStatus) => {
    setListings((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    setSelectedListing((current) => current?.id === id ? { ...current, status } : current);
    notify(status === "판매 중" ? "상품이 승인되어 판매를 시작합니다." : "상품 노출 상태를 변경했습니다.");
  };

  const resolveReport = (id: string) => {
    setResolvedReports((current) => [...current, id]);
    notify(`${id} 신고를 처리 완료했습니다.`);
  };

  const pageTitle = navItems.find((item) => item.id === activeView)?.label ?? "대시보드";

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/" aria-label="캠프루프 홈으로">
          <span className="admin-brand-mark">C</span>
          <span><b>캠프루프</b><small>ADMIN CONSOLE</small></span>
        </a>

        <nav className="admin-nav" aria-label="관리자 메뉴">
          {navItems.map((item) => (
            <button key={item.id} className={activeView === item.id ? "active" : ""} onClick={() => setActiveView(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge ? <em>{item.id === "reports" ? item.badge - resolvedReports.length : item.badge}</em> : null}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <div className="system-health"><span /> 모든 시스템 정상</div>
          <a href="/">← 캠프루프 홈</a>
        </div>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker">CAMPLOOP OPERATIONS</span>
            <h1>{pageTitle}</h1>
          </div>
          <div className="admin-top-actions">
            <label className="admin-global-search">
              <span>⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="상품·회원 검색" />
            </label>
            <div className="notice-wrap">
              <button className="notice-button" onClick={() => setNoticeOpen((open) => !open)} aria-label="알림 열기">♢<span>3</span></button>
              {noticeOpen && (
                <div className="notice-popover">
                  <b>새 알림 3개</b>
                  <p>검수 대기 상품이 3건 있습니다.</p>
                  <p>긴급 신고가 접수되었습니다.</p>
                  <p>오늘 거래액이 목표를 넘었습니다.</p>
                </div>
              )}
            </div>
            <button className="admin-profile" onClick={() => notify("관리자 계정으로 접속 중입니다.")}>
              <span>관리</span><p><b>캠프루프 운영팀</b><small>최고 관리자</small></p>
            </button>
          </div>
        </header>

        {activeView === "overview" && (
          <div className="admin-content">
            <section className="admin-welcome">
              <div>
                <span>2026년 8월 11일 · 화요일</span>
                <h2>좋은 아침이에요, 운영팀.</h2>
                <p>오늘은 상품 3건과 긴급 신고 1건을 먼저 확인해 주세요.</p>
              </div>
              <button onClick={() => setActiveView("listings")}>검수 시작하기 <span>→</span></button>
            </section>

            <section className="metric-grid" aria-label="핵심 운영 지표">
              <article><span className="metric-icon green">↗</span><p>오늘 거래액<small>어제보다 12.4%</small></p><strong>8,420,000원</strong><i className="up">+12.4%</i></article>
              <article><span className="metric-icon orange">▤</span><p>신규 등록<small>오늘 접수된 장비</small></p><strong>284건</strong><i className="up">+8.1%</i></article>
              <article><span className="metric-icon blue">♙</span><p>활성 회원<small>최근 30일 기준</small></p><strong>12,842명</strong><i className="up">+5.7%</i></article>
              <article><span className="metric-icon red">!</span><p>미처리 신고<small>긴급 1건 포함</small></p><strong>{4 - resolvedReports.length}건</strong><i className="down">확인 필요</i></article>
            </section>

            <section className="admin-dashboard-grid">
              <article className="dashboard-card transaction-chart">
                <div className="card-heading"><div><span>거래 현황</span><h3>최근 7일 거래액</h3></div><button>7일 ▾</button></div>
                <div className="chart-total"><strong>43,680,000원</strong><span>지난주 대비 9.8% 증가</span></div>
                <div className="bar-chart" aria-label="최근 7일 거래액 차트">
                  {[48, 62, 54, 73, 64, 86, 95].map((height, index) => <div key={index}><span style={{ height: `${height}%` }} className={index === 6 ? "today" : ""} /><small>{["수", "목", "금", "토", "일", "월", "오늘"][index]}</small></div>)}
                </div>
              </article>

              <article className="dashboard-card category-rank">
                <div className="card-heading"><div><span>카테고리</span><h3>거래 인기 순위</h3></div><button onClick={() => setActiveView("listings")}>전체 보기</button></div>
                {[
                  ["텐트·타프", "32%", 32, "284건"], ["테이블·체어", "24%", 24, "216건"], ["침낭·매트", "18%", 18, "162건"], ["키친", "14%", 14, "126건"]
                ].map(([name, percent, width, count], index) => (
                  <div className="rank-row" key={name as string}><b>{index + 1}</b><p><span>{name}</span><small>{count}</small></p><div><span style={{ width: `${width}%` }} /></div><em>{percent}</em></div>
                ))}
              </article>
            </section>

            <section className="dashboard-card pending-card">
              <div className="card-heading"><div><span>REVIEW QUEUE</span><h3>상품 검수 대기</h3></div><button onClick={() => setActiveView("listings")}>전체 {listings.filter((item) => item.status === "검수 대기").length}건 보기 →</button></div>
              <ListingTable items={listings.filter((item) => item.status === "검수 대기").slice(0, 3)} onSelect={setSelectedListing} onUpdate={updateListing} />
            </section>
          </div>
        )}

        {activeView === "listings" && (
          <div className="admin-content">
            <section className="view-toolbar">
              <div className="status-tabs">
                {(["전체", "검수 대기", "판매 중", "숨김"] as const).map((status) => <button className={statusFilter === status ? "active" : ""} key={status} onClick={() => setStatusFilter(status)}>{status}<span>{status === "전체" ? listings.length : listings.filter((item) => item.status === status).length}</span></button>)}
              </div>
              <button className="export-button" onClick={() => notify("현재 상품 목록을 내보낼 준비가 되었습니다.")}>목록 내보내기</button>
            </section>
            <section className="dashboard-card listing-management">
              <div className="card-heading"><div><span>LISTING CONTROL</span><h3>등록 상품 {filteredListings.length}건</h3></div><small>최근 등록순</small></div>
              <ListingTable items={filteredListings} onSelect={setSelectedListing} onUpdate={updateListing} />
            </section>
          </div>
        )}

        {activeView === "reports" && (
          <div className="admin-content">
            <section className="alert-banner"><span>!</span><div><b>긴급 신고 1건이 대기 중입니다.</b><p>외부 결제 유도 신고는 안전 거래 정책에 따라 우선 처리해 주세요.</p></div></section>
            <section className="dashboard-card report-card">
              <div className="card-heading"><div><span>SAFETY CENTER</span><h3>신고 처리함</h3></div><small>{4 - resolvedReports.length}건 미처리</small></div>
              <div className="report-list">
                {reports.map((report) => {
                  const resolved = resolvedReports.includes(report.id);
                  return <article className={resolved ? "resolved" : ""} key={report.id}><span className={`severity severity-${report.severity}`}>{report.severity}</span><div><b>{report.target}</b><p>{report.reason}</p><small>{report.id} · 신고자 {report.reporter} · {report.age}</small></div><button disabled={resolved} onClick={() => resolveReport(report.id)}>{resolved ? "처리 완료" : "검토하기"}</button></article>;
                })}
              </div>
            </section>
          </div>
        )}

        {activeView === "community" && (
          <div className="admin-content">
            <section className="metric-grid compact-metrics">
              <article><p>오늘 게시글<small>커뮤니티 전체</small></p><strong>42건</strong></article>
              <article><p>오늘 댓글<small>답변 포함</small></p><strong>318건</strong></article>
              <article><p>검토 대기<small>신고·필터 감지</small></p><strong>1건</strong></article>
            </section>
            <section className="dashboard-card content-table-card">
              <div className="card-heading"><div><span>COMMUNITY</span><h3>최근 콘텐츠</h3></div><button onClick={() => notify("커뮤니티 운영 정책을 열었습니다.")}>운영 정책</button></div>
              <div className="content-table">
                {communityPosts.map((post) => <article key={post.title}><span className="post-category">{post.category}</span><div><b>{post.title}</b><small>{post.author} · 조회 {post.views} · 댓글 {post.comments}</small></div><StatusBadge status={post.state} /><button onClick={() => notify(`‘${post.title}’ 게시글을 확인했습니다.`)}>관리</button></article>)}
              </div>
            </section>
          </div>
        )}

        {activeView === "users" && (
          <div className="admin-content">
            <section className="dashboard-card user-card">
              <div className="card-heading"><div><span>MEMBERS</span><h3>회원 관리</h3></div><button onClick={() => notify("회원 목록 필터를 초기화했습니다.")}>필터 초기화</button></div>
              <div className="user-list">
                {users.filter((user) => !query || `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())).map((user) => <article key={user.email}><span className="user-avatar">{user.name.slice(0, 1)}</span><div><b>{user.name}</b><small>{user.email}</small></div><p><b>{user.deals}회</b><small>거래</small></p><p><b>{user.score}</b><small>매너 점수</small></p><p><b>{user.joined}</b><small>가입일</small></p><StatusBadge status={user.status} /><button onClick={() => notify(`${user.name} 회원 정보를 열었습니다.`)}>상세</button></article>)}
              </div>
            </section>
          </div>
        )}

        {activeView === "settings" && (
          <div className="admin-content settings-layout">
            <section className="dashboard-card settings-card">
              <div className="card-heading"><div><span>OPERATION POLICY</span><h3>검수 및 안전 설정</h3></div></div>
              <SettingToggle label="AI 상품 사전 검수" description="금지 품목, 중복 사진, 의심 키워드를 자동으로 감지합니다." checked={autoReview} onChange={setAutoReview} />
              <SettingToggle label="안전결제 우선 노출" description="안전결제를 지원하는 상품을 탐색 화면에 우선 표시합니다." checked={safePay} onChange={setSafePay} />
              <div className="setting-field"><label htmlFor="review-time">검수 응답 목표</label><select id="review-time" defaultValue="2"><option value="1">1시간 이내</option><option value="2">2시간 이내</option><option value="4">4시간 이내</option></select></div>
              <button className="save-settings" onClick={() => notify("운영 설정을 저장했습니다.")}>설정 저장</button>
            </section>
            <aside className="settings-note"><span>운영 메모</span><h3>이번 주 집중 점검</h3><p>여름 시즌 화기류 거래가 증가하고 있습니다. 가스통 포함 여부와 점화 사진을 우선 확인해 주세요.</p><small>운영팀 · 8월 11일</small></aside>
          </div>
        )}
      </section>

      {selectedListing && (
        <div className="admin-drawer-backdrop" onMouseDown={() => setSelectedListing(null)}>
          <aside className="admin-drawer" onMouseDown={(event) => event.stopPropagation()} aria-label="상품 상세 검수">
            <button className="drawer-close" onClick={() => setSelectedListing(null)} aria-label="닫기">×</button>
            <span className="drawer-kicker">LISTING #{selectedListing.id}</span>
            <img src={selectedListing.image} alt="" />
            <StatusBadge status={selectedListing.status} />
            <h2>{selectedListing.title}</h2>
            <strong>{selectedListing.price}</strong>
            <dl><div><dt>판매자</dt><dd>{selectedListing.seller}</dd></div><div><dt>카테고리</dt><dd>{selectedListing.category}</dd></div><div><dt>등록 시각</dt><dd>{selectedListing.created}</dd></div><div><dt>신고</dt><dd>{selectedListing.reported}건</dd></div></dl>
            <div className="passport-check"><span>✓</span><p><b>장비 패스포트 확인</b><small>필수 상태 정보와 구성품 사진이 등록되었습니다.</small></p></div>
            <div className="drawer-actions"><button onClick={() => updateListing(selectedListing.id, "숨김")}>노출 중지</button><button onClick={() => updateListing(selectedListing.id, "판매 중")}>판매 승인</button></div>
          </aside>
        </div>
      )}

      {toast && <div className="admin-toast"><span>✓</span>{toast}</div>}
    </main>
  );
}

function ListingTable({ items, onSelect, onUpdate }: { items: Listing[]; onSelect: (listing: Listing) => void; onUpdate: (id: number, status: ListingStatus) => void }) {
  return (
    <div className="listing-table">
      <div className="listing-row listing-head"><span>상품</span><span>판매자</span><span>가격</span><span>상태</span><span>등록</span><span>관리</span></div>
      {items.length ? items.map((item) => (
        <div className="listing-row" key={item.id}>
          <button className="listing-product" onClick={() => onSelect(item)}><img src={item.image} alt="" /><span><b>{item.title}</b><small>#{item.id} · {item.category}{item.reported ? ` · 신고 ${item.reported}` : ""}</small></span></button>
          <span>{item.seller}</span><strong>{item.price}</strong><StatusBadge status={item.status} /><span>{item.created}</span>
          <div className="row-actions"><button onClick={() => onSelect(item)}>보기</button>{item.status === "검수 대기" ? <button className="approve" onClick={() => onUpdate(item.id, "판매 중")}>승인</button> : <button onClick={() => onUpdate(item.id, item.status === "숨김" ? "판매 중" : "숨김")}>{item.status === "숨김" ? "복구" : "숨김"}</button>}</div>
        </div>
      )) : <div className="admin-empty"><span>⌕</span><b>조건에 맞는 상품이 없습니다.</b><p>검색어나 상태 필터를 변경해 보세요.</p></div>}
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="setting-toggle"><span><b>{label}</b><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i /></label>;
}
