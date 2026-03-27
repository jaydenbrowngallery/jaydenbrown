import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "촬영 가이드 | Jayden Brown Studio",
  description: "제이든 브라운 스튜디오 촬영 예약 안내. 문의부터 촬영까지의 과정을 안내합니다.",
};

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <div className="mx-auto max-w-2xl">

        {/* 타이틀 */}
        <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-black/30">Guide</p>
        <h1 className="text-[1.5rem] font-light leading-[1.5] tracking-[-0.02em] text-black/80 md:text-[2.2rem]">
          촬영이 처음이셔도
          <br />
          걱정하지 않으셔도 됩니다.
        </h1>
        <p className="mt-6 text-[14px] leading-[2] text-black/45 md:text-[15px]">
          문의부터 촬영까지,
          <br />
          천천히 안내드리겠습니다.
        </p>

        {/* ── 예약 과정 ── */}
        <section className="mt-16">
          <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-black/30">How to Book</p>

          <div className="relative space-y-0">
            {/* 연결선 */}
            <div className="absolute left-[19px] top-[40px] bottom-[40px] w-px bg-gradient-to-b from-black/10 via-black/8 to-black/10 md:left-[23px]" />

            {/* Step 1 */}
            <div className="relative flex gap-5 pb-10">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-[12px] font-semibold text-white md:h-12 md:w-12 md:text-[13px]">01</div>
              <div className="pt-1.5">
                <p className="text-[15px] font-medium text-black/75 md:text-[16px]">촬영 문의</p>
                <p className="mt-2 text-[13.5px] leading-[1.9] text-black/45 md:text-[14.5px]">
                  홈페이지 <Link href="/contact" className="text-black/60 underline underline-offset-2">문의 페이지</Link>에서
                  <br />
                  희망 날짜, 시간, 장소를 남겨주세요.
                  <br />
                  <span className="text-black/35">어렵지 않으니 편하게 남겨주시면 됩니다.</span>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex gap-5 pb-10">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-[12px] font-semibold text-white md:h-12 md:w-12 md:text-[13px]">02</div>
              <div className="pt-1.5">
                <p className="text-[15px] font-medium text-black/75 md:text-[16px]">날짜 확인 & 신청서 안내</p>
                <p className="mt-2 text-[13.5px] leading-[1.9] text-black/45 md:text-[14.5px]">
                  날짜를 확인한 뒤,
                  <br />
                  예약 가능 여부를 문자로 안내드립니다.
                  <br />
                  예약이 가능한 경우, 함께 보내드리는
                  <br />
                  <span className="text-black/55">신청서 링크</span>에서 상세 내용을 작성해주세요.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex gap-5 pb-10">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-[12px] font-semibold text-white md:h-12 md:w-12 md:text-[13px]">03</div>
              <div className="pt-1.5">
                <p className="text-[15px] font-medium text-black/75 md:text-[16px]">예약금 안내</p>
                <p className="mt-2 text-[13.5px] leading-[1.9] text-black/45 md:text-[14.5px]">
                  신청서를 확인한 후,
                  <br />
                  예약금 안내 문자를 보내드립니다.
                  <br />
                  <span className="text-black/35">입금 확인까지 하루 정도 소요될 수 있습니다.</span>
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex gap-5 pb-10">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-[12px] font-semibold text-white md:h-12 md:w-12 md:text-[13px]">04</div>
              <div className="pt-1.5">
                <p className="text-[15px] font-medium text-black/75 md:text-[16px]">예약 확정</p>
                <p className="mt-2 text-[13.5px] leading-[1.9] text-black/45 md:text-[14.5px]">
                  예약금 입금이 확인되면
                  <br />
                  <span className="text-black/55">예약이 확정</span>됩니다.
                  <br />
                  확정 안내 문자를 보내드리니
                  <br />
                  편하게 기다려주세요.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative flex gap-5 pb-10">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-[12px] font-semibold text-white md:h-12 md:w-12 md:text-[13px]">05</div>
              <div className="pt-1.5">
                <p className="text-[15px] font-medium text-black/75 md:text-[16px]">촬영 당일</p>
                <p className="mt-2 text-[13.5px] leading-[1.9] text-black/45 md:text-[14.5px]">
                  촬영 2주 전 안내 문자를 보내드립니다.
                  <br />
                  당일에는 편안한 마음으로 와주세요.
                  <br />
                  <span className="text-black/35">나머지는 제가 알아서 챙기겠습니다.</span>
                </p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="relative flex gap-5">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-[12px] font-semibold text-white md:h-12 md:w-12 md:text-[13px]">06</div>
              <div className="pt-1.5">
                <p className="text-[15px] font-medium text-black/75 md:text-[16px]">선별본 & 최종 배송</p>
                <p className="mt-2 text-[13.5px] leading-[1.9] text-black/45 md:text-[14.5px]">
                  촬영 후 선별 작업이 완료되면
                  <br />
                  이메일로 사진을 보내드립니다.
                  <br />
                  사진을 선택해주시면
                  <br />
                  앨범·액자를 제작하여 택배로 발송합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 부수별 시간 ── */}

        <div className="mt-20 text-center">
          <p className="mb-5 text-[13.5px] text-black/40 md:text-[14.5px]">
            궁금한 점이 있으시면 편하게 문의해 주세요.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-medium transition" style={{ backgroundColor: "#3a3a3a", color: "#ffffff" }}
          >
            촬영 문의하기
            <span style={{ color: "rgba(255,255,255,0.5)" }}>→</span>
          </Link>
        </div>

      </div>
    </main>
  );
}