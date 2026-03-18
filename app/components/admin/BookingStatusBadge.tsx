type BookingStatus = "pending" | "confirmed" | "done" | "cancelled";

type Props = {
  status: BookingStatus;
};

const statusMap = {
  pending: {
    label: "대기",
    className: "bg-yellow-100 text-yellow-800",
  },
  confirmed: {
    label: "확정",
    className: "bg-blue-100 text-blue-800",
  },
  done: {
    label: "완료",
    className: "bg-green-100 text-green-800",
  },
  cancelled: {
    label: "취소",
    className: "bg-red-100 text-red-800",
  },
};

export default function BookingStatusBadge({ status }: Props) {
  const item = statusMap[status] ?? statusMap.pending;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.className}`}
    >
      {item.label}
    </span>
  );
}