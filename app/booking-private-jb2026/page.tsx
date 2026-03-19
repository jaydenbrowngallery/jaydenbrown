"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

type SubmittedData = {
  title: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  location: string;
  address: string;
  address_detail: string;
  depositor_name: string;
  product: string;
  message: string;
  status: string;
};

function formatTimeSlot(slot: string) {
  switch (slot) {
    case "1부":
      return "1부(12시)";
    case "2부":
      return "2부(14시30분)";
    case "3부":
      return "3부(16시)";
    default:
      return slot || "-";
  }
}

export default function BookingPrivatePage() {
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [product, setProduct] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState<SubmittedData | null>(null);

  const openAddressSearch = () => {
    const daum = (window as any).daum;

    if (!daum?.Postcode) {
      alert("주소 검색 기능을 불러오지 못했습니다.");
      return;
    }

    new daum.Postcode({
      oncomplete: function (data: any) {
        setAddress(data.roadAddress || data.jibunAddress || "");
      },
    }).open();
  };

  const resetForm = () => {
    setTitle("");
    setName("");
    setPhone("");
    setEmail("");
    setDate("");
    setTime("");
    setLocation("");
    setAddress("");
    setAddressDetail("");
    setDepositorName("");
    setProduct("");
    setMessage("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name || !phone || !date) {
      alert("촬영자명, 연락처, 촬영 날짜는 필수입니다.");
      return;
    }

    if (email && !email.includes("@")) {
      alert("이메일 형식이 올바르지 않습니다.");
      return;
    }

    setLoading(true);

    const dataToSave: SubmittedData = {
      title,
      name,
      phone,
      email,
      date,
      time,
      location,
      address,
      address_detail: addressDetail,
      depositor_name: depositorName,
      product,
      message,
      status: "pending",
    };

    const { error } = await supabase.from("booking_requests").insert(dataToSave);

    setLoading(false);

    if (error) {
      alert(`접수 실패: ${error.message}`);
      return;
    }

    setSubmittedData(dataToSave);
    resetForm();

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 50);
  };

  if (submittedData) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-[28px] bg-white p-8 shadow-sm">
          <p className="mb-2 text-sm tracking-[0.2em] text-black/40">
            BOOKING COMPLETE
          </p>
          <h1 className="mb-3 text-3xl font-semibold">신청이 완료되었습니다.</h1>
          <p className="mb-8 text-sm text-black/45">
            아래 신청 내용을 확인해 주세요.
          </p>

          <div className="space-y-3">
            <Item label="제목" value={submittedData.title} />
            <Item label="촬영자명 (돌잔치는 아기이름)" value={submittedData.name} />
            <Item label="연락처" value={submittedData.phone} />
            <Item label="이메일" value={submittedData.email} />
            <Item label="촬영 날짜" value={submittedData.date} />
            <Item label="촬영 시간" value={formatTimeSlot(submittedData.time)} />
            <Item label="촬영 장소" value={submittedData.location} />
            <Item label="주소" value={submittedData.address} />
            <Item label="상세주소" value={submittedData.address_detail} />
            <Item label="입금자명" value={submittedData.depositor_name} />
            <Item label="상품" value={submittedData.product} />
            <Item label="문의 내용" value={submittedData.message} multiline />
          </div>

         <div className="mt-8">
  <button
    type="button"
    onClick={() => {
      const phone = submittedData.phone?.replace(/[^\d+]/g, "") || "";

      if (!phone) {
        alert("연락처 정보가 없습니다.");
        return;
      }

      const message = [
        "[예약 신청 내용]",
        `제목: ${submittedData.title || "-"}`,
        `촬영자명: ${submittedData.name || "-"}`,
        `연락처: ${submittedData.phone || "-"}`,
        `이메일: ${submittedData.email || "-"}`,
        `촬영 날짜: ${submittedData.date || "-"}`,
        `촬영 시간: ${formatTimeSlot(submittedData.time)}`,
        `촬영 장소: ${submittedData.location || "-"}`,
        `주소: ${submittedData.address || "-"}`,
        `상세주소: ${submittedData.address_detail || "-"}`,
        `입금자명: ${submittedData.depositor_name || "-"}`,
        `상품: ${submittedData.product || "-"}`,
        `문의 내용: ${submittedData.message || "-"}`,
      ].join("\n");

      const encodedMessage = encodeURIComponent(message);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const smsUrl = isIOS
        ? `sms:${phone}&body=${encodedMessage}`
        : `sms:${phone}?body=${encodedMessage}`;

      window.location.href = smsUrl;
    }}
    className="h-12 rounded-full bg-black px-6 text-white transition hover:opacity-90"
  >
    문자로 내용 받기
  </button>
</div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="rounded-[28px] bg-white p-6 shadow-sm md:p-10">
        <div className="mb-10">
          <p className="mb-2 text-sm tracking-[0.2em] text-black/40">
            PRIVATE BOOKING
          </p>
          <h1 className="text-3xl font-semibold md:text-4xl">예약 신청서</h1>
          <p className="mt-3 text-sm text-black/45">
            아래 내용을 작성해 주시면 확인 후 연락드리겠습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목"
              className="h-16 rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 outline-none placeholder:text-black/30"
            />

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="촬영자명 (돌잔치는 아기이름) (필수)"
              className="h-16 rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 outline-none placeholder:text-black/30"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="연락처 (필수)"
              className="h-16 rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 outline-none placeholder:text-black/30"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="h-16 rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 outline-none placeholder:text-black/30"
            />

            <div className="space-y-2">
              <p className="px-1 text-sm text-black/45">촬영 날짜</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-16 w-full rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 outline-none"
              />
            </div>

            <div className="space-y-2">
              <p className="px-1 text-sm text-black/45">촬영 시간</p>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-16 w-full rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 outline-none text-black/70"
              >
                <option value="">시간 선택</option>
                <option value="1부">1부(12시)</option>
                <option value="2부">2부(14시30분)</option>
                <option value="3부">3부(18시)</option>
              </select>
            </div>

            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="촬영 장소"
              className="h-16 rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 outline-none placeholder:text-black/30 md:col-span-2"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={openAddressSearch}
              className="h-16 rounded-[22px] bg-black px-6 text-white transition hover:opacity-90"
            >
              주소 검색
            </button>
          </div>

          <input
            value={address}
            readOnly
            placeholder="주소"
            className="h-16 w-full rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 outline-none placeholder:text-black/30"
          />

          <input
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            placeholder="상세주소"
            className="h-16 w-full rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 outline-none placeholder:text-black/30"
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <input
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              placeholder="입금자명"
              className="h-16 rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 outline-none placeholder:text-black/30"
            />

            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="h-16 rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 outline-none text-black/70"
            >
              <option value="">상품 선택</option>
              <option value="돌스냅">돌스냅</option>
              <option value="웨딩스냅">웨딩스냅</option>
              <option value="고희연">고희연</option>
            </select>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="문의 내용"
            rows={8}
            className="w-full rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 py-5 outline-none placeholder:text-black/30"
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="h-14 rounded-full bg-black px-8 text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "접수 중..." : "예약 신청하기"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Item({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value?: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-black/10 bg-[#f7f5f2] px-5 py-4">
      <p className="mb-2 text-sm text-black/40">{label}</p>
      <p className={multiline ? "whitespace-pre-wrap" : ""}>{value || "-"}</p>
    </div>
  );
}