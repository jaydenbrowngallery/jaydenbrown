export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 md:px-16">
        <div className="text-lg font-semibold tracking-[0.2em] uppercase">
          Jayden Brown
        </div>

        <nav className="hidden gap-8 text-sm text-gray-600 md:flex">
          <a href="#portfolio" className="hover:text-black">
            Portfolio
          </a>
          <a href="#about" className="hover:text-black">
            About
          </a>
          <a href="#contact" className="hover:text-black">
            Contact
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex min-h-[78vh] flex-col items-center justify-center px-8 text-center md:px-16">
        <p className="mb-4 text-sm tracking-[0.3em] text-gray-500 uppercase">
          Wedding & Portrait Photography
        </p>

        <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
          Quiet, elegant moments
          <br />
          captured with warmth
        </h1>

        <p className="mt-6 max-w-xl text-base leading-7 text-gray-600 md:text-lg">
          자연스러운 표정과 공기의 결까지 담아내는 사진.
          제이든 브라운 스튜디오는 웨딩과 인물 촬영을 중심으로
          오래 남는 이미지를 만듭니다.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#portfolio"
            className="rounded-full bg-black px-7 py-3 text-sm text-white transition hover:opacity-90"
          >
            포트폴리오 보기
          </a>
          <a
            href="#contact"
            className="rounded-full border border-black px-7 py-3 text-sm transition hover:bg-black hover:text-white"
          >
            예약 문의
          </a>
        </div>
      </section>

      {/* Portfolio Preview */}
      <section
        id="portfolio"
        className="grid gap-4 px-8 pb-24 md:grid-cols-3 md:px-16"
      >
        <div className="aspect-[4/5] rounded-3xl bg-gray-100" />
        <div className="aspect-[4/5] rounded-3xl bg-gray-200" />
        <div className="aspect-[4/5] rounded-3xl bg-gray-100" />
      </section>

      {/* About */}
      <section
        id="about"
        className="grid gap-10 px-8 py-24 md:grid-cols-2 md:px-16"
      >
        <div>
          <p className="text-sm tracking-[0.3em] text-gray-500 uppercase">
            About
          </p>
          <h2 className="mt-4 text-3xl font-semibold md:text-4xl">
            사진은 결국,
            <br />
            사람의 온도를 남기는 일이라고 생각합니다.
          </h2>
        </div>

        <div className="text-base leading-8 text-gray-600">
          <p>
            과한 연출보다 자연스러운 흐름을 더 중요하게 생각합니다.
            촬영하는 순간의 긴장, 웃음, 공기, 빛의 분위기까지 담아
            시간이 지나도 다시 꺼내 보고 싶은 사진을 만들고 싶습니다.
          </p>
          <p className="mt-6">
            웨딩, 프로필, 커플, 가족 사진까지
            각자의 결이 살아 있는 이미지를 기록합니다.
          </p>
        </div>
      </section>

      {/* Contact CTA */}
      <section
        id="contact"
        className="px-8 pb-24 md:px-16"
      >
        <div className="rounded-[2rem] bg-black px-8 py-14 text-white md:px-12">
          <p className="text-sm tracking-[0.3em] text-white/60 uppercase">
            Booking
          </p>
          <h3 className="mt-4 text-3xl font-semibold md:text-4xl">
            촬영 예약 및 상담을 시작해보세요
          </h3>
          <p className="mt-4 max-w-2xl text-white/70 leading-7">
            원하시는 촬영 종류와 희망 일정을 남겨주시면
            확인 후 안내드리겠습니다.
          </p>

          <div className="mt-8">
            <a
              href="#"
              className="inline-block rounded-full bg-white px-7 py-3 text-sm text-black transition hover:opacity-90"
            >
              예약 폼 만들기
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}