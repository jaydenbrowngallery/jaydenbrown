"use client";

import { Menu } from "lucide-react";
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
    { href: "/admin/booking", label: "Booking" },
    { href: "/contact", label: "Contact" },
  ];

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setAdmin(isAdmin(user?.email));
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAdmin(isAdmin(session?.user?.email));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

          <button
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-black/5 active:scale-95 md:hidden"
            aria-label="메뉴 열기"
          >
            <Menu size={22} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 bg-black/60 transition ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      <div
        className={`fixed right-0 top-0 z-50 h-full w-[80%] transform bg-[#111] text-white transition ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="space-y-6 p-6">
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
            <Link href="/login" onClick={() => setOpen(false)}>
              Login
            </Link>
          ) : (
            <>
              <Link href="/admin/gallery" onClick={() => setOpen(false)}>
                Admin
              </Link>
              <button onClick={handleLogout} className="block text-left">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}