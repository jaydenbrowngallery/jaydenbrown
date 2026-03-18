"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PrivateBookingPage() {
  const [form, setForm] = useState({
    title: "",
    name: "",
    phone: "",
    date: "",
    time: "",
    location: "",
    postcode: "",
    address: "",
    detailAddress: "",
    depositor: "",
    product: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("촬영자명을 입력해주세요.");
      return;
    }

    if (!form.phone.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("booking_requests").insert({
      title: form.title,
      name: form.name,
      phone: form.phone,
      date: form.date,
      time: form.time,
      location: form.location,
      postcode: form.postcode,
      address: form.address,
      detail_address: form.detailAddress,
      depositor: form.depositor,
      product: form.product,
      message: form.message,
    });

    setLoading(false);

    if (error) {
      alert("접수 실패: " + error.message);
      return;
    }

    alert("예약 신청이 접수되었습니다.");

    setForm({
      title: "",
      name: "",
      phone: "",
      date: "",
      time: "",
      location: "",
      postcode: "",
      address: "",
      detailAddress: "",
      depositor: "",
      product: "",
      message: "",
    });
  };

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-16 md:px-10">
      <section className="mx-auto max-w-4xl">

        <h1 className="text-3xl font-semibold text-black md:text-5xl">
          예약 신청서
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-2xl bg-white p-6 shadow-sm md:p-10"
        >
          <div className="grid gap-6 md:grid-cols-2">

            <input name="title" value={form.title} onChange={handleChange} placeholder="제목" className="input" />
            <input name="name" value={form.name} onChange={handleChange} placeholder="촬영자명" className="input" />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="연락처" className="input" />
            <input type="date" name="date" value={form.date} onChange={handleChange} className="input" />
            <input name="time" value={form.time} onChange={handleChange} placeholder="시간" className="input" />
            <input name="location" value={form.location} onChange={handleChange} placeholder="촬영 장소" className="input" />
            <input name="postcode" value={form.postcode} onChange={handleChange} placeholder="우편번호" className="input" />

            <input name="address" value={form.address} onChange={handleChange} placeholder="주소" className="input md:col-span-2" />
            <input name="detailAddress" value={form.detailAddress} onChange={handleChange} placeholder="상세주소" className="input md:col-span-2" />

            <input name="depositor" value={form.depositor} onChange={handleChange} placeholder="입금자명" className="input" />

            <select name="product" value={form.product} onChange={handleChange} className="input">
              <option value="">상품 선택</option>
              <option value="돌스냅">돌스냅</option>
              <option value="고희연">고희연</option>
              <option value="웨딩스냅">웨딩스냅</option>
            </select>

            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="문의 내용"
              className="input md:col-span-2 h-32"
            />

          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-full bg-black py-3 text-white transition hover:opacity-90"
          >
            {loading ? "접수 중..." : "예약 신청하기"}
          </button>
        </form>
      </section>
    </main>
  );
}