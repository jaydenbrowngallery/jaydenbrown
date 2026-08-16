"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Story } from "./page";
import { focalPosition, type Focus } from "./focus";
import { buildRows } from "./mosaic";

/* ────────────────────────────────────────────────────────────────
   갤러리 리디자인 — 에디토리얼 톤 + 스크롤 연출
   모바일 우선. 애니메이션은 transform/opacity 만 사용하고,
   지원 브라우저에서는 CSS 스크롤 기반 애니메이션과 View Transition 을 쓴다.
   ──────────────────────────────────────────────────────────────── */

/** 화면에 들어올 때 한 번만 나타나는 래퍼 (IntersectionObserver) */
function Reveal({
  children,
  delay = 0,
  y = 28,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : `translate3d(0,${y}px,0)`,
        transition: `opacity 1s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 1.1s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** 아래에서 위로 열리며 드러나는 이미지 + 미세 확대 */
function RevealImage({
  src,
  alt,
  ratio = "3/4",
  priority = false,
  onClick,
  sizes = "100vw",
  focus,
  pos,
}: {
  src: string;
  alt: string;
  ratio?: string;
  priority?: boolean;
  onClick?: () => void;
  sizes?: string;
  focus?: Focus;
  pos?: string; // 관리자가 직접 잡은 구도 (있으면 자동 계산보다 우선)
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [on, setOn] = useState(priority);
  useEffect(() => {
    const el = ref.current;
    if (!el || priority) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [priority]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      aria-label={alt}
      className="group relative block w-full overflow-hidden bg-[#e8e4de]"
      style={{ aspectRatio: ratio }}
    >
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        sizes={sizes}
        className="h-full w-full object-cover"
        style={{
          // 검출된 인물이 모두 들어오도록, 치우친 쪽으로 살짝 더 이동한 위치
          objectPosition: pos || focalPosition(focus, ratio),
          transform: on ? "scale(1)" : "scale(1.08)",
          filter: on ? "none" : "blur(12px)",
          transition: "transform 1.6s cubic-bezier(.16,1,.3,1), filter 1.2s ease-out",
        }}
      />
      {/* 위에서 아래로 걷히는 커튼 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#f7f5f2]"
        style={{
          transform: on ? "translate3d(0,-101%,0)" : "none",
          transition: "transform 1.25s cubic-bezier(.76,0,.24,1)",
        }}
      />
    </button>
  );
}

/** 글자 단위로 올라오는 제목 */
function SplitTitle({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const chars = useMemo(() => Array.from(text), [text]);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 120 + delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <span className={className} aria-label={text}>
      {chars.map((c, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <span
            className="inline-block"
            style={{
              transform: on ? "none" : "translate3d(0,110%,0)",
              transition: `transform 1s cubic-bezier(.16,1,.3,1) ${i * 34}ms`,
            }}
          >
            {c === " " ? " " : c}
          </span>
        </span>
      ))}
    </span>
  );
}

export default function GalleryDior({ stories }: { stories: Story[] }) {
  const flat = useMemo(
    () => stories.flatMap((s) => s.images.map((sh) => ({ ...sh, title: s.title, season: s.season }))),
    [stories]
  );
  const hero = flat[0];
  // url → 인덱스. findIndex 가 -1 을 돌려주면 라이트박스가 빈 검은 화면이 된다.
  const indexOf = useMemo(() => {
    const m = new Map<string, number>();
    flat.forEach((f, i) => {
      if (!m.has(f.url)) m.set(f.url, i);
    });
    return m;
  }, [flat]);
  const [open, setOpen] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroShift, setHeroShift] = useState(0);

  // 상단 진행 바 + 히어로 패럴랙스 (rAF 로 묶어 스크롤당 1회만 계산)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
        const h = heroRef.current;
        if (h) {
          const rect = h.getBoundingClientRect();
          if (rect.bottom > 0) setHeroShift(Math.min(120, -rect.top * 0.18));
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // 라이트박스: View Transition 지원 시 부드럽게 전환
  const openAt = useCallback((i: number | undefined) => {
    if (i === undefined || i < 0) return; // 못 찾은 경우 열지 않는다
    const run = () => setOpen(i);
    const d = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (d.startViewTransition) d.startViewTransition(run);
    else run();
  }, []);

  // 키보드 · 스와이프
  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((v) => (v === null ? v : (v + 1) % flat.length));
      if (e.key === "ArrowLeft") setOpen((v) => (v === null ? v : (v - 1 + flat.length) % flat.length));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, flat.length]);

  const touch = useRef<{ x: number; y: number } | null>(null);

  if (!flat.length) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f5f2] px-6 text-center">
        <p className="text-[14px] text-black/45">
          등록된 갤러리 사진이 없습니다.
          <br />
          관리자 갤러리에서 사진을 올린 뒤 다시 확인해주세요.
        </p>
      </main>
    );
  }

  return (
    <main className="bg-[#f7f5f2] text-[#141414]">
      {/* 스크롤 진행 바 */}
      <div className="pointer-events-none fixed left-0 top-0 z-40 h-[2px] w-full bg-black/[0.06]">
        <div
          className="h-full bg-black/70"
          style={{ width: `${progress * 100}%`, transition: "width .12s linear" }}
        />
      </div>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative h-[100svh] overflow-hidden">
        <img
          src={hero.url}
          alt=""
          className="absolute inset-0 h-[115%] w-full object-cover"
          style={{
            objectPosition: hero.pos || focalPosition(hero.focus, "9/19"),
            transform: `translate3d(0,${heroShift}px,0) scale(1.02)`,
            willChange: "transform",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/55" />

        <div className="absolute inset-x-0 bottom-0 px-6 pb-16 md:px-12 md:pb-20">
          <p className="mb-5 text-[10.5px] uppercase tracking-[0.42em] text-white/70">
            Jayden Brown Studio
          </p>
          <h1 className="text-[13vw] font-light leading-[0.92] tracking-[-0.03em] text-white md:text-[6.4vw]">
            <SplitTitle text="Gallery" />
          </h1>
          <p className="mt-6 max-w-sm text-[13px] leading-[1.9] text-white/70 md:text-[14px]">
            행복이 머문 시간을 그대로 담았습니다.
            <br />
            천천히 내려가며 감상해보세요.
          </p>
        </div>

        {/* 스크롤 유도 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <span className="block h-10 w-[1px] overflow-hidden bg-white/25">
            <span className="block h-full w-full origin-top bg-white/80 [animation:scrollcue_2.2s_cubic-bezier(.76,0,.24,1)_infinite]" />
          </span>
        </div>
      </section>

      {/* ── 인트로 ── */}
      <section className="px-6 py-24 md:px-12 md:py-36">
        <div className="mx-auto max-w-2xl">
          {[
            "예뻐 보이려 애쓰지 않아도 됩니다.",
            "그저 그 순간을 편안하게 느껴주세요.",
            "행복은 곁에 있다는 것만으로 이미 시작되니까요.",
          ].map((line, i) => (
            <Reveal key={i} delay={i * 140} y={22}>
              <p className="text-[17px] font-light leading-[1.9] tracking-[-0.01em] text-black/70 md:text-[22px] md:leading-[1.85]">
                {line}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 가로 스크롤 스트립 ── */}
      <section className="pb-24 md:pb-32">
        <Reveal>
          <div className="mb-5 flex items-baseline justify-between px-6 md:px-12">
            <p className="text-[10.5px] uppercase tracking-[0.36em] text-black/35">Selected</p>
            <p className="text-[11px] text-black/30">밀어서 보기 →</p>
          </div>
        </Reveal>
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-3 md:gap-5 md:px-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ overscrollBehaviorX: "contain", scrollBehavior: "smooth" }}
        >
          {stories.map((s, i) => (
            <div key={s.id} className="w-[74vw] shrink-0 snap-center md:w-[30vw]">
              <RevealImage
                src={s.cover.url}
                focus={s.cover.focus}
                pos={s.cover.pos}
                alt={s.title}
                ratio="3/4"
                sizes="(max-width:768px) 74vw, 30vw"
                onClick={() => openAt(indexOf.get(s.cover.url))}
              />
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-[12.5px] tracking-[0.02em] text-black/60">{s.title}</p>
                <p className="text-[11px] text-black/30">{s.season}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 스토리별 에디토리얼 ── */}
      {stories.map((s, si) => (
        <section key={s.id} className="border-t border-black/[0.07] py-20 md:py-32">
          <div className="md:flex md:gap-12 md:px-12">
            {/* 캡션 — 데스크톱에서는 붙어서 따라온다 */}
            <div className="px-6 md:sticky md:top-24 md:h-fit md:w-[26%] md:px-0">
              <Reveal>
                <p className="text-[10.5px] uppercase tracking-[0.36em] text-black/30">
                  {String(si + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 text-[26px] font-light leading-[1.25] tracking-[-0.02em] text-black/80 md:text-[30px]">
                  {s.title}
                </h2>
                <p className="mt-3 text-[11.5px] tracking-[0.14em] text-black/35">{s.season}</p>
                {s.note && (
                  <p className="mt-6 text-[13px] leading-[1.95] text-black/50">{s.note}</p>
                )}
              </Reveal>
            </div>

            {/* 이미지 — 크기·방향을 섞은 행 단위 모자이크 (한 행 안에서는 같은 비율) */}
            <div className="mt-8 md:mt-0 md:w-[74%]">
              {buildRows(s.images).map((row, ri) => (
                <div
                  key={ri}
                  className={`mb-3 md:mb-5 ${row.items.length === 2 ? "grid grid-cols-2 gap-3 md:gap-5" : ""}`}
                >
                  {row.items.map((sh) => (
                    <RevealImage
                      key={sh.url}
                      src={sh.url}
                      focus={sh.focus}
                      pos={sh.pos}
                      alt={s.title}
                      ratio={row.ratio}
                      priority={ri === 0}
                      sizes={
                        row.items.length === 2
                          ? "(max-width:768px) 50vw, 37vw"
                          : "(max-width:768px) 100vw, 74vw"
                      }
                      onClick={() => openAt(indexOf.get(sh.url))}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ── 맺음 ── */}
      <section className="border-t border-black/[0.07] px-6 py-28 text-center md:px-12 md:py-40">
        <Reveal>
          <p className="text-[10.5px] uppercase tracking-[0.36em] text-black/30">Contact</p>
          <h2 className="mt-5 text-[26px] font-light leading-[1.35] tracking-[-0.02em] text-black/80 md:text-[36px]">
            당신의 오늘도
            <br />
            선물처럼 남기고 싶습니다.
          </h2>
          <a
            href="/contact"
            className="mt-10 inline-block rounded-full bg-black px-9 py-4 text-[13.5px] font-medium text-white transition hover:bg-black/85"
          >
            촬영 문의하기
          </a>
        </Reveal>
      </section>

      {/* ── 라이트박스 ── */}
      {open !== null && flat[open] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 [animation:fadein_.3s_ease-out]"
          onClick={() => setOpen(null)}
          onTouchStart={(e) => {
            const t = e.touches[0];
            touch.current = { x: t.clientX, y: t.clientY };
          }}
          onTouchEnd={(e) => {
            const s = touch.current;
            if (!s) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - s.x;
            const dy = t.clientY - s.y;
            touch.current = null;
            if (Math.abs(dy) > 90 && Math.abs(dy) > Math.abs(dx)) return setOpen(null);
            if (Math.abs(dx) > 55) {
              setOpen((v) =>
                v === null ? v : (v + (dx < 0 ? 1 : -1) + flat.length) % flat.length
              );
            }
          }}
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] tracking-[0.2em] text-white/35">
            LOADING
          </span>
          <img
            key={flat[open].url}
            src={flat[open].url}
            alt=""
            onLoad={(e) => {
              const prev = (e.target as HTMLImageElement).previousElementSibling as HTMLElement | null;
              if (prev) prev.style.display = "none";
            }}
            className="absolute inset-0 m-auto max-h-[86vh] max-w-[94vw] object-contain [animation:zoomin_.45s_cubic-bezier(.16,1,.3,1)]"
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5 text-white/70">
            <span className="text-[12px] tracking-[0.08em]">
              {String(open + 1).padStart(2, "0")} / {String(flat.length).padStart(2, "0")}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(null);
              }}
              className="text-[12px] tracking-[0.1em]"
            >
              CLOSE
            </button>
          </div>
          <p className="absolute inset-x-0 bottom-0 px-5 py-6 text-center text-[11.5px] text-white/45">
            좌우로 밀어 넘기기 · 아래로 밀어 닫기
          </p>
        </div>
      )}

      <style jsx global>{`
        @keyframes scrollcue {
          0% { transform: scaleY(0); transform-origin: top; }
          45% { transform: scaleY(1); transform-origin: top; }
          55% { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }
        @keyframes fadein { from { opacity: 0 } to { opacity: 1 } }
        @keyframes zoomin {
          from { opacity: 0; transform: scale(.94) }
          to { opacity: 1; transform: scale(1) }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
        }
      `}</style>
    </main>
  );
}
