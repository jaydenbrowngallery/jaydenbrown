import "./globals.css";
import Script from "next/script";
import ConditionalHeader from "./ConditionalHeader";
import QuickLinks from "./QuickLinks";
import { Suspense } from "react";
import ScrollToAnchor from "./ScrollToAnchor";
import Link from "next/link";

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

        <QuickLinks />

        <footer className="border-t border-black/5">
          <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-black/45">
            <Link href="/login" className="hover:text-black/70 transition">
              © Jayden Brown Studio
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
