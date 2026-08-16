"use client";

import { useCallback, useEffect, useState } from "react";

type Item = {
  id: string;
  title: string;
  cover: string | null;
  created: string;
  photos: number;
  season: string;
  seasonDefault: string;
  note: string;
};

const SEASONS = ["봄", "여름", "가을", "겨울"];

async function readJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (res.redirected || !ct.includes("application/json")) {
    throw new Error("로그인이 필요합니다. 다시 로그인한 뒤 새로고침해주세요.");
  }
  return res.json();
}

export default function StoryMeta() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [intro, setIntro] = useState("");
  const [introSaved, setIntroSaved] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/gallery-meta", { cache: "no-store" });
      const json = await readJson(res);
      if (!res.ok) throw new Error(json.error || "불러오지 못했습니다.");
      setItems(json.items);
      setDraft(Object.fromEntries(json.items.map((i: Item) => [i.id, i.note])));
      setIntro(json.intro || "");
      setIntroSaved(json.intro || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveIntro() {
    setBusy("intro");
    try {
      const res = await fetch("/api/admin/gallery-meta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intro }),
      });
      const json = await readJson(res);
      if (!res.ok) throw new Error(json.error || "저장 실패");
      setIntro(json.intro ?? "");
      setIntroSaved(json.intro ?? "");
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy("");
    }
  }

  async function patch(id: string, payload: Record<string, unknown>) {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/gallery-meta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const json = await readJson(res);
      if (!res.ok) throw new Error(json.error || "저장 실패");
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, season: json.season ?? "", note: json.note ?? "" }
            : i
        )
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      {/* 상단 글귀 — 줄바꿈이 화면에 그대로 반영된다 */}
      <div className="mb-8 rounded-2xl border border-black/10 bg-white p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[14px] font-medium text-black/75">상단 글귀</p>
          <p className="text-[11.5px] text-black/35">줄바꿈 그대로 표시됩니다</p>
        </div>
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={5}
          maxLength={600}
          placeholder={"한 줄씩 끊어 쓰면 그대로 보입니다.\n빈 줄을 넣으면 문단이 나뉩니다."}
          className="mt-3 w-full resize-y rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-[13.5px] leading-[1.9] text-black outline-none transition focus:border-black/25"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11.5px] text-black/30">{intro.length}/600자</p>
          <button
            onClick={saveIntro}
            disabled={busy === "intro" || intro === introSaved}
            className="rounded-full bg-black px-5 py-2 text-[12.5px] font-medium text-white transition hover:bg-black/85 disabled:opacity-25"
          >
            저장
          </button>
        </div>
      </div>

      <p className="text-[13px] leading-[1.85] text-black/45">
        갤러리에 표시할 계절과 멘트를 스토리별로 정합니다.
        <br />
        계절을 고르지 않으면 등록 월로 추정한 값이 쓰입니다.
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

      <div className="mt-5 space-y-3">
        {items.map((it) => (
          <div key={it.id} className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="flex gap-4">
              {it.cover && (
                <img
                  src={it.cover}
                  alt=""
                  className="h-20 w-16 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-black/75">
                  {it.title || "(제목 없음)"}
                </p>
                <p className="mt-1 text-[11.5px] text-black/35">
                  {it.created} · 사진 {it.photos}장
                </p>

                {/* 계절 */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {SEASONS.map((s) => {
                    const on = it.season === s;
                    return (
                      <button
                        key={s}
                        onClick={() => patch(it.id, { season: on ? "" : s })}
                        disabled={busy === it.id}
                        className={`rounded-full border px-3 py-1.5 text-[12.5px] transition disabled:opacity-40 ${
                          on
                            ? "border-black/70 bg-black text-white"
                            : "border-black/12 text-black/45 hover:border-black/30"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                  {!it.season && (
                    <span className="ml-1 text-[11.5px] text-black/30">
                      자동 · {it.seasonDefault}
                    </span>
                  )}
                </div>

                {/* 멘트 */}
                <div className="mt-3 flex gap-2">
                  <textarea
                    value={draft[it.id] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [it.id]: e.target.value }))}
                    rows={2}
                    maxLength={300}
                    placeholder={"멘트 (줄바꿈 가능)\n예: 벚꽃이 흩날리던 오후"}
                    className="min-w-0 flex-1 resize-y rounded-xl border border-black/10 bg-[#fafafa] px-3.5 py-2.5 text-[13px] leading-[1.8] text-black outline-none transition focus:border-black/25"
                  />
                  <button
                    onClick={() => patch(it.id, { note: draft[it.id] ?? "" })}
                    disabled={busy === it.id || (draft[it.id] ?? "") === it.note}
                    className="shrink-0 rounded-full bg-black px-4 py-2 text-[12.5px] font-medium text-white transition hover:bg-black/85 disabled:opacity-25"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && !items.length && !error && (
        <p className="mt-8 text-center text-[13px] text-black/35">스토리가 없습니다.</p>
      )}
    </div>
  );
}
