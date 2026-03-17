export default function Guide() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <div className="mx-auto max-w-4xl space-y-16">

        <section>
          <h1 className="text-4xl font-semibold md:text-6xl">Guide</h1>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">이런 분들께 잘 맞습니다</h2>
          <ul className="mt-4 space-y-2 text-black/70">
            <li>- 편안한 분위기에서 촬영하고 싶은 분</li>
            <li>- 자연스러운 사진을 원하는 분</li>
            <li>- 과정도 좋은 기억으로 남기고 싶은 분</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">촬영 방식</h2>
          <p className="mt-4 text-black/70 leading-7">
            과한 연출보다 자연스러운 흐름을 중요하게 생각합니다.
            편안한 분위기에서 자연스럽게 촬영을 진행합니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">진행 순서</h2>
          <ol className="mt-4 space-y-2 text-black/70">
            <li>1. 예약 신청서 작성</li>
            <li>2. 일정 확인</li>
            <li>3. 문자 안내</li>
            <li>4. 촬영 진행</li>
            <li>5. 사진 전달</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">안내</h2>
          <p className="mt-4 text-black/70 leading-7">
            촬영은 잘 해내야 하는 시간이 아니라,
            편안하게 함께 보내는 시간이었으면 합니다.
          </p>
        </section>

      </div>
    </main>
  );
}