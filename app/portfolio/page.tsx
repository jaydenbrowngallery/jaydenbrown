"use client";

import { useState } from "react";

const galleryItems = [
  { id: 1, title: "Moment 01" },
  { id: 2, title: "Moment 02" },
  { id: 3, title: "Moment 03" },
  { id: 4, title: "Moment 04" },
  { id: 5, title: "Moment 05" },
  { id: 6, title: "Moment 06" },
  { id: 7, title: "Moment 07" },
  { id: 8, title: "Moment 08" },
  { id: 9, title: "Moment 09" },
  { id: 10, title: "Moment 10" },
  { id: 11, title: "Moment 11" },
  { id: 12, title: "Moment 12" },
];

export default function PortfolioPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedItem =
    galleryItems.find((item) => item.id === selectedId) ?? null;

  return (
    <main className="min-h-screen bg-[#f7f5f2]">
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.35em] text-black/45">
            Gallery
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
            조용하고 따뜻한 순간들
          </h1>

          <p className="mt-6 text-base leading-8 text-black/60 md:text-lg">
            과한 장면보다 자연스러운 흐름을, 어색한 포즈보다 편안한 분위기를
            담고 싶습니다. 이 공간은 그런 순간들을 천천히 모아두는
            갤러리입니다.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className="group overflow-hidden rounded-[2rem] bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#ddd7d1]">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
                <div className="flex h-full items-center justify-center text-sm tracking-[0.2em] text-black/35 uppercase">
                  Image {String(index + 1).padStart(2, "0")}
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <p className="text-sm text-black/60">{item.title}</p>
                <span className="text-xs text-black/35">View</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-20 rounded-[2rem] border border-black/10 bg-white px-8 py-8">
          <p className="text-sm leading-7 text-black/55">
            현재는 갤러리 레이아웃과 보기 방식을 먼저 완성해두었습니다.
            다음 단계에서 실제 사진 업로드 기능을 연결하면, 이 페이지에 자동으로
            반영되도록 확장할 예정입니다.
          </p>
        </div>
      </section>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 py-10"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-[2rem] bg-white p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black px-4 py-2 text-xs text-white"
            >
              Close
            </button>

            <div className="overflow-hidden rounded-[1.5rem] bg-[#ddd7d1]">
              <div className="aspect-[4/5] w-full md:aspect-[16/10]">
                <div className="flex h-full items-center justify-center text-base tracking-[0.25em] text-black/35 uppercase">
                  {selectedItem.title}
                </div>
              </div>
            </div>

            <div className="px-2 pb-2 pt-5 md:px-1">
              <p className="text-lg font-medium text-black">{selectedItem.title}</p>
              <p className="mt-2 text-sm leading-7 text-black/55">
                나중에는 이 영역에 사진 설명이나 촬영 분위기, 간단한 메모를
                넣을 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}