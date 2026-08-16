import { supabaseAdmin } from "@/lib/supabase/admin";
import GalleryDior from "./GalleryDior";
import type { Focus } from "./focus";

/* 갤러리 리디자인 미리보기 (임시 페이지 — 기존 /portfolio 는 그대로 둔다) */
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Gallery — preview",
  robots: { index: false, follow: false },
};

export type Shot = { url: string; focus?: Focus; pos?: string };
export type Story = {
  id: string;
  title: string;
  date: string;
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
    const [fmap, mmap] = await Promise.all([getFocusMap(), getManualMap()]);
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

    const toShot = (url: string): Shot => ({
      url,
      focus: fmap[focusKey(url)],
      pos: mmap[focusKey(url)],
    });
    return rows.map(({ p, images }, i) => {
      const shots = images.map(toShot);
      return {
        id: p.id,
        title: cleanTitle(p.title, i),
        date: (p.created_at || "").slice(0, 10).replace(/-/g, "."),
        cover: shots[0],
        images: shots,
      };
    });
  } catch {
    return [];
  }
}

export default async function GalleryPreviewPage() {
  const stories = await getStories();
  return <GalleryDior stories={stories} />;
}
