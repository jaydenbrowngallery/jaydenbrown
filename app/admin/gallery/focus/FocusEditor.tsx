"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Item = { key: string; url: string; post: string; manual?: string; auto?: unknown };

const RATIOS = ["3/4", "1/1", "4/5", "16/9"] as const;

async function readJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (res.redirected || !ct.includes("application/json")) {
    throw new Error("로그인이 필요합니다. 다시 로그인한 뒤 새로고침해주세요.");
  }
  return res.json();
}

/** 드래그로 구도를 잡는 편집기 — 사진을 끌면 보이는 영역이 움직인다 */
function Editor({
  item,
  ratio,
  onSaved,
}: {
  item: Item;
  ratio: string;
  onSaved: (key: string, pos: string | null) => void;
}) {
  const [pos, setPos] = useState(item.manual || "50% 50%");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    setPos(item.manual || "50% 50%");
    setDirty(false);
  }, [item.manual, item.key]);

  const nums = pos.split(/\s+/).map((v) => parseFloat(v));
  const px = isFinite(nums[0]) ? nums[0] : 50;
  const py = isFinite(nums[1]) ? nums[1] : 50;

  const start = (cx: number, cy: number) => {
    drag.current = { x: cx, y: cy, px, py };
  };
  const move = (cx: number, cy: number) => {
    const d = drag.current;
    const el = box.current;
    if (!d || !el) return;
    const r = el.getBoundingClientRect();
    // 끌는 방향과 사진이 움직이는 방향을 맞춘다(왼쪽으로 끌면 오른쪽이 보인다)
    const nx = Math.max(0, Math.min(100, d.px - ((cx - d.x) / r.width) * 100));
    const ny = Math.max(0, Math.min(100, d.py - ((cy - d.y) / r.height) * 100));
    setPos(`${nx.toFixed(1)}% ${ny.toFixed(1)}%`);
    setDirty(true);
  };
  const end = () => {
    drag.current = null;
  };

  async function save(reset = false) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/gallery-focus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reset ? { key: item.key, reset: true } : { key: item.key, pos }),
      });
      const json = await readJson(res);
      if (!res.ok) throw new Error(json.error || "저장 실패");
      onSaved(item.key, json.pos ?? null);
      setDirty(false);
      if (reset) setPos("50% 50%");
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-3">
      <div
        ref={box}
        className="relative w-full touch-none select-none overflow-hidden rounded-xl bg-[#e8e4de]"
        style={{ aspectRatio: ratio, cursor: drag.current ? "grabbing" : "grab" }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          start(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => drag.current && move(e.clientX, e.clientY)}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <img
          src={item.url}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
          style={{ objectPosition: pos }}
        />
        {/* 3분할 안내선 */}
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute inset-y-0 left-1/3 w-px bg-white" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-white" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-white" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white" />
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <p className="truncate text-[11.5px] text-black/35">
          {item.manual ? "직접 지정" : "자동"} · {pos}
        </p>
        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={() => save(true)}
            disabled={busy || !item.manual}
            className="rounded-full border border-black/12 px-3 py-1.5 text-[12px] text-black/50 transition hover:border-black/30 disabled:opacity-30"
          >
            자동으로
          </button>
          <button
            onClick={() => save(false)}
            disabled={busy || !dirty}
            className="rounded-full bg-black px-4 py-1.5 text-[12px] font-medium text-white transition hover:bg-black/85 disabled:opacity-25"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FocusEditor() {
  const [items, setItems] = useState<Item[]>([]);
  const [ratio, setRatio] = useState<string>("3/4");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onlyAuto, setOnlyAuto] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/gallery-focus", { cache: "no-store" });
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

  const onSaved = (key: string, pos: string | null) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, manual: pos ?? undefined } : i)));

  const shown = onlyAuto ? items.filter((i) => !i.manual) : items;
  const manualCount = items.filter((i) => i.manual).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[12.5px] text-black/45">미리보기 비율</p>
        {RATIOS.map((r) => (
          <button
            key={r}
            onClick={() => setRatio(r)}
            className={`rounded-full border px-3 py-1.5 text-[12.5px] transition ${
              ratio === r ? "border-black/70 text-black/75" : "border-black/12 text-black/40 hover:border-black/30"
            }`}
          >
            {r}
          </button>
        ))}
        <button
          onClick={() => setOnlyAuto((v) => !v)}
          className="ml-auto text-[12.5px] text-black/45 underline underline-offset-2"
        >
          {onlyAuto ? `전체 보기 (${items.length})` : `미지정만 보기 (${items.length - manualCount})`}
        </button>
      </div>

      <p className="mt-3 text-[12.5px] leading-[1.8] text-black/40">
        사진을 손가락(또는 마우스)으로 끌어 구도를 맞춘 뒤 <span className="text-black/65">저장</span>을 누르세요.
        저장한 사진은 자동 계산을 무시하고 이 구도로 고정됩니다.
      </p>

      {loading && <p className="mt-6 text-[13px] text-black/40">불러오는 중…</p>}
      {error && (
        <div className="mt-5 rounded-2xl bg-[#fdeaea] px-5 py-4 text-[13px] text-[#9b2c2c]">
          {error}
          <button onClick={load} className="ml-2 underline">
            다시 시도
          </button>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {shown.map((it) => (
          <Editor key={it.key} item={it} ratio={ratio} onSaved={onSaved} />
        ))}
      </div>

      {!loading && !shown.length && !error && (
        <p className="mt-8 text-center text-[13px] text-black/35">표시할 사진이 없습니다.</p>
      )}
    </div>
  );
}
