export default function About() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-semibold md:text-6xl">
          사진보다 먼저,
          <br />
          시간이 좋은 기억이었으면 합니다.
        </h1>

        <div className="mt-10 space-y-6 text-lg leading-8 text-black/70">
          <p>
            저는 사진을 찍는 시간은 결과만큼 중요하다고 생각합니다.
            아무리 예쁜 사진이라도, 그 과정이 힘들고 지치기만 했다면
            오래 행복한 기억으로 남기 어렵다고 믿습니다.
          </p>

          <p>
            과한 연출보다 자연스러운 흐름을,
            어색한 포즈보다 편안한 분위기를 더 중요하게 생각합니다.
          </p>

          <p>
            촬영이 끝난 뒤 사진만 남는 것이 아니라,
            그날의 시간까지도 좋은 추억으로 남기를 바랍니다.
          </p>
        </div>
      </div>
    </main>
  );
}