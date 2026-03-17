import "./globals.css";
import Header from "./components/Header";

export const metadata = {
  title: "Jayden Brown Studio",
  description: "Wedding & Portrait Photography",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-[#f7f5f2] text-[#111111]">
        <Header />

        {children}

        <footer className="border-t border-black/5">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-black/45 md:px-10 md:flex-row md:items-center md:justify-between">
            <p>© Jayden Brown Studio</p>
            <p>Quiet moments, warm memories.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}