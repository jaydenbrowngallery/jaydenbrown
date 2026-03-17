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
          onClick={() => setOpen((prev) => !prev)}
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

      {/* mobile dropdown menu */}
      {open && (
        <nav className="border-t border-black/5 bg-[#f7f5f2] md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-6 py-4">
            {menus.map((menu) => (
              <Link
                key={menu.href}
                href={menu.href}
                onClick={() => setOpen(false)}
                className="py-3 text-sm text-black/70 transition hover:text-black"
              >
                {menu.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}