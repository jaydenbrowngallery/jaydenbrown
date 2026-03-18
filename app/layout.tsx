import "./globals.css";
import Script from "next/script";
import ConditionalHeader from "./ConditionalHeader";

export const metadata = {
  title: "Jayden Brown Studio",
  description: "Wedding & Portrait Photography",
};

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

        <ConditionalHeader />

        {children}

        <footer className="border-t border-black/5">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-black/45 md:flex-row md:items-center md:justify-between md:px-10">
            <p>© Jayden Brown Studio</p>
            <p>Quiet moments, warm memories.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}