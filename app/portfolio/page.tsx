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

export default function PortfolioPage() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setAdmin(isAdmin(user?.email));

      const { data, error } = await supabase
        .from("gallery_posts")
        .select("id, title, slug, cover_image, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
        setPosts([]);
      } else {
        setErrorMessage("");
        setPosts(data ?? []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
        <section className="mx-auto max-w-6xl">
          <p className="text-sm text-black/50">불러오는 중...</p>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-red-500">갤러리 불러오기 실패</p>
          <pre className="mt-4 whitespace-pre-wrap text-xs text-black/60">
            {errorMessage}
          </pre>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <section className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.35em] text-black/45">
          Gallery
        </p>

        <h1 className="mt-4 text-4xl font-semibold md:text-6xl">갤러리</h1>

        <p className="mt-6 max-w-2xl text-base leading-8 text-black/60 md:text-lg">
          편안한 흐름 안에서 남긴 장면들을 모아두었습니다.
        </p>

        {admin && (
          <div className="mt-6">
            <Link
              href="/admin/gallery"
              className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm text-white"
            >
              이미지 업로드
            </Link>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="mt-14 rounded-[2rem] bg-white p-10 shadow-sm">
            <p className="text-black/50">등록된 갤러리가 아직 없습니다.</p>
          </div>
        ) : (
          <div className="mt-14 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/portfolio/${post.slug}`}
                className="group overflow-hidden rounded-[2rem] bg-white shadow-sm transition hover:-translate-y-1"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#e9e4de]">
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-black/35">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-black/35">
                    Gallery
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold">{post.title}</h2>
                  <p className="mt-4 text-sm text-black/45">자세히 보기 →</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}