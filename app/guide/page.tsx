import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "촬영 가이드 | Jayden Brown Studio",
  description: "도동산방 촬영 전 알아두실 사항. 부수별 시간 안내, 복장 팁, 준비물 등을 안내합니다.",
};

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.32em] text-black/30 mb-4">Guide</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] md:text-5xl mb-4">촬영 가이드</h1>
        <p className="text-black/50 text-[15px] leading-7 mb-12">
          촬영 당일 더욱 편안하게 즐기실 수 있도록<br />
          미리 안내드립니다.
        </p>

        {/* 부수별 시간 안내 */}
        <section className="mb-10">
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-black/30 mb-4">Time Schedule</h2>
          <div className="space-y-3">
            {[
              { label: "1부", shoot: "10:00", meal: "12:00" },
              { label: "2부", shoot: "12:30", meal: "14:30" },
              { label: "3부", shoot: "16:00", meal: "18:00" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-4 rounded-2xl bg-white border border-black/10 px-6 py-5">
                <span className="text-xs font-semibold tracking-widest text-black/30 w-6">{s.label}</span>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-black/30 text-xs">촬영</span>
                    <p className="font-semibold">{s.shoot}</p>
                  </div>
                  <div>
                    <span className="text-black/30 text-xs">식사</span>
                    <p className="font-semibold">{s.meal}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 안내 사항 */}
        <section className="mb-10">
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-black/30 mb-4">Notice</h2>
          <div className="rounded-2xl bg-white border border-black/10 px-6 py-6 space-y-4 text-sm text-black/60 leading-7">
            <p>· 촬영 장소는 <strong className="text-black">울산 도동산방</strong>입니다.</p>
            <p>· 한복은 도동산방 측에서 제공됩니다. 별도 준비 불필요합니다.</p>
            <p>· 아기의 컨디션이 가장 중요합니다. 충분한 수면 후 방문해 주세요.</p>
            <p>· 예약금 입금 후 예약이 확정됩니다.</p>
            <p>· 촬영 2주 전 안내 문자를 발송해 드립니다.</p>
          </div>
        </section>

        {/* 프로세스 */}
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-black/30 mb-4">Process</h2>
          <div className="space-y-2">
            {[
              { step: "01", title: "문의 & 날짜 확인", desc: "카카오톡 또는 전화로 희망 날짜 문의" },
              { step: "02", title: "예약 신청서 작성", desc: "링크로 전달드리는 신청서 작성" },
              { step: "03", title: "예약금 입금", desc: "입금 후 예약 확정" },
              { step: "04", title: "촬영 당일", desc: "도동산방에서 촬영 진행" },
              { step: "05", title: "선별본 발송", desc: "촬영 후 선별 작업 완료 시 메일 발송" },
              { step: "06", title: "최종본 & 배송", desc: "사진 선택 후 앨범·액자 제작 및 택배 발송" },
            ].map((p) => (
              <div key={p.step} className="flex gap-4 rounded-2xl bg-white border border-black/10 px-6 py-4">
                <span className="text-[11px] font-semibold text-black/20 w-6 pt-0.5">{p.step}</span>
                <div>
                  <p className="font-semibold text-sm">{p.title}</p>
                  <p className="text-black/40 text-xs mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 촬영 문의 버튼 */}
      <div className="mt-16 text-center">
        <a href="/contact" className="inline-flex items-center rounded-full bg-black px-8 py-4 text-sm font-medium text-white transition hover:bg-black/80">
          촬영 문의하기
        </a>
      </div>
    </main>
  );
}
