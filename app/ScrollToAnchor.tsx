"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ScrollToAnchor() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;

    // 살짝 딜레이 후 부드럽게 스크롤
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, [pathname, searchParams]);

  return null;
}
