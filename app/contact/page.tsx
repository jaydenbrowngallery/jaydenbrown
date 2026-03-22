import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "촬영 문의 | Jayden Brown Studio",
  description: "도동산방 돌스냅, 고희연, 웨딩 스냅 촬영 문의. 문자로 희망 날짜와 부수를 남겨주시면 확인 후 안내드립니다.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.32em] text-black/30 mb-4">Contact</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] md:text-5xl mb-4">촬영 문의</h1>
        <p className="text-black/50 text-[15px] leading-7 mb-12">
          문자로 희망 날짜와 부수를 남겨주시면<br />
          확인 후 예약 신청서 링크를 보내드립니다.
        </p>

        
          href="sms:01076651369"
          className="flex items-center gap-4 rounded-2xl bg-black px-6 py-5 transition hover:bg-black/80"
        >
          <span className="text-2xl">✉️</span>
          <div>
            <p className="font-semibold text-white text-sm">문자 문의</p>
            <p className="text-white/50 text-xs mt-0.5">010-7665-1369</p>
          </div>
          <span className="ml-auto text-white/40">→</span>
        </a>

        <div className="mt-6 rounded-2xl bg-white border border-black/10 px-6 py-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-black/30 mb-4">문의 시 포함할 내용</p>
          <ul className="space-y-3 text-sm text-black/55 leading-7">
            <li className="flex gap-3">
              <span className="text-black/20">01</span>
              <span>희망 촬영 날짜</span>
            </li>
            <li className="flex gap-3">
              <span className="text-black/20">02</span>
              <span>부수 — 1부(식사 12시) · 2부(식사 14:30) · 3부(식사 18시)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-black/20">03</span>
              <span>촬영 종류 — 돌스냅 · 고희연 · 웨딩</span>
            </li>
          </ul>
        </div>

        <div className="mt-4 rounded-2xl bg-white border border-black/10 px-6 py-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-black/30 mb-3">Notice</p>
          <ul className="space-y-2 text-sm text-black/50 leading-7">
            <li>· 날짜 확인 후 예약 신청서 링크를 문자로 보내드립니다.</li>
            <li>· 예약금 입금 후 예약이 확정됩니다.</li>
            <li>· 촬영 2주 전 안내 문자를 발송해 드립니다.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
