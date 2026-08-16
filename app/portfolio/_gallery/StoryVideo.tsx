"use client";

import { useEffect, useRef, useState } from "react";

/* 스토리 맨 위에 사진처럼 놓이는 짧은 영상.
   컨트롤 없이 음소거·자동재생·반복이라 정지 사진과 같은 인상으로 보인다.
   화면에 들어올 때만 재생해 데이터와 배터리를 아낀다. */
export default function StoryVideo({
  src,
  poster,
  ratio = "16/9",
  label,
}: {
  src: string;
  poster?: string;
  ratio?: string;
  label?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = box.current;
    const v = video.current;
    if (!el || !v) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setOn(true);

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          if (!reduce) v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className="relative w-full overflow-hidden bg-[#e8e4de]" style={{ aspectRatio: ratio }}>
      <video
        ref={video}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        // 컨트롤·다운로드·PIP 를 모두 감춰 사진처럼 보이게 한다
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        aria-label={label}
        className="h-full w-full object-cover"
        style={{
          transform: on ? "scale(1)" : "scale(1.06)",
          transition: "transform 1.8s cubic-bezier(.16,1,.3,1)",
        }}
      />
      {/* 사진과 같은 등장 연출 — 커튼이 왼쪽으로 걷힌다(가로 화면이므로) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#f7f5f2]"
        style={{
          transform: on ? "translate3d(-101%,0,0)" : "none",
          transition: "transform 1.2s cubic-bezier(.7,0,.2,1)",
        }}
      />
    </div>
  );
}
