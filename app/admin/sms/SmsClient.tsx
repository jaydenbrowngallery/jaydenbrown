"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Target = {
  phone: string;
  parent: string;
  baby: string;
  date: string;
  title: string;
  status: "pending" | "sent" | "skipped";
  at?: string;
};

const TEMPLATE_KEY = "sms_campaign_template_v4";

const DEFAULT_TEMPLATE = `(광고) 제이든브라운

안녕하세요? {아기이름} 돌잔치 함께한 제이든 브라운입니다.

그동안 잘 지내셨는지요.
제가 10년째 운영해온 셀프 스튜디오 '연후'를
알려드리려 문자드려요^^

자세한 내용은 아래 링크 확인부탁드려요^^

https://jaydenbrown.kr/event

무료수신거부 : '거부' 회신`;

/** "안소이" → "소이" (성을 뗀 이름). 쌍둥이 등 5자 이상은 그대로 둔다. */
function givenName(full: string) {
  const s = (full || "").trim();
  return /^[가-힣]{2,3}$/.test(s) ? s.slice(1) : s;
}

function fillTemplate(tpl: string, t: Target) {
  const month = t.date ? `${Number(t.date.slice(5, 7))}월` : "";
  // 보호자명이 비어 있는 일정이 몇 건 있어, 그때는 "○○ 보호자님"으로 부른다.
  const honorific = t.parent
    ? `${t.parent}님`
    : t.baby
      ? `${t.baby} 보호자님`
      : "안녕하세요";
  return tpl
    .replaceAll("{보호자님}", honorific)
    .replaceAll("{보호자}", t.parent || t.baby || "")
    .replaceAll("{아기이름}", givenName(t.baby))
    .replaceAll("{아기}", t.baby || "")
    .replaceAll("{촬영월}", month)
    .replaceAll("{촬영일}", t.date || "");
}

function formatPhone(p: string) {
  return p.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
}

/* 세션이 만료되면 API가 /login 으로 리다이렉트되어 HTML이 돌아온다.
   그때 JSON 파싱 오류가 뜨지 않게 미리 걸러낸다. */
async function readJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (res.redirected || !ct.includes("application/json")) {
    throw new Error("로그인이 필요합니다. 관리자로 로그인한 뒤 다시 열어주세요.");
  }
  return res.json();
}

/** 카카오·문자앱 프리필: iOS는 &body=, 안드로이드는 ?body= */
function smsHref(phone: string, body: string) {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const sep = /iPhone|iPad|iPod|Macintosh/i.test(ua) ? "&" : "?";
  return `sms:${phone}${sep}body=${encodeURIComponent(body)}`;
}

