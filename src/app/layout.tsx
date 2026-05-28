import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "노동뉴스 비서",
  description: "노조·사용자·정부·법원 4개 카테고리 노동뉴스 브리핑",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
