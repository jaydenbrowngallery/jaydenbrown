const galleryItems = [
  { id: 1, title: "Gallery Image 01" },
  { id: 2, title: "Gallery Image 02" },
  { id: 3, title: "Gallery Image 03" },
  { id: 4, title: "Gallery Image 04" },
  { id: 5, title: "Gallery Image 05" },
  { id: 6, title: "Gallery Image 06" },
  { id: 7, title: "Gallery Image 07" },
  { id: 8, title: "Gallery Image 08" },
  { id: 9, title: "Gallery Image 09" },
  { id: 10, title: "Gallery Image 10" },
  { id: 11, title: "Gallery Image 11" },
  { id: 12, title: "Gallery Image 12" },
];

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-[#f7f5f2]">
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <div className="max-w-3xl">
          <p className="text-xs tracking-[0.35em] text-black/45 uppercase">
            Gallery
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
            조용하고 따뜻한 순간들
          </h1>
          <p className="mt-6 text-base leading-8 text-black/60 md:text-lg">
            과한 장면보다 자연스러운 흐름을,
            어색한 포즈보다 편안한 분위기를 담고 싶습니다.
            이 공간은 그런 순간들을 천천히 모아두는 갤러리입니다.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((item) => (
            <button
              key={item.id}
              className="group overflow-hidden rounded-[2rem] bg-[#ddd7d1] text-left transition hover:-translate-y-1"
              type="button"
            >
              <div className="aspect-[4/5] w-full bg-[#d8d2cc]" />
              <div className="px-5 py-4">
                <p className="text-sm text-black/50">{item.title}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-20 rounded-[2rem] border border-black/10 bg-white px-8 py-10">
          <p className="text-sm leading-7 text-black/60">
            현재는 기본 갤러리 구조를 먼저 구성해두었습니다.
            이후에는 업로드한 사진이 자동으로 이 페이지에 반영되도록
            연결할 예정입니다.
          </p>
        </div>
      </section>
    </main>
  );
}