import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/isAdmin";

/* 스토리(갤러리 포스트)별 표시 설정 — 계절과 한 줄 멘트.
   테이블 변경 없이 site_settings/gallerymeta_all 에 { "<postId>": {season, note} } 로 둔다. */

const KEY = "gallerymeta_all";
const INTRO_KEY = "gallery_intro";
export const DEFAULT_INTRO =
  "예뻐 보이려 애쓰지 않아도 됩니다.\n그저 그 순간을 편안하게 느껴주세요.\n행복은 곁에 있다는 것만으로 이미 시작되니까요.";
export const SEASONS = ["봄", "여름", "가을", "겨울"] as const;

/** 등록일로 계절을 추정 — 설정하지 않은 스토리의 기본값 */
export function seasonFromDate(iso: string): string {
  const m = Number((iso || "").slice(5, 7));
  if (m >= 3 && m <= 5) return "봄";
  if (m >= 6 && m <= 8) return "여름";
  if (m >= 9 && m <= 11) return "가을";
  return "겨울";
}

async function guard() {
  const { supabase, user } = await requireAdmin();
  if (!isAdmin(user?.email)) return { supabase: null as null | typeof supabase };
  return { supabase };
}

async function readMeta(supabase: any): Promise<Record<string, { season?: string; note?: string }>> {
  const { data } = await supabase.from("site_settings").select("value").eq("id", KEY);
  const raw = ((data || []) as { value: string | null }[])[0]?.value;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function readIntro(supabase: any): Promise<string> {
  const { data } = await supabase.from("site_settings").select("value").eq("id", INTRO_KEY);
  const raw = ((data || []) as { value: string | null }[])[0]?.value;
  return raw ?? DEFAULT_INTRO;
}

export async function GET() {
  const { supabase } = await guard();
  if (!supabase) return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });

  const meta = await readMeta(supabase);
  const intro = await readIntro(supabase);
  const { data: posts } = await supabase
    .from("gallery_posts")
    .select("id, title, cover_image, created_at");
  const { data: imgs } = await supabase.from("gallery_images").select("post_id");

  const counts = new Map<string, number>();
  for (const r of (imgs || []) as { post_id: string }[]) {
    counts.set(r.post_id, (counts.get(r.post_id) || 0) + 1);
  }

  const items = ((posts || []) as { id: string; title: string | null; cover_image: string | null; created_at: string }[])
    .filter((p) => (counts.get(p.id) || 0) > 0 || p.cover_image)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((p) => ({
      id: p.id,
      title: (p.title || "").trim(),
      cover: p.cover_image,
      created: (p.created_at || "").slice(0, 10),
      photos: counts.get(p.id) || 0,
      season: meta[p.id]?.season || "",
      seasonDefault: seasonFromDate(p.created_at),
      note: meta[p.id]?.note || "",
    }));

  return NextResponse.json({ items, seasons: SEASONS, intro });
}

export async function PATCH(req: NextRequest) {
  const { supabase } = await guard();
  if (!supabase) return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });

  const body = await req.json();

  // 상단 글귀 저장 — 줄바꿈을 그대로 보존한다(앞뒤 공백만 제거)
  if (body.intro !== undefined) {
    const text = String(body.intro).replace(/\r\n/g, "\n").replace(/^\s+|\s+$/g, "").slice(0, 600);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ id: INTRO_KEY, value: text }, { onConflict: "id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, intro: text });
  }

  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  const meta = await readMeta(supabase);
  const cur = meta[id] || {};

  if (body.season !== undefined) {
    const s = String(body.season).trim();
    if (s && !(SEASONS as readonly string[]).includes(s)) {
      return NextResponse.json({ error: "계절 값이 올바르지 않습니다." }, { status: 400 });
    }
    cur.season = s || undefined;
  }
  if (body.note !== undefined) {
    cur.note = String(body.note).replace(/\r\n/g, "\n").replace(/^\s+|\s+$/g, "").slice(0, 300) || undefined;
  }

  if (!cur.season && !cur.note) delete meta[id];
  else meta[id] = cur;

  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: KEY, value: JSON.stringify(meta) }, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id, ...cur });
}
