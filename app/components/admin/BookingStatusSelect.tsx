"use client";

type BookingStatus = "pending" | "confirmed" | "done" | "cancelled";

type Props = {
  id: string;
  currentStatus: BookingStatus;
};

export default function BookingStatusSelect({ currentStatus }: Props) {
  return (
    <span className="text-sm text-black/50">
      {currentStatus === "confirmed" ? "접수완료" : "접수대기"}
    </span>
  );
}