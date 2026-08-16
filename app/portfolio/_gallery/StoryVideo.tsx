"use client";

import { useEffect, useRef, useState } from "react";

/* 스토리 맨 위에 사진처럼 놓이는 짧은 영상.
   컨트롤 없이 음소거·자동재생·반복이라 정지 사진과 같은 인상으로 보인다.
   화면에 들어올 때만 재생해 데이터와 배터리를 아낀다.

   깜박임을 막는 두 가지 장치
   1) 영상 파일 자체의 끝과 시작을 겹쳐 만들어 순환 지점이 이어진다.
   2) 첫 프레임이 그려진 뒤에 포스터 위로 영상을 서서히 덮는다.
      poster 속성 대신 포스터를 아래 층에 깔아 교체 순간의 번쩍임을 없앤다. */
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
  const [on, setOn] = useState(false); // 등장 연출
  const [ready, setReady] = useState(false); // 첫 프레임이 그려졌는지

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
    <div
      ref={box}
      className="relative w-full overflow-hidden bg-[#e8e4de]"
      style={{ aspectRatio: ratio }}
    >
      {/* 아래 층 — 영상이 준비되기 전에도 사진이 놓인 것처럼 보인다 */}
      {poster && (
        <img
          src={poster}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            transform: `translate3d(${on ? "0" : "5%"},0,0) scale(${on ? 1 : 1.04})`,
            filter: on ? "none" : "blur(12px)",
            transition:
              "transform 1.5s cubic-bezier(.22,1,.28,1), filter 1.1s ease-out",
          }}
        />
      )}

      <video
        ref={video}
        src={src}
        muted
        loop
        playsInline
        preload="auto"
        // 컨트롤·다운로드·PIP 를 모두 감춰 사진처럼 보이게 한다
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        aria-label={label}
        onPlaying={() => setReady(true)}
        onLoadedData={() => setReady(true)}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          // 포스터와 자리를 정확히 맞춘 뒤 부드럽게 덮는다
          opacity: ready ? 1 : 0,
          transform: `translate3d(${on ? "0" : "5%"},0,0) scale(${on ? 1 : 1.04})`,
          filter: on ? "none" : "blur(12px)",
          transition:
            "opacity 1.1s ease-in-out, transform 1.5s cubic-bezier(.22,1,.28,1), filter 1.1s ease-out",
        }}
      />

      {/* 가로 사진과 같은 등장 연출 — 커튼이 왼쪽으로 걷힌다 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#f7f5f2]"
        style={{
          transform: on ? "translate3d(-101%,0,0)" : "none",
          transition: "transform 1.15s cubic-bezier(.7,0,.2,1)",
        }}
      />
    </div>
  );
}
