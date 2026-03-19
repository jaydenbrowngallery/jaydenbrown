"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function formatTimeSlotLabel(slot: string) {
  switch (slot) {
    case "1부":
      return "1부(12시)";
    case "2부":
      return "2부(14시30분)";
    case "3부":
      return "3부(16시)";
    default:
      return slot;
  }
}

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<any>({
    title: "",
    name: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    location: "",
    address: "",
    address_detail: "",
    depositor_name: "",
    product: "",
    message: "",
    status: "pending",
  });

  // 🔥 기존 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("booking_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setForm(data);
      }
    };

    fetchData();
  }, [id]);

  // 🔥 값 변경
  const handleChange = (key: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 🔥 저장
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("booking_requests")
      .update(form)
      .eq("id", id);

    setLoading(false);

    if (error) {
      alert("수정 실패");
      return;
    }

    alert("수정 완료");
    router.push(`/admin/booking/${id}`);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">신청서 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="제목" value={form.title} onChange={(v) => handleChange("title", v)} />
        <Input label="이름" value={form.name} onChange={(v) => handleChange("name", v)} />
        <Input label="연락처" value={form.phone} onChange={(v) => handleChange("phone", v)} />
        <Input label="이메일" value={form.email} onChange={(v) => handleChange("email", v)} />

        <Input label="날짜" type="date" value={form.date} onChange={(v) => handleChange("date", v)} />

        {/* 시간 */}
        <div>
          <p className="mb-2 text-sm text-black/40">시간</p>
          <select
            value={form.time}
            onChange={(e) => handleChange("time", e.target.value)}
            className="h-14 w-full rounded-xl border px-4"
          >
            <option value="">선택</option>
            <option value="1부">1부(12시)</option>
            <option value="2부">2부(14시30분)</option>
            <option value="3부">3부(16시)</option>
          </select>
        </div>

        <Input label="촬영 장소" value={form.location} onChange={(v) => handleChange("location", v)} />
        <Input label="주소" value={form.address} onChange={(v) => handleChange("address", v)} />
        <Input label="상세주소" value={form.address_detail} onChange={(v) => handleChange("address_detail", v)} />

        <Input label="입금자명" value={form.depositor_name} onChange={(v) => handleChange("depositor_name", v)} />

        {/* 상품 */}
        <div>
          <p className="mb-2 text-sm text-black/40">상품</p>
          <select
            value={form.product}
            onChange={(e) => handleChange("product", e.target.value)}
            className="h-14 w-full rounded-xl border px-4"
          >
            <option value="">선택</option>
            <option value="돌스냅">돌스냅</option>
            <option value="웨딩스냅">웨딩스냅</option>
            <option value="고희연">고희연</option>
          </select>
        </div>

        {/* 상태 */}
        <div>
          <p className="mb-2 text-sm text-black/40">상태</p>
          <select
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="h-14 w-full rounded-xl border px-4"
          >
            <option value="pending">대기</option>
            <option value="confirmed">확정</option>
            <option value="cancelled">취소</option>
          </select>
        </div>

        {/* 메시지 */}
        <div>
          <p className="mb-2 text-sm text-black/40">문의 내용</p>
          <textarea
            value={form.message}
            onChange={(e) => handleChange("message", e.target.value)}
            className="w-full rounded-xl border p-4"
            rows={6}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-black px-6 py-3 text-white"
          >
            {loading ? "저장 중..." : "저장하기"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border px-6 py-3"
          >
            취소
          </button>
        </div>
      </form>
    </main>
  );
}

// 🔥 공통 input 컴포넌트
function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm text-black/40">{label}</p>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-full rounded-xl border px-4"
      />
    </div>
  );
}