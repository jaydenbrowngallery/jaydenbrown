"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

export default function HomePage() {
  const router = useRouter();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePressStart = () => {
    pressTimer.current = setTimeout(() => {
      router.push("/login");
    }, 1500); // 1.5초 길게 누르기
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <main className="bg-[#f7f5f2] text-[#111111]">
      <section className="mx-auto max-w-7xl px-6 pb-4 pt-6 md:px-10 md:pb-24 md:pt-20">
        <div className="grid items-center gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
          <div className="order-2 md:order-1">
            <p
              className="mb-3 text-[11px] uppercase tracking-[0.32em] text-black/30 select-none cursor-default"
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
            >
              Jayden Brown Studio
            </p>

            <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.05em] text-black md:text-[4.8rem]">
              행복이 머문 시간은,
              <br />
              사진 속에도
              <br />
              고스란히 남습니다.
            </h1>

            <div className="mt-4 max-w-2xl space-y-3 text-[14px] leading-7 text-black/45 md:text-[18px] md:leading-8">
              <p>
                훗날 사진을 꺼내 보며 웃음 지을 수 있으려면,
                <br />
                촬영하는 지금 이 순간이 온전히 행복해야 합니다.
              </p>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="overflow-hidden rounded-[24px] bg-[#ece7e1] shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:rounded-[30px]">
              <div
                className="aspect-[4/3] w-full bg-cover bg-center md:aspect-[4/5]"
                style={{ backgroundImage: "url('/img/001.jpg')" }}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