export default function SmsClient() {
  const [items, setItems] = useState<Target[]>([]);
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [opened, setOpened] = useState(false); // 문자앱을 한 번 열었는지

  useEffect(() => {
    const saved = localStorage.getItem(TEMPLATE_KEY);
    if (saved) setTemplate(saved);
  }, []);

  const load = useCallback(async (m: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/sms-campaign?months=${m}`, { cache: "no-store" });
      const json = await readJson(res);
      if (!res.ok) throw new Error(json.error || "명단을 불러오지 못했습니다.");
      setItems(json.items);
      setMonths(json.months);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(6);
  }, [load]);

  const counts = useMemo(
    () => ({
      total: items.length,
      sent: items.filter((i) => i.status === "sent").length,
      skipped: items.filter((i) => i.status === "skipped").length,
      pending: items.filter((i) => i.status === "pending").length,
    }),
    [items]
  );

  const current = useMemo(() => items.find((i) => i.status === "pending"), [items]);
  const message = current ? fillTemplate(template, current) : "";

  // 야간 발송 금지(21시~08시) 안내
  const nightWarning = useMemo(() => {
    const kst = new Date(Date.now() + (new Date().getTimezoneOffset() + 540) * 60000);
    const h = kst.getHours();
    return h >= 21 || h < 8;
  }, [items]);

  async function mark(phone: string, action: "sent" | "skipped" | "reset") {
    setBusy(phone + action);
    try {
      const res = await fetch("/api/admin/sms-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, action }),
      });
      const json = await readJson(res);
      if (!res.ok) throw new Error(json.error || "저장 실패");
      setItems((prev) =>
        prev.map((i) =>
          i.phone === phone
            ? { ...i, status: action === "reset" ? "pending" : action, at: json.at }
            : i
        )
      );
      setOpened(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy("");
    }
  }

  function saveTemplate() {
    localStorage.setItem(TEMPLATE_KEY, template);
    setEditing(false);
  }

  const progress = counts.total ? ((counts.sent + counts.skipped) / counts.total) * 100 : 0;

  return (
    <div className="mx-auto max-w-[560px] px-5 py-8 md:px-8">
      <p className="text-[11px] uppercase tracking-[0.3em] text-black/30">SMS Campaign</p>
      <h1 className="mt-3 text-[1.35rem] font-medium tracking-[-0.02em] text-black/80">
        셀프스튜디오 안내 문자
      </h1>
      <p className="mt-2 text-[13px] leading-[1.9] text-black/45">
        최근 {months}개월 촬영 고객 명단입니다. 한 명씩 문자앱을 열어 직접 보내시고,
        <br />
        보낸 뒤 <span className="text-black/65">발송 완료</span>를 누르면 다음 분으로 넘어갑니다.
      </p>

      {/* 진행률 */}
      <div className="mt-6 rounded-2xl border border-black/8 bg-white px-5 py-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] text-black/50">진행</p>
          <p className="text-[14px] font-medium text-black/75">
            {counts.sent + counts.skipped} / {counts.total}
          </p>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/8">
          <div className="h-full rounded-full bg-black/70 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-[12px] text-black/40">
          발송 {counts.sent} · 건너뜀 {counts.skipped} · 남음 {counts.pending}
        </p>
      </div>

      {nightWarning && (
        <div className="mt-4 rounded-2xl bg-[#fdf3e7] px-5 py-4 text-[12.5px] leading-[1.8] text-[#8a5a1a]">
          지금은 21시~08시 사이입니다. 광고성 문자는 이 시간대 발송이 금지되어 있으니
          08시 이후에 보내주세요.
        </div>
      )}

      {loading && <p className="mt-8 text-[13px] text-black/40">명단을 불러오는 중…</p>}
      {error && (
        <div className="mt-6 rounded-2xl bg-[#fdeaea] px-5 py-4 text-[13px] leading-[1.8] text-[#9b2c2c]">
          {error}
          <button onClick={() => load(months)} className="ml-2 underline">
            다시 시도
          </button>
        </div>
      )}

      {/* ── 현재 대상 ── */}
      {!loading && current && (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white px-5 py-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-black/30">Next</p>
          <p className="mt-3 text-[1.15rem] font-medium text-black/80">
            {current.parent || "이름 없음"}
            <span className="ml-2 text-[13px] font-normal text-black/40">
              {current.baby && `${current.baby} 돌스냅`}
            </span>
          </p>
          <p className="mt-1.5 text-[13px] text-black/45">
            {current.date} · {formatPhone(current.phone)}
          </p>

          {/* 문구 미리보기 */}
          <div className="mt-5 whitespace-pre-line rounded-xl bg-black/[0.035] px-4 py-4 text-[13px] leading-[1.85] text-black/60">
            {message}
          </div>

          {/* globals.css의 a { color: inherit } 가 텍스트 색을 덮어써서 버튼으로 처리 */}
          <button
            onClick={() => {
              setOpened(true);
              window.location.href = smsHref(current.phone, message);
            }}
            className="mt-5 block w-full rounded-full bg-black py-4 text-center text-[14.5px] font-medium text-white transition hover:bg-black/85"
          >
            문자앱 열기 ({formatPhone(current.phone)})
          </button>

          <div className="mt-3 flex gap-2.5">
            <button
              onClick={() => mark(current.phone, "sent")}
              disabled={!!busy}
              className={`flex-1 rounded-full py-3.5 text-[14px] font-medium transition ${
                opened
                  ? "bg-black/85 text-white hover:bg-black"
                  : "border border-black/15 text-black/60 hover:border-black/30"
              } disabled:opacity-40`}
            >
              발송 완료 · 다음
            </button>
            <button
              onClick={() => mark(current.phone, "skipped")}
              disabled={!!busy}
              className="rounded-full border border-black/10 px-5 py-3.5 text-[13.5px] text-black/45 transition hover:border-black/25 disabled:opacity-40"
            >
              건너뛰기
            </button>
          </div>

          <button
            onClick={() => navigator.clipboard?.writeText(message)}
            className="mt-3 w-full text-center text-[12.5px] text-black/35 underline underline-offset-2"
          >
            문구 복사 (문자앱이 자동으로 안 채워질 때)
          </button>
        </div>
      )}

      {!loading && !current && counts.total > 0 && (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white px-5 py-8 text-center">
          <p className="text-[14.5px] font-medium text-black/70">모두 처리했습니다.</p>
          <p className="mt-2 text-[13px] text-black/45">
            발송 {counts.sent}건 · 건너뜀 {counts.skipped}건
          </p>
        </div>
      )}

      {/* ── 문구 편집 ── */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.3em] text-black/30">Message</p>
          <button
            onClick={() => (editing ? saveTemplate() : setEditing(true))}
            className="text-[12.5px] text-black/50 underline underline-offset-2"
          >
            {editing ? "저장" : "문구 수정"}
          </button>
        </div>
        {editing ? (
          <>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={16}
              className="mt-3 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[13px] leading-[1.8] text-black outline-none focus:border-black/25"
            />
            <p className="mt-2 text-[12px] leading-[1.8] text-black/35">
              사용 가능: {"{아기이름}"}(성 뗀 이름) {"{아기}"} {"{보호자님}"} {"{촬영월}"} {"{촬영일}"}
              <br />
              (광고) 표기와 수신거부 문구는 법적 의무라 지우지 않는 편이 안전합니다.
            </p>
          </>
        ) : (
          <p className="mt-3 whitespace-pre-line rounded-xl bg-black/[0.03] px-4 py-4 text-[12.5px] leading-[1.8] text-black/45">
            {template}
          </p>
        )}
      </div>

      {/* ── 전체 명단 ── */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.3em] text-black/30">List</p>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-[12.5px] text-black/50 underline underline-offset-2"
          >
            {showAll ? "접기" : `전체 보기 (${counts.total})`}
          </button>
        </div>

        {showAll && (
          <div className="mt-3 divide-y divide-black/6 overflow-hidden rounded-2xl border border-black/8 bg-white">
            {items.map((t) => (
              <div key={t.phone} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] text-black/70">
                    {t.parent || "이름 없음"}
                    {t.baby && <span className="ml-1.5 text-[12px] text-black/35">{t.baby}</span>}
                  </p>
                  <p className="mt-0.5 text-[12px] text-black/40">
                    {t.date} · {formatPhone(t.phone)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] ${
                      t.status === "sent"
                        ? "bg-black/80 text-white"
                        : t.status === "skipped"
                          ? "bg-black/10 text-black/50"
                          : "bg-black/[0.04] text-black/40"
                    }`}
                  >
                    {t.status === "sent" ? "완료" : t.status === "skipped" ? "건너뜀" : "대기"}
                  </span>
                  {t.status !== "pending" && (
                    <button
                      onClick={() => mark(t.phone, "reset")}
                      disabled={!!busy}
                      className="text-[11.5px] text-black/35 underline underline-offset-2 disabled:opacity-40"
                    >
                      되돌리기
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 기간 조정 */}
      <div className="mt-8 flex items-center gap-2">
        <p className="text-[12.5px] text-black/40">조회 기간</p>
        {[6, 12, 24].map((m) => (
          <button
            key={m}
            onClick={() => load(m)}
            className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition ${
              months === m
                ? "border-black/70 text-black/75"
                : "border-black/10 text-black/40 hover:border-black/25"
            }`}
          >
            {m}개월
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] leading-[1.8] text-black/30">
        6개월을 넘기면 정보통신망법상 거래관계 예외를 벗어나므로, 12·24개월은 명단 확인용으로만
        쓰시고 발송은 개별 판단으로 진행해주세요.
      </p>
    </div>
  );
}
