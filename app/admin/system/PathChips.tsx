"use client";

import { useState } from "react";

/* 폴더 경로 칩 — 누르면 경로가 복사된다.
   브라우저가 file:// 이동을 막기 때문에 '복사 → Finder에서 ⌘⇧G 붙여넣기' 방식이 가장 확실하다.
   Pegasus는 맥미니와 작업용 맥 양쪽에 같은 경로로 마운트되어 있어 복사한 경로가 그대로 통한다. */
export default function PathChips({ paths }: { paths: string[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function copy(p: string) {
    try {
      await navigator.clipboard.writeText(p);
      setFailed(false);
      setCopied(p);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="mt-3.5 pl-[30px]">
      <div className="flex flex-wrap items-center gap-1.5">
        {paths.map((p) => {
          const label = p.replace("/Volumes/Promise Pegasus/", "").replace("맥미니메인/", "");
          return (
            <button
              key={p}
              onClick={() => copy(p)}
              title={p}
              className="rounded-full border border-black/12 bg-white px-3 py-1.5 text-[12px] text-black/55 transition hover:border-black/30"
            >
              <span className="mr-1 opacity-50">📁</span>
              {label}
              {copied === p && <span className="ml-1.5 text-[#0f7a37]">복사됨</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-black/30">
        {failed
          ? "복사가 막혔습니다. 칩에 마우스를 올리면 전체 경로가 보입니다."
          : "누르면 경로가 복사됩니다 · Finder에서 ⌘⇧G 후 붙여넣기"}
      </p>
    </div>
  );
}
