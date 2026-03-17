"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/isAdmin";

type GalleryPost = {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  created_at: string;
};

type GalleryImage = {
  id: string;
  image_url: string;
  sort_order: number;
};

export default function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [post, setPost] = useState<GalleryPost | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [allPosts, setAllPosts] = useState<GalleryPost[]>([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [slug, setSlug] = useState("");

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setSlug(resolved.slug);
    };

    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setAdmin(isAdmin(user?.email));

      const { data: postData, error: postError } = await supabase
        .from("gallery_posts")
        .select("id, title, slug, cover_image, created_at")
        .eq("slug", slug)
        .maybeSingle();

      if (postError) {
        setErrorMessage(postError.message);
        setLoading(false);
        return;
      }

      if (!postData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPost(postData);

      const { data: imageData, error: imageError } = await supabase
        .from("gallery_images")
        .select("id, image_url, sort_order")
        .eq("post_id", postData.id)
        .order("sort_order", { ascending: true });

      if (imageError) {
        setErrorMessage(imageError.message);
        setLoading(false);
        return;
      }

      const { data: listData } = await supabase
        .from("gallery_posts")
        .select("id, title, slug, cover_image, created_at")
        .order("created_at", { ascending: false });

      setImages(imageData ?? []);
      setAllPosts(listData ?? []);
      setLoading(false);
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#111111] px-6 py-24 text-white md:px-10">
        <section className="mx-auto max-w-6xl">
          <p className="text-sm text-white/60">불러오는 중...</p>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#111111] px-6 py-24 text-white md:px-10">
        <section className="mx-auto max-w-6xl">
          <p className="text-sm text-red-400">불러오기 실패</p>
          <pre className="mt-4 whitespace-pre-wrap text-xs text-white/60">
            {errorMessage}
          </pre>
        </section>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="min-h-screen bg-[#111111] px-6 py-24 text-white md:px-10">
        <section className="mx-auto max-w-6xl">
          <p className="text-sm text-white/60">존재하지 않는 갤러리입니다.</p>
          <Link
            href="/portfolio"
            className="mt-6 inline-flex border border-white/30 px-6 py-3 text-sm text-white"
          >
            갤러리로 돌아가기
          </Link>
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

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h1 className="text-4xl font-semibold md:text-6xl">{post.title}</h1>

          {admin && (
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/gallery/edit/${post.slug}`}
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-5 py-2.5 text-sm text-white transition hover:bg-white hover:text-black"
              >
                수정
              </Link>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm text-black transition hover:bg-white/85"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        {images.length === 0 ? (
          <div className="mt-14 bg-[#1a1a1a] p-10">
            <p className="text-white/50">등록된 이미지가 없습니다.</p>
          </div>
        ) : (
          <div className="mt-14 space-y-10 pb-24">
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
        )}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/92 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-3 overflow-x-auto px-3 py-3 md:px-6">
          {allPosts.map((item) => {
            const isActive = item.slug === post.slug;

            return (
              <Link
                key={item.id}
                href={`/portfolio/${item.slug}`}
                className={`min-w-[110px] flex-shrink-0 transition ${
                  isActive ? "opacity-100" : "opacity-55 hover:opacity-100"
                }`}
              >
                <div
                  className={`overflow-hidden border ${
                    isActive ? "border-white" : "border-white/10"
                  } bg-[#1a1a1a]`}
                >
                  {item.cover_image ? (
                    <img
                      src={item.cover_image}
                      alt={item.title}
                      className="h-16 w-full object-cover md:h-20"
                    />
                  ) : (
                    <div className="flex h-16 w-full items-center justify-center text-[10px] text-white/35 md:h-20">
                      No Image
                    </div>
                  )}
                </div>

                <p
                  className={`mt-1 truncate text-[11px] ${
                    isActive ? "text-white" : "text-white/45"
                  }`}
                >
                  {item.title}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}