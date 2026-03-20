import "./globals.css";
import Script from "next/script";
import ConditionalHeader from "./ConditionalHeader";
import ConditionalFooter from "./ConditionalFooter";
import { Suspense } from "react";
import ScrollToAnchor from "./ScrollToAnchor";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
