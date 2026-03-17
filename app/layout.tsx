import "./globals.css";

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
        <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f7f5f2]/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
            <a
              href="/"
              className="text-sm font-semibold tracking-[0.28em] uppercase"
            >
              Jayden Brown
            </a>

            <nav className="hidden items-center gap-8 text-sm text-black/60 md:flex">
              <a href="/" className="transition hover:text-black">
                Home
              </a>
              <a href="/portfolio" className="transition hover:text-black">
                Portfolio
              </a>
              <a href="/about" className="transition hover:text-black">
                About
              </a>
              <a href="/guide" className="transition hover:text-black">
                Guide
              </a>
              <a href="/booking" className="transition hover:text-black">
                Booking
              </a>
              <a href="/contact" className="transition hover:text-black">
                Contact
              </a>
            </nav>
          </div>
        </header>

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