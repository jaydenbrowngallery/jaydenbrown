// app/admin/booking/CalendarSyncManager.tsx
"use client";

import { useState } from "react";

export default function CalendarSyncManager() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubscribe() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/google-calendar-subscribe", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setMessage(`✅ Watch 설정 완료 (만료: ${data.expiration})`);
      } else {
        setMessage(`❌ 실패: ${JSON.stringify(data.error)}`);
      }
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    }
    setLoading(false);
  }

  async function handleSync() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/calendar-sync");
      const data = await res.json();
      if (data.ok) {
        setMessage(`✅ 동기화 완료: ${data.eventsChecked}개 확인, ${data.processed}개 처리`);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    }
    setLoading(false);
  }

  return (
    <div style={{
      padding: "16px",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      marginTop: "16px",
      background: "#fafafa",
    }}>
      <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>📅 캘린더 동기화</h3>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            padding: "6px 14px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            fontSize: "13px",
          }}
        >
          ▶ Watch 시작/갱신
        </button>
        <button
          onClick={handleSync}
          disabled={loading}
          style={{
            padding: "6px 14px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            fontSize: "13px",
          }}
        >
          🔄 수동 동기화
        </button>
      </div>
      {message && (
        <div style={{
          padding: "8px 12px",
          background: message.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
          borderRadius: "6px",
          fontSize: "13px",
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
