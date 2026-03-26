"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Booking = {
  id: string;
  title: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  address: string | null;
  address_detail: string | null;
  depositor_name: string | null;
  product: string | null;
  message: string | null;
  status: string | null;
  deposit_amount: number | null;
};

function Field({ label, name, value, onChange, type = "text", multiline = false }: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-[140px_1fr]">
      <label className="text-sm font-semibold text-black/55 pt-2">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black focus:border-black/30 focus:outline-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black focus:border-black/30 focus:outline-none"
        />
      )}
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-[140px_1fr]">
      <label className="text-sm font-semibold text-black/55 pt-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black focus:border-black/30 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
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
    status: "",
    deposit_amount: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/bookings?status=all`);
        const data = await res.json();
        const booking = data.bookings?.find((b: any) => b.id === id);
        if (booking) {
          setForm({
            title: booking.title || "",
            name: booking.name || "",
            phone: booking.phone || "",
            email: booking.email || "",
            date: booking.date || "",
            time: booking.time || "",
            location: booking.location || "",
            address: booking.address || "",
            address_detail: booking.address_detail || "",
            depositor_name: booking.depositor_name || "",
            product: booking.product || "",
            message: booking.message || "",
            status: booking.status || "pending",
            deposit_amount: booking.deposit_amount?.toString() || "0",
          });
        }
      } catch (err) {
        console.error("로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/booking-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id, ...form }),
      });
      if (!res.ok) throw new Error("저장 실패");
      alert("✅ 수정이 완료되었습니다.");
      router.push(`/admin/booking/calendar/${id}`);
      router.refresh();
    } catch {
      alert("❌ 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <div className="rounded-[28px] bg-white p-6 shadow-sm text-center text-gray-400">
          로딩 중...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <div className="rounded-[28px] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">예약 수정</h1>
          <Link href={`/admin/booking/calendar/${id}`} className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5">
            취소
          </Link>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-black/10">
          <div className="grid grid-cols-1 divide-y divide-black/10">
            <Field label="제목" name="title" value={form.title} onChange={handleChange} />
            <Field label="이름" name="name" value={form.name} onChange={handleChange} />
            <Field label="연락처" name="phone" value={form.phone} onChange={handleChange} />
            <Field label="이메일" name="email" value={form.email} onChange={handleChange} />
            <Field label="촬영날짜" name="date" value={form.date} onChange={handleChange} type="date" />
            <SelectField label="시간" name="time" value={form.time} onChange={handleChange} options={[
              { value: "", label: "선택 안함" },
              { value: "1부", label: "1부(12시)" },
              { value: "2부", label: "2부(14시30분)" },
              { value: "3부", label: "3부(18시)" },
            ]} />
            <Field label="장소" name="location" value={form.location} onChange={handleChange} />
            <Field label="주소" name="address" value={form.address} onChange={handleChange} />
            <Field label="상세주소" name="address_detail" value={form.address_detail} onChange={handleChange} />
            <Field label="입금자명" name="depositor_name" value={form.depositor_name} onChange={handleChange} />
            <Field label="상품구성" name="product" value={form.product} onChange={handleChange} />
            <SelectField label="상태" name="status" value={form.status} onChange={handleChange} options={[
              { value: "pending", label: "대기" },
              { value: "deposit_pending", label: "입금대기" },
              { value: "confirmed", label: "확정" },
              { value: "cancelled", label: "취소" },
            ]} />
            <Field label="내용" name="message" value={form.message} onChange={handleChange} multiline />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={handleSave} disabled={saving}
            className={`inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium text-white transition ${saving ? "bg-black/50" : "bg-black hover:opacity-90"}`}>
            {saving ? "저장 중..." : "💾 저장"}
          </button>
          <Link href={`/admin/booking/calendar/${id}`}
            className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-8 text-sm font-medium text-black transition hover:bg-black/5">
            취소
          </Link>
        </div>
      </div>
    </main>
  );
}
