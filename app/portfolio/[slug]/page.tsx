import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  noStore();

  const { slug } = await params;

  const { data: post, error: postError } = await supabase
    .from("gallery_posts")
    .select("id, title, slug, cover_image, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (postError || !post) {
    return (
      <main className="min-h-screen bg-[#111111] px-6 py-24 text-white md:px-10">
        <section className="mx-auto max-w-5xl">
          <p className="text-sm text-white/60">존재하지 않는 갤러리입니다.</p>
          <Link
            href="/portfolio"
            className="mt-6 inline-flex rounded-full border border-white/30 px-6 py-3 text-sm text-white"
          >
            갤러리로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  const { data: images, error: imageError } = await supabase
    .from("gallery_images")
    .select("id, image_url, sort_order")
    .eq("post_id", post.id)
    .order("sort_order", { ascending: true });

  if (imageError) {
    return (
      <main className="min-h-screen bg-[#111111] px-6 py-24 text-white md:px-10">
        <section className="mx-auto max-w-5xl">
          <p className="text-sm text-red-400">이미지 불러오기 실패</p>
          <pre className="mt-4 whitespace-pre-wrap text-xs text-white/60">
            {imageError.message}
          </pre>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111111] text-white">
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <Link
          href="/portfolio"
          className="text-sm text-white/50 transition hover:text-white"
        >
          ← 갤러리로 돌아가기
        </Link>

        <p className="mt-8 text-xs uppercase tracking-[0.35em] text-white/35">
          Gallery Detail
        </p>

        <h1 className="mt-4 text-4xl font-semibold md:text-6xl">{post.title}</h1>

        {!images || images.length === 0 ? (
          <div className="mt-14 bg-[#1a1a1a] p-10">
            <p className="text-white/50">등록된 이미지가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="mt-14 space-y-10 pb-32">
              {images.map((image, index) => (
                <div key={image.id} className="bg-[#181818] p-0">
                  <img
                    src={image.image_url}
                    alt={`${post.title} ${index + 1}`}
                    className="block w-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* 하단 고정 썸네일 리스트 */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/85 backdrop-blur">
              <div className="mx-auto flex max-w-6xl gap-3 overflow-x-auto px-4 py-4 md:px-6">
                {images.map((image, index) => (
                  <a
                    key={image.id}
                    href={`#image-${index + 1}`}
                    className="block min-w-[72px] flex-shrink-0"
                  >
                    <div className="overflow-hidden border border-white/10 bg-[#1a1a1a]">
                      <img
                        src={image.image_url}
                        alt={`${post.title} thumbnail ${index + 1}`}
                        className="h-20 w-16 object-cover"
                      />
                    </div>
                    <p className="mt-2 text-center text-[10px] text-white/45">
                      {index + 1}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}