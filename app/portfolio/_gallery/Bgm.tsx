"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* 갤러리 배경음악.
   - 들어오면 작은 알림으로 재생 여부를 묻는다(브라우저는 사용자 동작 없이 소리를 못 낸다).
   - 오른쪽 위 음표는 아주 옅게 두고, 눌러서 켜고 끈다.
   - 선택은 기억해서(localStorage) 다음 방문에는 묻지 않는다. */

const KEY = "gallery_bgm";
const VOLUME = 0.42;

export default function Bgm({ tracks }: { tracks: string[] }) {
  const [mounted, setMounted] = useState(false);
  const [ask, setAsk] = useState(false);
  const [on, setOn] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const order = useRef<string[]>([]);
  const idx = useRef(0);

  // 재생 순서를 섞어 둔다 (같은 곡만 반복되지 않게)
  useEffect(() => {
    setMounted(true);
    const shuffled = [...tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    order.current = shuffled;
  }, [tracks]);

  const fadeTo = useCallback((target: number, done?: () => void) => {
    const el = audio.current;
    if (!el) return;
    const step = (target - el.volume) / 12;
    let n = 0;
    const t = setInterval(() => {
      n++;
      const v = Math.min(1, Math.max(0, el.volume + step));
      el.volume = v;
      if (n >= 12) {
        clearInterval(t);
        el.volume = target;
        done?.();
      }
    }, 60);
  }, []);

  const start = useCallback(async () => {
    if (!order.current.length) return;
    let el = audio.current;
    if (!el) {
      el = new Audio();
      el.preload = "none";
      el.volume = 0;
      el.addEventListener("ended", () => {
        idx.current = (idx.current + 1) % order.current.length;
        if (audio.current) {
          audio.current.src = order.current[idx.current];
          audio.current.volume = 0;
          audio.current.play().then(() => fadeTo(VOLUME)).catch(() => {});
        }
      });
      audio.current = el;
      el.src = order.current[idx.current];
    }
    try {
      await el.play();
      fadeTo(VOLUME);
      setOn(true);
      localStorage.setItem(KEY, "on");
    } catch {
      // 자동재생이 막힌 경우 — 음표를 눌러 켜도록 둔다
      setOn(false);
    }
  }, [fadeTo]);

  const stop = useCallback(() => {
    const el = audio.current;
    setOn(false);
    localStorage.setItem(KEY, "off");
    if (!el) return;
    fadeTo(0, () => el.pause());
  }, [fadeTo]);

  // 첫 방문이면 물어보고, 이전에 켜기로 했으면 조용히 시도한다
  useEffect(() => {
    if (!mounted || !tracks.length) return;
    const saved = localStorage.getItem(KEY);
    if (saved === "on") {
      start();
      return;
    }
    if (saved === "off") return;
    const t = setTimeout(() => setAsk(true), 1200);
    return () => clearTimeout(t);
  }, [mounted, tracks.length, start]);

  useEffect(() => () => audio.current?.pause(), []);

  if (!mounted || !tracks.length) return null;

  return createPortal(
    <>
      {/* 오른쪽 위 음표 — 아주 옅게 */}
      <button
        onClick={() => (on ? stop() : start())}
        aria-label={on ? "배경음악 끄기" : "배경음악 켜기"}
        className="fixed right-4 top-[86px] z-40 grid h-11 w-11 place-items-center rounded-full border transition md:right-7 md:top-[96px]"
        style={{
          // 사진 위에 놓이므로 원형 테두리와 옅은 배경을 줘서 위치가 보이게 한다
          borderColor: on ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.16)",
          backgroundColor: on ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.68)",
          color: on ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.42)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 18V6l10-2v12" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="16.5" cy="16" r="2.5" />
          {!on && <path d="M3 3l18 18" strokeLinecap="round" />}
        </svg>
      </button>

      {/* 들어올 때 작은 알림 */}
      {ask && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-5 [animation:bgmup_.5s_cubic-bezier(.16,1,.3,1)]">
          <div className="flex items-center gap-3 rounded-full border border-black/8 bg-white/92 py-2.5 pl-5 pr-2.5 shadow-[0_6px_28px_rgba(0,0,0,0.10)] backdrop-blur">
            <span className="text-[12.5px] text-black/60">배경음악과 함께 보시겠어요?</span>
            <button
              onClick={() => {
                setAsk(false);
                start();
              }}
              style={{ color: "#fff" }}
              className="rounded-full bg-black px-3.5 py-1.5 text-[12px] font-medium"
            >
              ON
            </button>
            <button
              onClick={() => {
                setAsk(false);
                localStorage.setItem(KEY, "off");
              }}
              className="rounded-full px-2.5 py-1.5 text-[12px] text-black/40"
            >
              OFF
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes bgmup {
          from { opacity: 0; transform: translate3d(0, 14px, 0) }
          to   { opacity: 1; transform: none }
        }
      `}</style>
    </>,
    document.body
  );
}
