import Link from "next/link";

const galleryGroups = [
  {
    slug: "dol-snap-01",
    title: "돌스냅",
    description: "편안한 분위기 속에서 기록한 돌잔치 순간들",
    coverTone: "bg-[#d8d2cc]",
    date: "2026",
  },
  {
    slug: "wedding-snap-01",
    title: "웨딩스냅",
    description: "과한 연출보다 자연스러운 흐름을 담은 웨딩 기록",
    coverTone: "bg-[#e3ddd7]",
    date: "2026",
  },
  {
    slug: "family-snap-01",
    title: "가족촬영",
    description: "함께 머무는 공기와 표정을 조용히 담은 시간",
    coverTone: "bg-[#d4cec8]",
    date: "2026",
  },
  {
    slug: "birthday-snap-01",
    title: "고희연 · 생신",
    description: "오래 기억될 자리를 단정하고 따뜻하게 기록",
    coverTone: "bg-[#e7e1da]",
    date: "2026",
  },
  {
    slug: "wedding-snap-02",
    title: "웨딩스냅 02",
    description: "여백과 흐름이 살아 있는 웨딩 장면들",
    coverTone: "bg-[#dcd6cf]",
    date: "2026",
  },
  {
    slug: "dol-snap-02",
    title: "돌스냅 02",
    description: "행사의 분위기와 가족의 표정을 함께 담은 기록",
    coverTone: "bg-[#d9d3cd]",
    date: "2026",
  },
];

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-[#f7f5f2]">
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.35em] text-black/45">
            Gallery
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
            촬영의 흐름이 남아 있는
            <br />
            갤러리
          </h1>

          <p className="mt-6 text-base leading-8 text-black/60 md:text-lg">
            한 장의 사진보다, 한 번의 촬영 안에 담긴 공기와 흐름을 함께
            보여주고 싶었습니다. 각 카드에는 한 번의 촬영이 담겨 있고,
            클릭하면 그 안의 여러 장면을 슬라이드로 볼 수 있습니다.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {galleryGroups.map((group, index) => (
            <Link
              key={group.slug}
              href={`/portfolio/${group.slug}`}
              className="group overflow-hidden rounded-[2rem] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div
                className={`relative aspect-[4/5] w-full ${group.coverTone} overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
                <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.25em] text-black/35">
                  Session {String(index + 1).padStart(2, "0")}
                </div>
              </div>

              <div className="px-5 py-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-medium text-black">
                    {group.title}
                  </h2>
                  <span className="text-xs text-black/35">{group.date}</span>
                </div>

                <p className="mt-3 text-sm leading-7 text-black/55">
                  {group.description}
                </p>

                <p className="mt-5 text-sm text-black/50 transition group-hover:text-black">
                  자세히 보기 →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}