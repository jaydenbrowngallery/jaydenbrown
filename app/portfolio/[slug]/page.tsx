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
      <main className="min-h-screen bg-[#f7f5f2] px-6 py-24 md:px-10">
        <section className="mx-auto max-w-5xl">
          <p className="text-sm text-black/50">존재하지 않는 갤러리입니다.</p>
          <Link
            href="/portfolio"
            className="mt-6 inline-flex rounded-full border border-black px-6 py-3 text-sm"
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
      <main className="min-h-screen bg-[#f7f5f2] px-6 py-24 md:px-10">
        <section className="mx-auto max-w-5xl">
          <p className="text-sm text-red-500">이미지 불러오기 실패</p>
          <pre className="mt-4 text-xs text-black/60 whitespace-pre-wrap">
            {imageError.message}
          </pre>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <section className="mx-auto max-w-6xl">
        <Link
          href="/portfolio"
          className="text-sm text-black/45 transition hover:text-black"
        >
          ← 갤러리로 돌아가기
        </Link>

        <p className="mt-8 text-xs uppercase tracking-[0.35em] text-black/45">
          Gallery Detail
        </p>

        <h1 className="mt-4 text-4xl font-semibold md:text-6xl">{post.title}</h1>

        {!images || images.length === 0 ? (
          <div className="mt-14 rounded-[2rem] bg-white p-10 shadow-sm">
            <p className="text-black/50">등록된 이미지가 없습니다.</p>
          </div>
        ) : (
          <div className="mt-14 space-y-6">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-[2rem] bg-white p-4 shadow-sm md:p-6"
              >
                <div className="overflow-hidden rounded-[1.5rem] bg-[#e9e4de]">
                  <img
                    src={image.image_url}
                    alt={`${post.title} ${index + 1}`}
                    className="w-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}