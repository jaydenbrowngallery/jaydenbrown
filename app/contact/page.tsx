import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "촬영 문의 | Jayden Brown Studio",
  description: "도동산방 돌스냅, 고희연, 웨딩 스냅 촬영 문의.",
};

export default function ContactPage() {
  const smsBody = encodeURIComponent(
    "안녕하세요, 촬영 문의드립니다.\n\n" +
    "희망 날짜: \n" +
    "희망 시간: \n" +
    "촬영 장소: \n"
  );

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <div className="mx-auto max-w-xl">

        <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-black/30">
          Contact
        </p>

        <h1 className="text-[1.5rem] font-light leading-[1.5] tracking-[-0.02em] text-black/80 md:text-[2.2rem]">
          촬영 문의는
          <br />
          문자로 부탁드립니다.
        </h1>

        <div className="mt-8 max-w-lg text-[14px] leading-[2] text-black/45 md:text-[15px]">
          <p>
            촬영 중에는 전화 통화가 어려워
            <br />
            문자로만 문의를 받고 있습니다.
          </p>
          <p className="mt-4">
            문자를 보내실 때
            <br />
            <span className="text-black/60">촬영 날짜, 시간, 장소</span>를
            <br />
            함께 남겨주시면 빠른 안내가 가능합니다.
          </p>
        </div>

        <a
          href={`sms:01076651369&body=${smsBody}`}
          className="mt-12 flex items-center gap-4 rounded-2xl bg-black px-6 py-5 transition hover:bg-black/80"
        >
          <span className="text-xl">✉️</span>
          <div>
            <p className="text-[15px] font-medium text-white">문자 보내기</p>
            <p className="mt-0.5 text-xs text-white/45">010-7665-1369</p>
          </div>
          <span className="ml-auto text-white/30 text-lg">→</span>
        </a>

      </div>
    </main>
  );
}