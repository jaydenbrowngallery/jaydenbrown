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
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setAdmin(isAdmin(user?.email));

    const { data, error } = await supabase
      .from("gallery_posts")
      .select("id, title, slug, cover_image, created_at")
      .not("cover_image", "is", null)
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

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-16">
        <p className="text-sm text-black/50">불러오는 중...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-white px-6 py-16">
        <p className="text-sm text-red-500">갤러리 불러오기 실패</p>
        <pre className="mt-4 whitespace-pre-wrap text-xs text-black/60">
          {errorMessage}
        </pre>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12 md:px-10">
      <section className="mx-auto max-w-7xl">
        {admin && (
          <div className="mb-10">
            <Link
              href="/admin/gallery"
              className="inline-flex items-center rounded-full bg-black px-5 py-2.5 text-sm text-white"
            >
              이미지 업로드
            </Link>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="py-20 text-center text-black/40">
            갤러리가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {posts.map((post) => {
              const isLoaded = loadedMap[post.id];

              return (
                <Link
                  key={post.id}
                  href={`/portfolio/${post.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#ece7e2]">
                    {!isLoaded && (
                      <div className="absolute inset-0 animate-pulse bg-[#ece7e2]" />
                    )}

                    <img
                      src={post.cover_image as string}
                      alt={post.title}
                      onLoad={() =>
                        setLoadedMap((prev) => ({ ...prev, [post.id]: true }))
                      }
                      className={`h-full w-full object-cover transition duration-700 ${
                        isLoaded ? "portfolio-thumb-loaded" : "portfolio-thumb-loading"
                      }`}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}