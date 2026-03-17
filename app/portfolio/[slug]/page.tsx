"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const galleryGroups = [
  {
    slug: "dol-snap-01",
    title: "돌스냅",
    description: "편안한 분위기 속에서 기록한 돌잔치 순간들",
    images: [
      { id: 1, label: "Moment 01", tone: "bg-[#d8d2cc]" },
      { id: 2, label: "Moment 02", tone: "bg-[#e5dfd9]" },
      { id: 3, label: "Moment 03", tone: "bg-[#d4cec8]" },
      { id: 4, label: "Moment 04", tone: "bg-[#e9e3dd]" },
      { id: 5, label: "Moment 05", tone: "bg-[#ddd7d1]" },
    ],
  },
  {
    slug: "wedding-snap-01",
    title: "웨딩스냅",
    description: "과한 연출보다 자연스러운 흐름을 담은 웨딩 기록",
    images: [
      { id: 1, label: "Moment 01", tone: "bg-[#e3ddd7]" },
      { id: 2, label: "Moment 02", tone: "bg-[#d9d3cd]" },
      { id: 3, label: "Moment 03", tone: "bg-[#ece6e0]" },
      { id: 4, label: "Moment 04", tone: "bg-[#d7d1ca]" },
      { id: 5, label: "Moment 05", tone: "bg-[#e7e1da]" },
    ],
  },
  {
    slug: "family-snap-01",
    title: "가족촬영",
    description: "함께 머무는 공기와 표정을 조용히 담은 시간",
    images: [
      { id: 1, label: "Moment 01", tone: "bg-[#d4cec8]" },
      { id: 2, label: "Moment 02", tone: "bg-[#e5dfd9]" },
      { id: 3, label: "Moment 03", tone: "bg-[#d9d3cd]" },
      { id: 4, label: "Moment 04", tone: "bg-[#eae4de]" },
      { id: 5, label: "Moment 05", tone: "bg-[#ddd7d1]" },
    ],
  },
  {
    slug: "birthday-snap-01",
    title: "고희연 · 생신",
    description: "오래 기억될 자리를 단정하고 따뜻하게 기록",
    images: [
      { id: 1, label: "Moment 01", tone: "bg-[#e7e1da]" },
      { id: 2, label: "Moment 02", tone: "bg-[#d8d2cc]" },
      { id: 3, label: "Moment 03", tone: "bg-[#e3ddd7]" },
      { id: 4, label: "Moment 04", tone: "bg-[#d4cec8]" },
      { id: 5, label: "Moment 05", tone: "bg-[#ece6e0]" },
    ],
  },
  {
    slug: "wedding-snap-02",
    title: "웨딩스냅 02",
    description: "여백과 흐름이 살아 있는 웨딩 장면들",
    images: [
      { id: 1, label: "Moment 01", tone: "bg-[#dcd6cf]" },
      { id: 2, label: "Moment 02", tone: "bg-[#e7e1da]" },
      { id: 3, label: "Moment 03", tone: "bg-[#d9d3cd]" },
      { id: 4, label: "Moment 04", tone: "bg-[#ece6e0]" },
      { id: 5, label: "Moment 05", tone: "bg-[#ddd7d1]" },
    ],
  },
  {
    slug: "dol-snap-02",
    title: "돌스냅 02",
    description: "행사의 분위기와 가족의 표정을 함께 담은 기록",
    images: [
      { id: 1, label: "Moment 01", tone: "bg-[#d9d3cd]" },
      { id: 2, label: "Moment 02", tone: "bg-[#ece6e0]" },
      { id: 3, label: "Moment 03", tone: "bg-[#ddd7d1]" },
      { id: 4, label: "Moment 04", tone: "bg-[#d4cec8]" },
      { id: 5, label: "Moment 05", tone: "bg-[#e5dfd9]" },
    ],
  },
];

export default function PortfolioDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const group = useMemo(
    () => galleryGroups.find((item) => item.slug === params.slug),
    [params.slug]
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  if (!group) {
    return (
      <main className="min-h-screen bg-[#f7f5f2]">
        <section className="mx-auto max-w-4xl px-6 py-24 md:px-10">
          <p className="text-sm text-black/50">존재하지 않는 갤러리입니다.</p>
          <Link
            href="/portfolio"
            className="mt-6 inline-flex rounded-full border border-black px-6 py-3 text-sm"
          >
            갤러리로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  const currentImage = group.images[currentIndex];

  const goPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? group.images.length - 1 : prev - 1
    );
  };

  const goNext = () => {
    setCurrentIndex((prev) =>
      prev === group.images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <main className="min-h-screen bg-[#f7f5f2]">
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <div className="max-w-3xl">
          <Link
            href="/portfolio"
            className="text-sm text-black/45 transition hover:text-black"
          >
            ← 갤러리로 돌아가기
          </Link>

          <p className="mt-8 text-xs uppercase tracking-[0.35em] text-black/45">
            Gallery Detail
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
            {group.title}
          </h1>

          <p className="mt-6 text-base leading-8 text-black/60 md:text-lg">
            {group.description}
          </p>
        </div>

        <div className="mt-14 overflow-hidden rounded-[2rem] bg-white p-4 shadow-sm md:p-6">
          <div
            className={`relative flex aspect-[4/5] w-full items-center justify-center rounded-[1.5rem] md:aspect-[16/10] ${currentImage.tone}`}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />

            <button
              type="button"
              onClick={goPrev}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black px-4 py-3 text-xs text-white md:left-6"
            >
              Prev
            </button>

            <div className="text-sm uppercase tracking-[0.25em] text-black/35 md:text-base">
              {currentImage.label}
            </div>

            <button
              type="button"
              onClick={goNext}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black px-4 py-3 text-xs text-white md:right-6"
            >
              Next
            </button>
          </div>

          <div className="px-1 pt-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-lg font-medium text-black">
                {currentImage.label}
              </p>
              <p className="text-sm text-black/45">
                {currentIndex + 1} / {group.images.length}
              </p>
            </div>

            <p className="mt-3 text-sm leading-7 text-black/55">
              나중에는 이 영역에 촬영 설명, 장소, 분위기, 간단한 메모 등을
              넣을 수 있습니다.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 md:grid-cols-5">
          {group.images.map((image, index) => {
            const isActive = index === currentIndex;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`overflow-hidden rounded-[1.25rem] border transition ${
                  isActive
                    ? "border-black shadow-sm"
                    : "border-black/10 opacity-80 hover:opacity-100"
                }`}
              >
                <div
                  className={`aspect-[4/5] w-full ${image.tone} flex items-center justify-center text-[10px] uppercase tracking-[0.2em] text-black/35 md:text-xs`}
                >
                  {index + 1}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}