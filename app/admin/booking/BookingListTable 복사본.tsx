"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BookingRequest = {
  id: string;
  created_at?: string | null;
  title?: string | null;
  name?: string | null;
  phone?: string | null;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  status?: string | null;
};

function formatTimeSlot(slot?: string | null) {
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

function formatStatus(status?: string | null) {
  switch (status) {
    case "confirmed":
      return <span className="text-green-600">확정</span>;
    case "cancelled":
      return <span className="text-red-500">취소</span>;
    default:
      return <span className="text-gray-400">대기</span>;
  }
}

function formatCreatedAt(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const period = hours >= 12 ? "오후" : "오전";
  const displayHours = hours % 12 || 12;

  return `${year}. ${month}. ${day}. ${period} ${displayHours}:${minutes}:${seconds}`;
}

export default function BookingListTable({
  items,
}: {
  items: BookingRequest[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const isAllSelected = useMemo(() => {
    return items.length > 0 && selectedIds.length === items.length;
  }, [items.length, selectedIds.length]);

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(items.map((item) => item.id));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) {
      alert("삭제할 항목을 선택해 주세요.");
      return;
    }

    const confirmed = window.confirm(
      `선택한 ${selectedIds.length}건을 삭제할까요?`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const res = await fetch("/api/booking/delete-selected", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        alert(result.message || "선택 삭제에 실패했습니다.");
        return;
      }

      setSelectedIds([]);
      alert("선택한 예약이 삭제되었습니다.");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("선택 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">전체 예약 리스트</h2>

        <button
          type="button"
          onClick={handleDeleteSelected}
          disabled={selectedIds.length === 0 || deleting}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "삭제 중..." : "선택 삭제"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold">신청일</th>
              <th className="px-4 py-3 text-left font-semibold">이름</th>
              <th className="px-4 py-3 text-left font-semibold">연락처</th>
              <th className="px-4 py-3 text-left font-semibold">제목</th>
              <th className="px-4 py-3 text-left font-semibold">날짜</th>
              <th className="px-4 py-3 text-left font-semibold">시간</th>
              <th className="px-4 py-3 text-left font-semibold">장소</th>
              <th className="px-4 py-3 text-left font-semibold">상태</th>
              <th className="px-4 py-3 text-left font-semibold">상세</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleOne(item.id)}
                  />
                </td>
                <td className="px-4 py-3">{formatCreatedAt(item.created_at)}</td>
                <td className="px-4 py-3">{item.name ?? "-"}</td>
                <td className="px-4 py-3">{item.phone ?? "-"}</td>
                <td className="px-4 py-3">{item.title ?? "-"}</td>
                <td className="px-4 py-3">{item.date ?? "-"}</td>
                <td className="px-4 py-3">{formatTimeSlot(item.time)}</td>
                <td className="px-4 py-3">{item.location ?? "-"}</td>
                <td className="px-4 py-3">{formatStatus(item.status)}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/booking/${item.id}`}
                    className="inline-flex rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    보기
                  </Link>
                </td>
              </tr>
            ))}

            {!items.length && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}