"use client";

import { useTransition } from "react";
import { updateBookingStatus } from "@/app/admin/booking/actions";

type BookingStatus = "pending" | "confirmed" | "done" | "cancelled";

type Props = {
  id: string;
  currentStatus: BookingStatus;
};

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "pending", label: "대기" },
  { value: "confirmed", label: "확정" },
  { value: "done", label: "완료" },
  { value: "cancelled", label: "취소" },
];

export default function BookingStatusSelect({ id, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("status", e.target.value);

    startTransition(async () => {
      try {
        await updateBookingStatus(formData);
      } catch (error) {
        console.error(error);
        alert("상태 변경에 실패했습니다.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {isPending && <span className="text-xs text-gray-400">저장중...</span>}
    </div>
  );
}