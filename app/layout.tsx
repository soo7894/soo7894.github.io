import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "캠프루프 | 캠핑을 아는 중고거래",
  description:
    "중고 캠핑용품의 상태와 호환성을 확인하고, 실제 캠퍼의 경험을 나누는 캠핑 특화 거래 커뮤니티입니다.",
  keywords: ["중고 캠핑용품", "캠핑장비", "중고거래", "캠핑 커뮤니티"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
