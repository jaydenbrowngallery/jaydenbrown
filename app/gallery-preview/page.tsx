import { supabaseAdmin } from "@/lib/supabase/admin";
import fs from "node:fs";
import path from "node:path";
import GalleryDior from "./GalleryDior";
import type { Focus } from "./focus";

/* 갤러리 리디자인 미리보기 (임시 페이지 — 기존 /portfolio 는 그대로 둔다) */
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Gallery — preview",
  robots: { index: false, follow: false },
};

export type Shot = { url: string; focus?: Focus; pos?: string; rot?: number; iw?: number; ih?: number };
export type Story = {
  id: string;
  title: string;
  season: string;
  note?: string;
  cover: Shot;
  images: Shot[];
};

function cleanTitle(raw: string | null, i: number) {
  const t = (raw || "").trim();
  // 지금 등록된 제목은 테스트 값("ㅇ","d")이 많아 그대로 쓰면 지저분하다 → 의미 없는 값은 번호로 대체
  if (t.length >= 2 && !/^[ㄱ-ㅎㅏ-ㅣ]+$/.test(t)) return t;
  return `Story ${String(i + 1).padStart(2, "0")}`;
}

/* Vision 으로 미리 검출해 둔 인물 위치 (site_settings/imgfocus_all).
   키는 "<postId>/<파일명>" 이고 image_url 은 /api/gallery-file/<postId>/<파일명> 이다. */
async function getFocusMap(): Promise<Record<string, Focus>> {
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("id", "imgfocus_all");
    const raw = ((data || []) as { value: string | null }[])[0]?.value;
    return raw ? (JSON.parse(raw) as Record<string, Focus>) : {};
  } catch {
    return {};
  }
}

const focusKey = (url: string) => url.replace(/^\/api\/gallery-file\//, "");

/* 상단 글귀는 기본값 없이 비워 둔다. 관리자에서 넣으면 그때 표시된다. */
const DEFAULT_INTRO = "";

/* 상단 글귀 (site_settings/gallery_intro) — 줄바꿈을 그대로 화면에 반영한다. */
async function getIntro(): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("id", "gallery_intro");
    const raw = ((data || []) as { value: string | null }[])[0]?.value;
    return raw ?? DEFAULT_INTRO;
  } catch {
    return DEFAULT_INTRO;
  }
}

/* 스토리별 계절·멘트 (site_settings/gallerymeta_all). 없으면 등록 월로 계절 추정. */
async function getStoryMeta(): Promise<Record<string, { season?: string; note?: string }>> {
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("id", "gallerymeta_all");
    const raw = ((data || []) as { value: string | null }[])[0]?.value;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function seasonOf(iso: string): string {
  const m = Number((iso || "").slice(5, 7));
  if (m >= 3 && m <= 5) return "봄";
  if (m >= 6 && m <= 8) return "여름";
  if (m >= 9 && m <= 11) return "가을";
  return "겨울";
}

/* 관리자가 맞춘 수평 보정 각도 (site_settings/imgfocus_rot) */
async function getRotMap(): Promise<Record<string, number>> {
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("id", "imgfocus_rot");
    const raw = ((data || []) as { value: string | null }[])[0]?.value;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/* 모든 갤러리 사진의 픽셀 크기 (site_settings/imgdims_all) — 썸네일 리듬 계산에 쓴다. */
async function getDimsMap(): Promise<Record<string, { iw: number; ih: number }>> {
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("id", "imgdims_all");
    const raw = ((data || []) as { value: string | null }[])[0]?.value;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/* 관리자가 직접 잡은 구도 (site_settings/imgfocus_manual) — 자동 계산보다 우선한다. */
async function getManualMap(): Promise<Record<string, string>> {
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("id", "imgfocus_manual");
    const raw = ((data || []) as { value: string | null }[])[0]?.value;
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function getStories(): Promise<Story[]> {
  try {
    const [fmap, mmap, dmap, smap, rmap] = await Promise.all([
      getFocusMap(),
      getManualMap(),
      getDimsMap(),
      getStoryMeta(),
      getRotMap(),
    ]);
    const { data: posts } = await supabaseAdmin
      .from("gallery_posts")
      .select("id, title, slug, cover_image, created_at");
    const { data: imgs } = await supabaseAdmin
      .from("gallery_images")
      .select("post_id, image_url, sort_order");

    const byPost = new Map<string, { url: string; order: number }[]>();
    for (const r of (imgs || []) as { post_id: string; image_url: string | null; sort_order: number | null }[]) {
      if (!r.image_url) continue;
      const arr = byPost.get(r.post_id) || [];
      arr.push({ url: r.image_url, order: r.sort_order ?? 0 });
      byPost.set(r.post_id, arr);
    }

    const rows = ((posts || []) as { id: string; title: string | null; cover_image: string | null; created_at: string }[])
      .map((p) => {
        const list = (byPost.get(p.id) || []).sort((a, b) => a.order - b.order).map((x) => x.url);
        const images = p.cover_image && !list.includes(p.cover_image) ? [p.cover_image, ...list] : list;
        return { p, images };
      })
      .filter((x) => x.images.length > 0)
      .sort((a, b) => (a.p.created_at < b.p.created_at ? 1 : -1));

    const toShot = (url: string): Shot => {
      const k = focusKey(url);
      const d = dmap[k] || (fmap[k] ? { iw: fmap[k].iw, ih: fmap[k].ih } : undefined);
      return { url, focus: fmap[k], pos: mmap[k], rot: rmap[k], iw: d?.iw, ih: d?.ih };
    };
    return rows.map(({ p, images }, i) => {
      const shots = images.map(toShot);
      const meta = smap[p.id] || {};
      return {
        id: p.id,
        title: cleanTitle(p.title, i),
        season: meta.season || seasonOf(p.created_at),
        note: meta.note,
        cover: shots[0],
        images: shots,
      };
    });
  } catch {
    return [];
  }
}

/* public/bgm 안의 음원 목록 — 폴더에 파일을 넣으면 자동으로 재생 목록에 들어간다 */
function getTracks(): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "bgm");
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(m4a|mp3|aac|ogg)$/i.test(f))
      .sort()
      .map((f) => `/bgm/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}

export default async function GalleryPreviewPage() {
  const [stories, intro] = await Promise.all([getStories(), getIntro()]);
  return <GalleryDior stories={stories} intro={intro} tracks={getTracks()} />;
}
