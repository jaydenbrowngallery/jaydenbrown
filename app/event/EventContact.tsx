"use client";

import { useState } from "react";

const PEOPLE = ["2인", "3인", "4인", "5인", "6인", "7인", "8인", "9인 이상"];

export default function EventContact({ phone }: { phone: string }) {
  const [people, setPeople] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSendSMS = () => {
    const lines = ["셀프촬영문의."];
    if (people) lines.push(`촬영 인원: ${people}`);
    if (date) lines.push(`희망 날짜: ${date}`);
    if (time) lines.push(`희망 시간: ${time}`);

    const body = encodeURIComponent(lines.join("\n"));

    // iOS: sms:번호&body= / Android: sms:번호?body=
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const sep = isIOS ? "&" : "?";
    window.location.href = `sms:${phone}${sep}body=${body}`;
  };

  const field =
    "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] text-black outline-none transition focus:border-black/25";

  return (
    <div>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] text-black/50">촬영 인원</label>
          <select value={people} onChange={(e) => setPeople(e.target.value)} className={field}>
            <option value="">선택해주세요</option>
            {PEOPLE.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] text-black/50">희망 날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={field}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] text-black/50">희망 시간</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={field}
          />
        </div>
      </div>

      <button
        onClick={handleSendSMS}
        className="mt-7 w-full rounded-full bg-black py-4 text-[14.5px] font-medium text-white transition hover:bg-black/85 md:text-[15px]"
      >
        문자 보내기
      </button>

      <p className="mt-3.5 text-center text-[12.5px] leading-[1.8] text-black/35">
        위 내용을 채워 문자 창이 열립니다.
        <br />
        문자 창이 뜨면 <span className="text-black/50">보내기</span>를 눌러 발송해주세요.
      </p>
    </div>
  );
}
