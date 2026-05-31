"use client";

import { usePathname } from "next/navigation";
import Header from "./components/Header";

export default function ConditionalHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isGalleryDetail = pathname.startsWith("/portfolio/") && pathname !== "/portfolio";
  const isBookingForm = pathname.startsWith("/booking-private-jb2026");
  const isSwingDiary = pathname.startsWith("/swingdiary");

  if (isHome || isGalleryDetail || isBookingForm || isSwingDiary) return null;

  return <Header />;
}
