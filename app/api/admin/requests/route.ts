import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/isAdmin";

/*
  작업 요청 보드 — 사장님이 요청을 적어두면 Claude가 읽고 상태를 갱신한다.
  새 테이블을 만들지 않고 site_settings 키-값에 저장한다(today_memo: 등 기존 패턴과 동일).
    id    : req:<생성시각ISO>:<랜덤6>
    value : {"text","status","created","updated","note","tag"}
  status: open(요청) | doing(진행중) | done(완료) | hold(보류)
*/

const PREFIX = "req:";
const STATUSES = ["open", "doing", "done", "hold"] as const;
type Status = (typeof STATUSES)[number];

type Req = {
  id: string;
  text: string;
  status: Status;
  created: string;
  updated?: string;
  note?: string;
  tag?: string;
};

function parseRow(row: { id: string; value: string | null }): Req | null {
  try {
    const v = JSON.parse(row.value || "{}");
    if (!v?.text) return null;
    return {
      id: row.id,
      text: String(v.text),
      status: (STATUSES as readonly string[]).includes(v.status) ? v.status : "open",
      created: v.created || row.id.slice(PREFIX.length, PREFIX.length + 19),
      updated: v.updated,
      note: v.note,
      tag: v.tag,
    };
  } catch {
    return null;
  }
}

async function guard() {
  const { supabase, user } = await requireAdmin();
  if (!isAdmin(user?.email)) return { supabase: null, error: "권한이 없습니다." };
  return { supabase, error: null };
}

export async function GET() {
  const { supabase, error } = await guard();
  if (!supabase) return NextResponse.json({ error }, { status: 401 });

  const { data, error: dbErr } = await supabase
    .from("site_settings")
    .select("id, value")
    .like("id", `${PREFIX}%`);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  const items = ((data || []) as { id: string; value: string | null }[])
    .map(parseRow)
    .filter((r): r is Req => !!r)
    // 최신 요청이 위로
    .sort((a, b) => (a.created < b.created ? 1 : -1));

  return NextResponse.json({
    items,
    counts: {
      open: items.filter((i) => i.status === "open").length,
      doing: items.filter((i) => i.status === "doing").length,
      done: items.filter((i) => i.status === "done").length,
      hold: items.filter((i) => i.status === "hold").length,
    },
  });
}

export async function POST(req: NextRequest) {
  const { supabase, error } = await guard();
  if (!supabase) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json();
  const text = String(body.text || "").trim();
  if (!text) return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });

  const now = new Date().toISOString().slice(0, 19);
  const id = `${PREFIX}${now}:${Math.random().toString(36).slice(2, 8)}`;
  const value = JSON.stringify({
    text,
    status: "open",
    created: now,
    tag: String(body.tag || "").trim() || undefined,
  });

  const { error: dbErr } = await supabase.from("site_settings").upsert({ id, value }, { onConflict: "id" });
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: NextRequest) {
  const { supabase, error } = await guard();
  if (!supabase) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id.startsWith(PREFIX)) return NextResponse.json({ error: "id가 올바르지 않습니다." }, { status: 400 });

  const { data } = await supabase.from("site_settings").select("id, value").eq("id", id);
  const row = ((data || []) as { id: string; value: string | null }[])[0];
  if (!row) return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 });

  const cur = parseRow(row);
  if (!cur) return NextResponse.json({ error: "요청 데이터가 깨져 있습니다." }, { status: 500 });

  const next = {
    text: body.text !== undefined ? String(body.text).trim() || cur.text : cur.text,
    status: (STATUSES as readonly string[]).includes(body.status) ? body.status : cur.status,
    created: cur.created,
    updated: new Date().toISOString().slice(0, 19),
    note: body.note !== undefined ? String(body.note) : cur.note,
    tag: body.tag !== undefined ? String(body.tag).trim() || undefined : cur.tag,
  };

  const { error: dbErr } = await supabase
    .from("site_settings")
    .upsert({ id, value: JSON.stringify(next) }, { onConflict: "id" });
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, id, ...next });
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await guard();
  if (!supabase) return NextResponse.json({ error }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id") || "";
  if (!id.startsWith(PREFIX)) return NextResponse.json({ error: "id가 올바르지 않습니다." }, { status: 400 });

  const { error: dbErr } = await supabase.from("site_settings").delete().eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
