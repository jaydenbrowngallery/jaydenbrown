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
      <main className="min-h-screen bg-[#f7f5f2] px-6 py-16 md:px-10">
        <section className="mx-auto max-w-7xl">
          <p className="text-sm text-black/50">불러오는 중...</p>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] px-6 py-16 md:px-10">
        <section className="mx-auto max-w-7xl">
          <p className="text-sm text-red-500">갤러리 불러오기 실패</p>
          <pre className="mt-4 whitespace-pre-wrap text-xs text-black/60">
            {errorMessage}
          </pre>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-16 md:px-10">
      <section className="mx-auto max-w-7xl">
        {admin && (
          <div className="mb-8">
            <Link
              href="/admin/gallery"
              className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm text-white"
            >
              이미지 업로드
            </Link>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-10 shadow-sm">
            <p className="text-black/50">등록된 갤러리가 아직 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/portfolio/${post.slug}`}
                className="group block overflow-hidden bg-[#ece7e2]"
              >
                <div className="aspect-[4/5] w-full overflow-hidden">
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-black/35">
                      No Image
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}