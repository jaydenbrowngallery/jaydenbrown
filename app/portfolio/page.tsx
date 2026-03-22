"use client";
import Link from "next/link";
import Image from "next/image";
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
      const { data: { user } } = await supabase.auth.getUser();
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
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] w-full animate-pulse rounded-sm bg-[#ece7e2]" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] px-6 py-16">
        <p className="text-sm text-red-500">갤러리 불러오기 실패</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-12 md:px-10">
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
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <p className="text-[13px] uppercase tracking-[0.3em] text-black/30 mb-4">Gallery</p>
            <p className="text-black/40 text-sm">준비 중입니다.</p>
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center rounded-full bg-black px-6 py-3 text-sm text-white transition hover:bg-black/80"
            >
              촬영 문의하기
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <p className="text-[11px] uppercase tracking-[0.32em] text-black/30">Gallery</p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
              {posts.map((post) => (
                <Link key={post.id} href={`/portfolio/${post.slug}`} className="group block">
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-[#ece7e2]">
                    <Image
                      src={post.cover_image as string}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.03] group-hover:brightness-95"
                    />
                    <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/10" />
                  </div>
                  <p className="mt-2 px-1 text-[12px] text-black/40 truncate">{post.title}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
