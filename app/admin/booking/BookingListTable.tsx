"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

export default function BookingListTable({
  items,
  deleteSelectedAction,
}: {
  items: BookingRequest[];
  deleteSelectedAction: (formData: FormData) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  return (
    <form action={deleteSelectedAction}>
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="selectedIds" value={id} />
      ))}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">전체 예약 리스트</h2>

        <button
          type="submit"
          disabled={selectedIds.length === 0}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          선택 삭제
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
                <td className="px-4 py-3">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString("ko-KR")
                    : "-"}
                </td>
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
    </form>
  );
}