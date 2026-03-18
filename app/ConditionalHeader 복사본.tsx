"use client";

import { usePathname } from "next/navigation";
import Header from "./components/Header";

export default function ConditionalHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) return null;

  return <Header />;
}