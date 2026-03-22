import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "촬영 문의 | Jayden Brown Studio",
  description: "도동산방 돌스냅, 고희연, 웨딩 촬영 문의 및 예약 안내",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.32em] text-black/30 mb-4">
          Contact
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] md:text-5xl mb-6">
          촬영 문의
        </h1>
        <p className="text-black/50 text-[15px] leading-7 mb-12">
          예약 가능 여부 확인 후 신청서 링크를 보내드립니다.<br />
          아래 채널로 편하게 문의해 주세요.
        </p>

        <div className="space-y-4">
          
            href="https://open.kakao.com/o/your-link"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl bg-[#FEE500] px-6 py-5 transition hover:brightness-95"
          >
            <span className="text-xl">💬</span>
            <div>
              <p className="font-semibold text-[#3A1D1D] text-[15px]">카카오톡 오픈채팅</p>
              <p className="text-[#3A1D1D]/60 text-[13px] mt-0.5">가장 빠른 문의 방법</p>
            </div>
          </a>

          
            href="tel:01076651369"
            className="flex items-center gap-4 rounded-2xl bg-white border border-black/10 px-6 py-5 transition hover:bg-black/5"
          >
            <span className="text-xl">📞</span>
            <div>
              <p className="font-semibold text-[15px]">전화 문의</p>
              <p className="text-black/40 text-[13px] mt-0.5">010-7665-1369</p>
            </div>
          </a>

          
            href="mailto:thethethe33@gmail.com"
            className="flex items-center gap-4 rounded-2xl bg-white border border-black/10 px-6 py-5 transition hover:bg-black/5"
          >
            <span className="text-xl">✉️</span>
            <div>
              <p className="font-semibold text-[15px]">이메일 문의</p>
              <p className="text-black/40 text-[13px] mt-0.5">thethethe33@gmail.com</p>
            </div>
          </a>
        </div>

        <div className="mt-12 rounded-2xl bg-white border border-black/10 px-6 py-6">
          <p className="text-[12px] uppercase tracking-[0.3em] text-black/30 mb-4">촬영 안내</p>
          <ul className="space-y-3 text-[14px] text-black/60 leading-6">
            <li className="flex gap-3"><span className="text-black/30">📍</span>울산 도동산방</li>
            <li className="flex gap-3"><span className="text-black/30">🕐</span>1부 10:00 / 2부 12:30 / 3부 16:00 촬영 시작</li>
            <li className="flex gap-3"><span className="text-black/30">📸</span>돌스냅 · 고희연 · 웨딩 스냅</li>
            <li className="flex gap-3"><span className="text-black/30">💰</span>예약금 입금 후 확정</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
