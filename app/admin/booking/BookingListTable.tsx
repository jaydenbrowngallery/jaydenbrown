"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BookingListItem = {
  id: string;
  created_at?: string | null;
  title?: string | null;
  name?: string | null;
  phone?: string | null;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  status?: string | null;
  source?: "booking" | "calendar";
  detailHref?: string | null;
};

const ITEMS_PER_PAGE = 30;

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

function formatStatus(status?: string | null, source?: string | null) {
  if (source === "calendar") {
    return <span className="text-amber-700">기존 일정</span>;
  }

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
  items: BookingListItem[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const deletableItems = useMemo(
    () => items.filter((item) => (item.source || "booking") === "booking"),
    [items]
  );

  const deletableIds = useMemo(
    () => deletableItems.map((item) => item.id),
    [deletableItems]
  );

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [items]);

  const pagedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  const currentPageBookingIds = useMemo(
    () =>
      pagedItems
        .filter((item) => (item.source || "booking") === "booking")
        .map((item) => item.id),
    [pagedItems]
  );

  const isAllSelected = useMemo(() => {
    return (
      currentPageBookingIds.length > 0 &&
      currentPageBookingIds.every((id) => selectedIds.includes(id))
    );
  }, [currentPageBookingIds, selectedIds]);

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !currentPageBookingIds.includes(id))
      );
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      currentPageBookingIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const toggleOne = (id: string, source?: string | null) => {
    if ((source || "booking") !== "booking") return;

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

  const startNumber = items.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endNumber = Math.min(currentPage * ITEMS_PER_PAGE, items.length);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">전체 예약 리스트</h2>
          <p className="mt-1 text-sm text-gray-500">
            전체 {items.length}건 중 {startNumber}-{endNumber} 표시
          </p>
        </div>

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
              <th className="px-4 py-3 text-left font-semibold">구분</th>
              <th className="px-4 py-3 text-left font-semibold">신청일/등록일</th>
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
            {pagedItems.map((item) => {
              const source = item.source || "booking";
              const isBooking = source === "booking";
              const href =
                item.detailHref || (isBooking ? `/admin/booking/${item.id}` : null);

              return (
                <tr key={`${source}-${item.id}`} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    {isBooking ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleOne(item.id, item.source)}
                      />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {isBooking ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                        예약
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                        기존 일정
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">{formatCreatedAt(item.created_at)}</td>
                  <td className="px-4 py-3">{item.name ?? "-"}</td>
                  <td className="px-4 py-3">{item.phone ?? "-"}</td>
                  <td className="px-4 py-3">{item.title ?? "-"}</td>
                  <td className="px-4 py-3">{item.date ?? "-"}</td>
                  <td className="px-4 py-3">{formatTimeSlot(item.time)}</td>
                  <td className="px-4 py-3">{item.location ?? "-"}</td>
                  <td className="px-4 py-3">{formatStatus(item.status, item.source)}</td>
                  <td className="px-4 py-3">
                    {href ? (
                      <Link
                        href={href}
                        className="inline-flex rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        보기
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!pagedItems.length && (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-500">
          페이지 {currentPage} / {totalPages}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            이전
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}