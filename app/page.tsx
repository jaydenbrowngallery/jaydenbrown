export default function HomePage() {
  return (
    <main className="bg-[#f7f5f2] text-[#111111]">
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-12 md:px-10 md:pb-24 md:pt-20">
        <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
          <div className="order-2 md:order-1">
            <p className="mb-4 text-[11px] uppercase tracking-[0.32em] text-black/30">
              Jayden Brown Studio
            </p>

            <h1 className="text-[2.2rem] font-semibold leading-[1.15] tracking-[-0.05em] text-black md:text-[4.8rem]">
              행복이 머문 시간은,
              <br />
              사진 속에도
              <br />
              고스란히 남습니다.
            </h1>

            <div className="mt-7 max-w-2xl space-y-4 text-[15px] leading-7 text-black/45 md:text-[18px] md:leading-8">
              <p>
                훗날 사진을 꺼내 보며 웃음 지을 수 있으려면,
                <br />
                촬영하는 지금 이 순간이 온전히 행복해야 합니다.
              </p>

              <p>
                당신의 가장 자연스러운 미소를 끌어내는
                <br />
                편안한 시간을 선물합니다.
              </p>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="overflow-hidden rounded-[30px] bg-[#ece7e1] shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <div
                className="aspect-[4/5] w-full bg-cover bg-center"
                style={{ backgroundImage: "url('/img/001.jpg')" }}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}