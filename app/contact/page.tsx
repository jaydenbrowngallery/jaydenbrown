"use client";

import { useState } from "react";

export default function ContactPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");

  const handleSendSMS = () => {
    const lines = ["안녕하세요, 촬영 문의드립니다."];
    if (date) lines.push(`희망 날짜: ${date}`);
    if (time) lines.push(`희망 시간: ${time}`);
    if (location) lines.push(`촬영 장소: ${location}`);
    if (type) lines.push(`촬영 종류: ${type}`);
    if (message) lines.push(`문의 내용: ${message}`);

    const body = encodeURIComponent(lines.join("\n"));

    // iOS: sms:번호&body= / Android: sms:번호?body=
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const sep = isIOS ? "&" : "?";
    window.location.href = `sms:01076651369${sep}body=${body}`;
  };

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

        <div className="mt-6 max-w-lg text-[14px] leading-[2] text-black/45 md:text-[15px]">
          <p>
            촬영 중에는 전화 통화가 어려워
            <br />
            문자로만 문의를 받고 있습니다.
          </p>
          <p className="mt-3">
            아래 내용을 입력하신 후
            <br />
            <span className="text-black/60">문자 보내기</span> 버튼을 눌러주세요.<br />문자 창이 뜨면 <span className="text-black/60">보내기</span>를 눌러 발송해주세요.
          </p>
        </div>

        {/* 입력 폼 */}
        <div className="mt-10 space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] text-black/50">희망 날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] text-black outline-none transition focus:border-black/25"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] text-black/50">희망 시간</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] text-black outline-none transition focus:border-black/25"
            >
              <option value="">선택해주세요</option>
              <option value="1부 (식사 12시)">1부 (식사 12시)</option>
              <option value="2부 (식사 14:30)">2부 (식사 14:30)</option>
              <option value="3부 (식사 18시)">3부 (식사 18시)</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] text-black/50">촬영 장소</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 도동산방"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] text-black outline-none transition placeholder:text-black/25 focus:border-black/25"
            />
          </div>


          <div>
            <label className="mb-1.5 block text-[13px] text-black/50">촬영 종류</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] text-black outline-none transition focus:border-black/25"
            >
              <option value="">선택해주세요</option>
              <option value="돌스냅">돌스냅</option>
              <option value="웨딩스냅">웨딩스냅</option>
              <option value="고희연">고희연</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] text-black/50">문의 내용 <span className="text-black/25">(선택)</span></label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="추가로 전달할 내용이 있으면 적어주세요"
              rows={3}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] text-black outline-none transition placeholder:text-black/25 focus:border-black/25 resize-none"
            />
          </div>
        </div>

        {/* 문자 보내기 버튼 */}
        <button
          type="button"
          onClick={handleSendSMS}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-black px-6 py-5 transition hover:bg-black/80"
        >
          <span className="text-xl">✉️</span>
          <div className="text-left">
            <p className="text-[15px] font-medium text-white">문자 보내기</p>
            <p className="mt-0.5 text-xs text-white/45">010-7665-1369</p>
          </div>
          <span className="ml-auto text-lg text-white/30">→</span>
        </button>

      </div>
    </main>
  );
}
