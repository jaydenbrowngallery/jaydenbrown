import "./globals.css";
import Script from "next/script";
import ConditionalHeader from "./ConditionalHeader";
import ConditionalFooter from "./ConditionalFooter";
import { Suspense } from "react";
import ScrollToAnchor from "./ScrollToAnchor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jayden Brown Studio | 도동산방 돌스냅 · 고희연 · 웨딩 스냅",
  description: "울산 도동산방 전문 스냅 촬영 스튜디오. 돌스냅, 고희연, 웨딩 스냅을 담당합니다. 행복이 머문 시간을 사진 속에 고스란히 남겨드립니다.",
  keywords: ["도동산방","돌스냅","돌잔치사진","고희연","웨딩스냅","울산스냅","Jayden Brown","제이든브라운","스냅촬영"],
  metadataBase: new URL("https://jaydenbrown.kr"),
  openGraph: {
    title: "Jayden Brown Studio | 도동산방 스냅 촬영",
    description: "울산 도동산방 전문 스냅 촬영 스튜디오. 돌스냅, 고희연, 웨딩 스냅을 담당합니다.",
    url: "https://jaydenbrown.kr",
    siteName: "Jayden Brown Studio",
    images: [{ url: "/img/001.jpg", width: 1200, height: 630, alt: "Jayden Brown Studio" }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jayden Brown Studio | 도동산방 스냅 촬영",
    description: "울산 도동산방 전문 스냅 촬영 스튜디오.",
    images: ["/img/001.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#f7f5f2] text-[#111111]">
        <Script
          src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          strategy="beforeInteractive"
        />
        <Suspense fallback={null}>
          <ScrollToAnchor />
        </Suspense>
        <ConditionalHeader />
        {children}
        <ConditionalFooter />
      </body>
    </html>
  );
}
