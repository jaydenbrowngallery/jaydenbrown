import Link from "next/link";

export default function ContactPage() {
  const smsBody = `촬영 날짜:
촬영 시간:
촬영 장소:
촬영 종류:
간단한 문의 내용:
`;

  return (
    <main className="bg-[#f7f5f2]">
      <section className="mx-auto flex min-h-[calc(100vh-160px)] max-w-5xl items-center px-6 py-16 md:px-10 md:py-24">
        <div className="w-full rounded-[32px] border border-black/5 bg-white px-8 py-14 shadow-sm md:px-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold leading-[1.12] tracking-[-0.04em] text-black md:text-6xl">
              문의는 문자로
              <br />
              남겨주세요.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-black/45 md:text-lg">
              정확한 날짜, 시간, 장소를 함께 남겨주시면
              보다 빠르고 정확하게 안내드릴 수 있습니다.
            </p>

            <div className="mt-10 flex flex-col items-center">
              <Link
                href={`sms:01076651369?body=${encodeURIComponent(smsBody)}`}
                className="inline-flex h-16 min-w-[240px] items-center justify-center rounded-full bg-black px-10 text-base font-semibold !text-white no-underline shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition duration-300 ease-out hover:scale-[1.04] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.24)] active:scale-[0.98]"
                style={{ color: "#ffffff" }}
              >
                문자 보내기
              </Link>

              <div className="mt-6 rounded-2xl border border-black/8 bg-[#f7f5f2] px-5 py-4">
                <p className="text-sm font-medium tracking-[-0.01em] text-black/70 md:text-base">
                  촬영 중일 경우
                  <span className="mx-1 font-semibold text-black">
                    바로 답변드리지 못할 수 있습니다.
                  </span>
                  확인 후 순차적으로 안내드립니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}