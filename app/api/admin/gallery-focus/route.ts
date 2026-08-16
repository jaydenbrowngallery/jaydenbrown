import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/isAdmin";

/* 갤러리 사진별 구도(object-position) 저장소.
   - imgfocus_all    : Vision 자동 검출 결과(인물 박스). 읽기 전용으로 참고만 한다.
   - imgfocus_manual : 관리자가 직접 잡은 값 { "<postId>/<파일명>": "62.0% 38.0%" }
   자동 계산보다 수동 값이 우선한다. */

const MANUAL = "imgfocus_manual";
const AUTO = "imgfocus_all";

async function guard() {
  const { supabase, user } = await requireAdmin();
  if (!isAdmin(user?.email)) return { supabase: null as null | typeof supabase };
  return { supabase };
}

async function readRow(supabase: any, id: string) {
  const { data } = await supabase.from("site_settings").select("value").eq("id", id);
  const raw = ((data || []) as { value: string | null }[])[0]?.value;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function GET() {
  const { supabase } = await guard();
  if (!supabase) return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });

  const [auto, manual] = await Promise.all([readRow(supabase, AUTO), readRow(supabase, MANUAL)]);

  // 갤러리에 실제로 걸려 있는 사진 목록 (포스트 제목과 함께)
  const { data: posts } = await supabase.from("gallery_posts").select("id, title, cover_image, created_at");
  const { data: imgs } = await supabase.from("gallery_images").select("post_id, image_url, sort_order");

  const titleOf = new Map<string, string>();
  const createdOf = new Map<string, string>();
  for (const p of (posts || []) as { id: string; title: string | null; created_at: string }[]) {
    titleOf.set(p.id, (p.title || "").trim());
    createdOf.set(p.id, p.created_at || "");
  }

  const seen = new Set<string>();
  const items: {
    key: string;
    url: string;
    post: string;
    postId: string;
    postCreated: string;
    auto?: unknown;
    manual?: string;
  }[] = [];

  const push = (url: string | null, postId: string) => {
    if (!url) return;
    const key = url.replace(/^\/api\/gallery-file\//, "");
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      key,
      url,
      post: titleOf.get(postId) || "",
      postId,
      postCreated: createdOf.get(postId) || "",
      auto: auto[key],
      manual: manual[key],
    });
  };

  const ordered = ((posts || []) as { id: string; cover_image: string | null; created_at: string }[])
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const imgsByPost = new Map<string, { image_url: string | null; sort_order: number | null }[]>();
  for (const r of (imgs || []) as { post_id: string; image_url: string | null; sort_order: number | null }[]) {
    const arr = imgsByPost.get(r.post_id) || [];
    arr.push(r);
    imgsByPost.set(r.post_id, arr);
  }
  for (const p of ordered) {
    push(p.cover_image, p.id);
    for (const r of (imgsByPost.get(p.id) || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))) {
      push(r.image_url, p.id);
    }
  }

  return NextResponse.json({
    items,
    counts: { total: items.length, manual: items.filter((i) => i.manual).length },
  });
}

export async function PATCH(req: NextRequest) {
  const { supabase } = await guard();
  if (!supabase) return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });

  const body = await req.json();
  const key = String(body.key || "").trim();
  if (!key) return NextResponse.json({ error: "key가 필요합니다." }, { status: 400 });

  const manual = await readRow(supabase, MANUAL);
  if (body.reset) {
    delete manual[key];
  } else {
    const pos = String(body.pos || "").trim();
    if (!/^\d{1,3}(\.\d+)?%\s+\d{1,3}(\.\d+)?%$/.test(pos)) {
      return NextResponse.json({ error: "pos 형식이 올바르지 않습니다. (예: '62% 38%')" }, { status: 400 });
    }
    manual[key] = pos;
  }

  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: MANUAL, value: JSON.stringify(manual) }, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, key, pos: manual[key] ?? null });
}
