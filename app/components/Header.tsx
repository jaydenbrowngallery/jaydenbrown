"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/isAdmin";
import { usePathname } from "next/navigation";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const pathname = usePathname();

  const menus = [
    { href: "/", label: "Home" },
    { href: "/portfolio", label: "Gallery" },
    { href: "/about", label: "About" },
    { href: "/guide", label: "Guide" },
    { href: "/booking", label: "Booking" },
    { href: "/contact", label: "Contact" },
  ];

  // 로그인 상태 확인
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setAdmin(isAdmin(user?.email));
    };

    checkUser();
  }, []);

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
    location.reload();
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
                  pathname === menu.href
                    ? "text-black"
                    : "text-black/60 hover:text-black"
                }`}
              >
                {menu.label}
              </Link>
            ))}

            {/* 로그인 상태 */}
            {!admin ? (
              <Link href="/login" className="text-black">
                Login
              </Link>
            ) : (
              <>
                <Link href="/admin/gallery" className="text-black">
                  Admin
                </Link>
                <button onClick={handleLogout} className="text-black">
                  Logout
                </button>
              </>
            )}
          </nav>

          {/* 모바일 버튼 */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden"
          >
            ☰
          </button>
        </div>
      </header>

      {/* 모바일 메뉴 */}
      <div
        className={`fixed inset-0 bg-black/60 z-50 transition ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      <div
        className={`fixed right-0 top-0 h-full w-[80%] bg-[#111] text-white z-50 transform transition ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 space-y-6">
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              onClick={() => setOpen(false)}
              className="block"
            >
              {menu.label}
            </Link>
          ))}

          <hr className="border-white/20" />

          {!admin ? (
            <Link href="/login">Login</Link>
          ) : (
            <>
              <Link href="/admin/gallery">Admin</Link>
              <button onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}