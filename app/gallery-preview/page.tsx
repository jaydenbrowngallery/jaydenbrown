import { supabaseAdmin } from "@/lib/supabase/admin";
import GalleryDior from "./GalleryDior";

/* 갤러리 리디자인 미리보기 (임시 페이지 — 기존 /portfolio 는 그대로 둔다) */
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Gallery — preview",
  robots: { index: false, follow: false },
};

export type Shot = { url: string; postId: string };
export type Story = {
  id: string;
  title: string;
  date: string;
  cover: string;
  images: string[];
};

function cleanTitle(raw: string | null, i: number) {
  const t = (raw || "").trim();
  // 지금 등록된 제목은 테스트 값("ㅇ","d")이 많아 그대로 쓰면 지저분하다 → 의미 없는 값은 번호로 대체
  if (t.length >= 2 && !/^[ㄱ-ㅎㅏ-ㅣ]+$/.test(t)) return t;
  return `Story ${String(i + 1).padStart(2, "0")}`;
}

async function getStories(): Promise<Story[]> {
  try {
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

    return rows.map(({ p, images }, i) => ({
      id: p.id,
      title: cleanTitle(p.title, i),
      date: (p.created_at || "").slice(0, 10).replace(/-/g, "."),
      cover: images[0],
      images,
    }));
  } catch {
    return [];
  }
}

export default async function GalleryPreviewPage() {
  const stories = await getStories();
  return <GalleryDior stories={stories} />;
}
