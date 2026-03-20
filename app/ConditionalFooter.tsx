"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import QuickLinks from "./QuickLinks";

export default function ConditionalFooter() {
  const pathname = usePathname();
  const isBookingForm = pathname.startsWith("/booking-private-jb2026");
  const isGalleryDetail = pathname.startsWith("/portfolio/") && pathname !== "/portfolio";

  if (isBookingForm || isGalleryDetail) return null;

  return (
    <>
      <QuickLinks />
      <footer className="border-t border-black/5">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-black/45">
          <Link href="/login" className="hover:text-black/70 transition">
            © Jayden Brown Studio
          </Link>
        </div>
      </footer>
    </>
  );
}
