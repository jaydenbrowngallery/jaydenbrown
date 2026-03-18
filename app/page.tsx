export default function HomePage() {
  return (
    <main className="bg-[#f7f5f2] text-[#111111]">
      {/* Hero */}
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

            <div className="mt-7 max-w-2xl space-y-4 text-[15px] leading-7 text-black/48 md:text-[18px] md:leading-8">
              <p>
                훗날 사진을 꺼내 보며 웃음 지을 수 있으려면,
                촬영하는 지금 이 순간이 온전히 행복해야 합니다.
              </p>

              <p>
                당신의 가장 자연스러운 미소를 끌어내는
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

      {/* About */}
      <section className="border-t border-black/6">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <div className="max-w-4xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-black/28">
              About
            </p>

            <h2 className="mt-4 text-[2rem] font-semibold leading-[1.2] tracking-[-0.04em] md:text-[3.4rem]">
              좋은 사진은
              <br />
              좋은 시간에서 시작된다고 믿습니다.
            </h2>

            <p className="mt-7 max-w-3xl text-[15px] leading-8 text-black/48 md:text-[18px]">
              과한 연출보다 자연스러운 흐름을 따라가며,
              그날의 공기와 표정, 관계의 온도를 담는 촬영을 지향합니다.
              편안한 분위기 안에서 만들어진 장면은 시간이 지나도 더 따뜻하게 남습니다.
            </p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-black/6">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <div className="mb-10">
            <p className="text-[11px] uppercase tracking-[0.3em] text-black/28">
              Process
            </p>

            <h2 className="mt-4 text-[2rem] font-semibold leading-[1.2] tracking-[-0.04em] md:text-[3.2rem]">
              촬영의 시작부터
              <br />
              전달까지 차분하게 이어갑니다.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-[28px] border border-black/6 bg-white px-7 py-8 shadow-sm">
              <p className="text-[12px] tracking-[0.18em] text-black/28">01</p>
              <h3 className="mt-3 text-[22px] font-medium tracking-[-0.02em]">
                문의
              </h3>
              <p className="mt-4 text-[15px] leading-7 text-black/48">
                날짜, 시간, 장소를 문자로 남겨주시면
                가능한 일정과 촬영 방향을 먼저 안내드립니다.
              </p>
            </div>

            <div className="rounded-[28px] border border-black/6 bg-white px-7 py-8 shadow-sm">
              <p className="text-[12px] tracking-[0.18em] text-black/28">02</p>
              <h3 className="mt-3 text-[22px] font-medium tracking-[-0.02em]">
                상담 및 확정
              </h3>
              <p className="mt-4 text-[15px] leading-7 text-black/48">
                촬영 목적과 분위기를 함께 정리한 뒤
                예약과 진행 내용을 확정합니다.
              </p>
            </div>

            <div className="rounded-[28px] border border-black/6 bg-white px-7 py-8 shadow-sm">
              <p className="text-[12px] tracking-[0.18em] text-black/28">03</p>
              <h3 className="mt-3 text-[22px] font-medium tracking-[-0.02em]">
                촬영 및 전달
              </h3>
              <p className="mt-4 text-[15px] leading-7 text-black/48">
                편안한 흐름 속에서 촬영하고,
                보정 후 결과물을 정성껏 전달합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-black/6">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <div className="rounded-[32px] border border-black/6 bg-white px-8 py-10 shadow-sm md:px-12 md:py-14">
            <p className="text-[11px] uppercase tracking-[0.3em] text-black/28">
              Note
            </p>

            <p className="mt-5 max-w-4xl text-[18px] leading-8 tracking-[-0.02em] text-black/62 md:text-[24px] md:leading-10">
              결국 오래 남는 것은 잘 찍힌 사진 한 장보다,
              그날의 공기와 표정, 그리고 함께 웃었던 시간이라고 믿습니다.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}