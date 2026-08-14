"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Status = "open" | "doing" | "done" | "hold";
type Req = {
  id: string;
  text: string;
  status: Status;
  created: string;
  updated?: string;
  note?: string;
};

const LABEL: Record<Status, string> = {
  open: "요청",
  doing: "진행중",
  done: "완료",
  hold: "보류",
};
const CHIP: Record<Status, string> = {
  open: "bg-[#b45309] text-white",
  doing: "bg-black text-white",
  done: "bg-black/10 text-black/40",
  hold: "bg-black/[0.06] text-black/35",
};

/* 세션이 끊기면 API가 /login 으로 리다이렉트되어 HTML이 돌아온다 */
async function readJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (res.redirected || !ct.includes("application/json")) {
    throw new Error("로그인이 필요합니다. 다시 로그인한 뒤 새로고침해주세요.");
  }
  return res.json();
}

export default function RequestBoard() {
  const [items, setItems] = useState<Req[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/requests", { cache: "no-store" });
      const json = await readJson(res);
      if (!res.ok) throw new Error(json.error || "불러오지 못했습니다.");
      setItems(json.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      const json = await readJson(res);
      if (!res.ok) throw new Error(json.error || "저장 실패");
      setText("");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: Status) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await readJson(res);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "변경 실패");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("이 요청을 삭제할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/requests?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await readJson(res);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  }

  const visible = useMemo(
    () => items.filter((i) => (showDone ? true : i.status !== "done")),
    [items, showDone]
  );
  const counts = useMemo(
    () => ({
      open: items.filter((i) => i.status === "open").length,
      doing: items.filter((i) => i.status === "doing").length,
      done: items.filter((i) => i.status === "done").length,
      hold: items.filter((i) => i.status === "hold").length,
    }),
    [items]
  );

  return (
    <div>
      {/* 입력 */}
      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add();
          }}
          rows={3}
          placeholder="요청할 내용을 적어두세요. (예: 발주 완료 파일 자동 정리 만들어줘)"
          className="w-full resize-none rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-[14px] leading-[1.7] text-black outline-none transition focus:border-black/25"
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[12px] text-black/35">⌘+Enter 로도 등록됩니다</p>
          <button
            onClick={add}
            disabled={busy || !text.trim()}
            className="rounded-full bg-black px-6 py-2.5 text-[13.5px] font-medium text-white transition hover:bg-black/85 disabled:opacity-30"
          >
            요청 등록
          </button>
        </div>
      </div>

      {/* 카운트 */}
      <div className="mt-5 flex flex-wrap items-center gap-2 text-[12.5px]">
        <span className="rounded-full bg-[#b45309] px-3 py-1 text-white">요청 {counts.open}</span>
        <span className="rounded-full bg-black px-3 py-1 text-white">진행중 {counts.doing}</span>
        <span className="rounded-full bg-black/[0.06] px-3 py-1 text-black/45">보류 {counts.hold}</span>
        <span className="rounded-full bg-black/[0.06] px-3 py-1 text-black/45">완료 {counts.done}</span>
        <button
          onClick={() => setShowDone((v) => !v)}
          className="ml-auto text-[12.5px] text-black/45 underline underline-offset-2"
        >
          {showDone ? "완료 숨기기" : "완료 보기"}
        </button>
      </div>

      {loading && <p className="mt-6 text-[13px] text-black/40">불러오는 중…</p>}
      {error && (
        <div className="mt-5 rounded-2xl bg-[#fdeaea] px-5 py-4 text-[13px] text-[#9b2c2c]">
          {error}
          <button onClick={load} className="ml-2 underline">
            다시 시도
          </button>
        </div>
      )}

      {/* 목록 */}
      {!loading && !visible.length && !error && (
        <p className="mt-8 text-center text-[13px] text-black/35">등록된 요청이 없습니다.</p>
      )}

      <div className="mt-4 space-y-2.5">
        {visible.map((r) => (
          <div key={r.id} className="rounded-2xl border border-black/10 bg-white px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p
                  className={`whitespace-pre-wrap text-[14px] leading-[1.75] ${
                    r.status === "done" ? "text-black/35 line-through" : "text-black/75"
                  }`}
                >
                  {r.text}
                </p>
                <p className="mt-2 text-[11.5px] text-black/30">
                  {r.created.replace("T", " ")}
                  {r.updated ? ` · 변경 ${r.updated.replace("T", " ")}` : ""}
                </p>
                {r.note && (
                  <p className="mt-2.5 rounded-xl bg-black/[0.035] px-3.5 py-2.5 text-[12.5px] leading-[1.8] text-black/55">
                    <span className="text-black/35">Claude 메모 · </span>
                    {r.note}
                  </p>
                )}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${CHIP[r.status]}`}>
                {LABEL[r.status]}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {(["open", "doing", "hold", "done"] as Status[])
                .filter((s) => s !== r.status)
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(r.id, s)}
                    disabled={busy}
                    className="rounded-full border border-black/10 px-3 py-1 text-[12px] text-black/50 transition hover:border-black/30 disabled:opacity-40"
                  >
                    {LABEL[s]}로
                  </button>
                ))}
              <button
                onClick={() => remove(r.id)}
                disabled={busy}
                className="ml-auto text-[12px] text-black/30 underline underline-offset-2 disabled:opacity-40"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
