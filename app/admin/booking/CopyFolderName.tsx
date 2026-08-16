"use client";

import { useState } from "react";

/* 폴더명 복사 버튼 — 달력의 일정 위에 겹쳐 두고, 누르면
   "2026년 8월 15일 박시후 도동산방" 형식이 클립보드에 담긴다.
   일정 카드가 Link 라서 클릭이 링크로 새어나가지 않게 기본동작을 막는다. */
export default function CopyFolderName({ text }: { text: string }) {
  const [done, setDone] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드 권한이 없을 때를 위한 대비책
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      document.body.removeChild(ta);
    }
    setDone(true);
    setTimeout(() => setDone(false), 1400);
  }

  return (
    <button
      onClick={copy}
      title={`폴더명 복사 — ${text}`}
      aria-label="폴더명 복사"
      className={`absolute right-1 top-1 z-10 grid h-[18px] w-[18px] place-items-center rounded-md border text-[9px] leading-none transition ${
        done
          ? "border-[#0f7a37]/40 bg-[#0f7a37] text-white"
          : "border-black/10 bg-white/85 text-black/45 hover:border-black/30 hover:text-black/70"
      }`}
    >
      {done ? "✓" : "📋"}
    </button>
  );
}
