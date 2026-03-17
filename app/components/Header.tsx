"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  const menus = [
    { href: "/", label: "Home" },
    { href: "/portfolio", label: "Gallery" },
    { href: "/about", label: "About" },
    { href: "/guide", label: "Guide" },
    { href: "/booking", label: "Booking" },
    { href: "/contact", label: "Contact" },
  ];

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
                className="transition hover:text-black"
              >
                {menu.label}
              </Link>
            ))}
          </nav>

          {/* mobile menu button */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center md:hidden"
            aria-label="메뉴 열기"
          >
            <div className="flex flex-col gap-1.5">
              <span className="block h-[1.5px] w-5 bg-black" />
              <span className="block h-[1.5px] w-5 bg-black" />
              <span className="block h-[1.5px] w-5 bg-black" />
            </div>
          </button>
        </div>
      </header>

      {/* mobile overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/35 transition-opacity duration-300 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* mobile slide panel */}
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-[82%] max-w-[360px] flex-col bg-[#f7f5f2] shadow-2xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.28em]">
            Menu
          </p>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center"
            aria-label="메뉴 닫기"
          >
            <span className="text-2xl leading-none text-black">×</span>
          </button>
        </div>

        <nav className="flex flex-col px-6 py-6">
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              onClick={() => setOpen(false)}
              className="border-b border-black/5 py-4 text-base text-black/75 transition hover:text-black"
            >
              {menu.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}