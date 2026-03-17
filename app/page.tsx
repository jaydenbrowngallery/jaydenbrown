export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#111111]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f7f5f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <a href="/" className="text-sm font-semibold tracking-[0.28em] uppercase">
            Jayden Brown
          </a>

          <nav className="hidden items-center gap-8 text-sm text-black/60 md:flex">
            <a href="/portfolio" className="transition hover:text-black">
              Portfolio
            </a>
            <a href="/about" className="transition hover:text-black">
              About
            </a>
            <a href="/guide" className="transition hover:text-black">
              Guide
            </a>
            <a href="/booking" className="transition hover:text-black">
              Booking
            </a>
            <a href="/contact" className="transition hover:text-black">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex min-h-[88vh] max-w-7xl items-center px-6 py-20 md:px-10">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-5 text-xs tracking-[0.35em] text-black/45 uppercase">
              Wedding & Portrait Photography
            </p>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.08] tracking-tight md:text-7xl">
              행복한 사진은,
              <br />
              즐거운 시간에서
              <br />
              시작됩니다.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-black/60 md:text-lg">
              예쁘게 남는 결과만큼, 촬영하는 시간이 편안하고 좋은 기억으로
              남는 것을 더 중요하게 생각합니다. 과한 연출보다 자연스러운
              분위기 속에서 오래 남을 순간을 담습니다.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="/portfolio"
                className="inline-flex items-center justify-center rounded-full bg-black px-7 py-3 text-sm text-white transition hover:opacity-90"
              >
                포트폴리오 보기
              </a>
              <a
                href="/booking"
                className="inline-flex items-center justify-center rounded-full border border-black px-7 py-3 text-sm transition hover:bg-black hover:text-white"
              >
                예약 신청하기
              </a>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="aspect-[4/5] rounded-[2rem] bg-[#d9d4cf]" />
            <div className="mt-10 aspect-[4/5] rounded-[2rem] bg-[#e7e2dc]" />
            <div className="aspect-[4/5] rounded-[2rem] bg-[#ece8e3]" />
            <div className="mt-10 aspect-[4/5] rounded-[2rem] bg-[#d6d1cb]" />
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="border-t border-black/5">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:px-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs tracking-[0.35em] text-black/45 uppercase">
              Philosophy
            </p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight md:text-5xl">
              사진보다 먼저,
              <br />
              시간이 좋은 기억이었으면 합니다.
            </h2>
          </div>

          <div className="space-y-6 text-base leading-8 text-black/65 md:text-lg">
            <p>
              저는 사진을 찍는 시간은 결과만큼 중요하다고 생각합니다. 아무리
              예쁜 사진이라도, 그 과정이 힘들고 지치기만 했다면 오래 행복한
              기억으로 남기 어렵다고 믿습니다.
            </p>
            <p>
              그래서 과한 연출보다 자연스러운 흐름을, 어색한 포즈보다 편안한
              분위기를 더 중요하게 생각합니다. 촬영이 끝난 뒤 사진만 남는 것이
              아니라, 그날의 시간까지도 좋은 추억으로 남기를 바랍니다.
            </p>
          </div>
        </div>
      </section>

      {/* Portfolio Preview */}
      <section className="border-t border-black/5">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs tracking-[0.35em] text-black/45 uppercase">
                Portfolio
              </p>
              <h2 className="mt-4 text-3xl font-semibold md:text-5xl">
                단정하고 편안한 순간들
              </h2>
            </div>

            <a
              href="/portfolio"
              className="hidden text-sm text-black/60 transition hover:text-black md:inline-block"
            >
              전체 포트폴리오 보기 →
            </a>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="aspect-[4/5] rounded-[2rem] bg-[#dfdbd6]" />
            <div className="aspect-[4/5] rounded-[2rem] bg-[#d4d0ca]" />
            <div className="aspect-[4/5] rounded-[2rem] bg-[#e8e4de]" />
          </div>
        </div>
      </section>

      {/* Guide Preview */}
      <section className="border-t border-black/5">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] bg-white px-8 py-10 shadow-sm">
              <p className="text-xs tracking-[0.35em] text-black/45 uppercase">
                Guide
              </p>
              <h3 className="mt-4 text-2xl font-semibold md:text-3xl">
                촬영은 잘 해내야 하는 시간이 아니라,
                <br />
                편안하게 함께 보내는 시간이었으면 합니다.
              </h3>
              <p className="mt-6 text-base leading-8 text-black/60">
                촬영 전 어떤 준비를 해야 하는지, 어떤 흐름으로 진행되는지,
                편안한 촬영을 위해 어떤 점을 안내드리는지 정리해두었습니다.
              </p>
              <a
                href="/guide"
                className="mt-8 inline-flex rounded-full border border-black px-6 py-3 text-sm transition hover:bg-black hover:text-white"
              >
                촬영 안내 보기
              </a>
            </div>

            <div className="rounded-[2rem] bg-black px-8 py-10 text-white">
              <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                Contact
              </p>
              <h3 className="mt-4 text-2xl font-semibold md:text-3xl">
                문의는 문자로
                <br />
                편하게 남겨주세요.
              </h3>
              <p className="mt-6 text-base leading-8 text-white/70">
                촬영 종류와 희망 날짜를 함께 보내주시면 조금 더 빠르게
                안내드릴 수 있습니다.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="sms:01012345678?body=안녕하세요. 촬영 문의드립니다."
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm text-black transition hover:opacity-90"
                >
                  문자 문의하기
                </a>
                <a
                  href="/booking"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm text-white transition hover:bg-white hover:text-black"
                >
                  예약 신청서 작성
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-black/45 md:px-10 md:flex-row md:items-center md:justify-between">
          <p>© Jayden Brown Studio</p>
          <p>Quiet moments, warm memories.</p>
        </div>
      </footer>
    </main>
  );
}