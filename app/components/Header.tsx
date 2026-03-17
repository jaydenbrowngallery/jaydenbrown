"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const menus = [
    { href: "/", label: "Home" },
    { href: "/portfolio", label: "Gallery" },
    { href: "/about", label: "About" },
    { href: "/guide", label: "Guide" },
    { href: "/booking", label: "Booking" },
    { href: "/contact", label: "Contact" },
  ];

  // 모바일 메뉴 열리면 배경 스크롤 막기
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f7f5f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.28em]"
          >
            Jayden Brown
          </Link>

          {/* desktop menu */}
          <nav className="hidden items-center gap-8 text-sm text-black/60 md:flex">
            {menus.map((menu) => (
              <Link
                key={menu.href}
                href={menu.href}
                className={`transition ${
                  isActive(menu.href)
                    ? "text-black"
                    : "text-black/60 hover:text-black"
                }`}
              >
                {menu.label}
              </Link>
            ))}
          </nav>

          {/* mobile open button */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center md:hidden"
            aria-label="메뉴 열기"
            aria-expanded={open}
          >
            <div className="flex flex-col gap-1.5">
              <span className="block h-[1.5px] w-5 bg-black" />
              <span className="block h-[1.5px] w-5 bg-black" />
              <span className="block h-[1.5px] w-5 bg-black" />
            </div>
          </button>
        </div>
      </header>

      {/* overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/55 transition duration-300 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* slide panel */}
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-[84%] max-w-[380px] flex-col bg-[#111111] text-white shadow-2xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {/* top */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Menu
            </p>
            <p className="mt-2 text-sm font-medium text-white/90">
              Jayden Brown Studio
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="메뉴 닫기"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        {/* navigation */}
        <nav className="flex flex-1 flex-col px-6 py-6">
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              onClick={() => setOpen(false)}
              className={`group flex items-center justify-between border-b border-white/10 py-4 text-base transition ${
                isActive(menu.href)
                  ? "text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <span>{menu.label}</span>
              <span
                className={`text-xs transition ${
                  isActive(menu.href)
                    ? "text-white/70"
                    : "text-white/25 group-hover:text-white/50"
                }`}
              >
                →
              </span>
            </Link>
          ))}
        </nav>

        {/* bottom */}
        <div className="border-t border-white/10 px-6 py-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/30">
            Quiet moments
          </p>
          <p className="mt-3 text-sm leading-6 text-white/60">
            편안한 분위기 속에서 오래 남을 순간을 담습니다.
          </p>
        </div>
      </aside>
    </>
  );
}