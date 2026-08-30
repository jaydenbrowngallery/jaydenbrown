"use client";

import { useEffect, useRef, useState } from "react";

/* 스토리 안에 사진처럼 놓이는 짧은 영상.
   컨트롤 없이 음소거·자동재생이라 정지 사진과 같은 인상으로 보인다.
   화면에 들어올 때만 재생해 데이터와 배터리를 아낀다.

   순환 지점의 깜박임을 없애는 3중 장치
   1) 영상 두 개를 겹쳐 두고, 한쪽이 끝나갈 때 다른 쪽을 처음부터 재생하며
      서로 교차 페이드한다. loop 속성의 되감기 순간을 아예 보여주지 않는다.
   2) 파일 자체도 끝 0.6초가 첫 0.6초로 녹아들게 만들어, 겹치는 동안 그림이 어긋나지 않는다.
   3) 아래에 포스터를 깔아 두어 첫 프레임이 준비될 때까지 빈 자리가 보이지 않는다. */

const FADE = 0.6; // 겹치며 교차하는 시간(초)

export default function StoryVideo({
  src,
  poster,
  ratio = "16/9",
  label,
  align = "center",
}: {
  src: string;
  poster?: string;
  ratio?: string;
  label?: string;
  /** 화면비를 좁게 줄 때 어느 쪽을 남길지 — 오른쪽을 잘라내려면 "left center" */
  align?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false); // 등장 연출
  const [ready, setReady] = useState(false); // 첫 프레임이 그려졌는지
  const [front, setFront] = useState(0); // 지금 보이는 쪽
  const [live, setLive] = useState(false); // 화면 안에 있는지

  // 화면에 들어오면 재생, 나가면 둘 다 멈춘다
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setOn(true);

    const io = new IntersectionObserver(
      ([e]) => {
        setOn((v) => v || e.isIntersecting);
        if (e.isIntersecting) {
          if (!reduce) setLive(true);
        } else {
          setLive(false);
          a.current?.pause();
          b.current?.pause();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 앞쪽을 재생하고, 끝이 가까워지면 뒤쪽을 처음부터 띄워 교차한다
  useEffect(() => {
    if (!live) return;
    const vids = [a.current, b.current];
    const cur = vids[front];
    const next = vids[1 - front];
    if (!cur || !next) return;

    cur.play().catch(() => {});
    let raf = 0;
    const tick = () => {
      const d = cur.duration;
      if (d && cur.currentTime >= d - FADE) {
        next.currentTime = 0;
        next.play().catch(() => {});
        setFront((f) => 1 - f);
        return; // 다음 사이클은 새 앞쪽을 기준으로 다시 걸린다
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [live, front]);

  // 뒤로 물러난 영상은 페이드가 끝난 뒤 멈추고 처음으로 되감는다
  useEffect(() => {
    const back = [a.current, b.current][1 - front];
    if (!back) return;
    const t = setTimeout(() => {
      back.pause();
      back.currentTime = 0;
    }, FADE * 1000 + 120);
    return () => clearTimeout(t);
  }, [front]);

  const shared = {
    src,
    muted: true,
    playsInline: true,
    preload: "auto" as const,
    // 컨트롤·다운로드·PIP 를 모두 감춰 사진처럼 보이게 한다
    controls: false,
    disablePictureInPicture: true,
    controlsList: "nodownload noplaybackrate noremoteplayback",
    className: "absolute inset-0 h-full w-full object-cover",
  };

  const layer = (isFront: boolean) => ({
    objectPosition: align,
    opacity: ready && isFront ? 1 : 0,
    transform: `translate3d(${on ? "0" : "5%"},0,0) scale(${on ? 1 : 1.04})`,
    filter: on ? "none" : "blur(12px)",
    transition: `opacity ${FADE}s linear, transform 1.5s cubic-bezier(.22,1,.28,1), filter 1.1s ease-out`,
  });

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
            objectPosition: align,
            transform: `translate3d(${on ? "0" : "5%"},0,0) scale(${on ? 1 : 1.04})`,
            filter: on ? "none" : "blur(12px)",
            transition: "transform 1.5s cubic-bezier(.22,1,.28,1), filter 1.1s ease-out",
          }}
        />
      )}

      <video
        {...shared}
        ref={a}
        aria-label={label}
        onLoadedData={() => setReady(true)}
        onPlaying={() => setReady(true)}
        style={layer(front === 0)}
      />
      <video {...shared} ref={b} aria-hidden style={layer(front === 1)} />

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
