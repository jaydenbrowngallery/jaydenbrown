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

function getStoragePathFromUrl(url: string) {
  const marker = "/storage/v1/object/public/gallery/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.substring(idx + marker.length));
}

export default function PortfolioPage() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdmin(isAdmin(session?.user?.email));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAdmin(isAdmin(session?.user?.email));
    });
    supabase
      .from("gallery_posts")
      .select("id, title, slug, cover_image, created_at")
      .not("cover_image", "is", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPosts(data ?? []);
        setLoading(false);
        setTimeout(() => setFadeIn(true), 50);
      });
    return () => subscription.unsubscribe();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}개의 갤러리를 삭제하시겠습니까?`)) return;
    setDeleting(true);
    try {
      for (const postId of selected) {
        const post = posts.find((p) => p.id === postId);
        // 이미지 삭제
        const { data: imgs } = await supabase.from("gallery_images").select("id, image_url").eq("post_id", postId);
        if (imgs) {
          const paths = imgs.map((i) => getStoragePathFromUrl(i.image_url)).filter(Boolean) as string[];
          if (paths.length > 0) await supabase.storage.from("gallery").remove(paths);
          await supabase.from("gallery_images").delete().eq("post_id", postId);
        }
        // 포스트 삭제
        await supabase.from("gallery_posts").delete().eq("id", postId);
      }
      setPosts((prev) => prev.filter((p) => !selected.has(p.id)));
      setSelected(new Set());
      setSelectMode(false);
      alert("삭제 완료");
    } catch (err: any) {
      alert("삭제 실패: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-16">
      <div className="mx-auto max-w-7xl grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] w-full animate-pulse rounded-sm bg-[#ece7e2]" />
        ))}
      </div>
    </main>
  );

  return (
    <main className={`min-h-screen bg-[#f7f5f2] px-6 py-12 md:px-10 transition-all duration-1000 ease-out ${fadeIn ? "opacity-100 blur-0" : "opacity-0 blur-sm"}`}>
      <section className="mx-auto max-w-7xl">
        {admin && (
          <div className="mb-10 flex flex-wrap items-center gap-3">
            <Link href="/admin/gallery" className="inline-flex items-center rounded-full bg-black px-5 py-2.5 text-sm text-white">
              이미지 업로드
            </Link>
            <button
              type="button"
              onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
              className={`inline-flex items-center rounded-full px-5 py-2.5 text-sm transition ${selectMode ? "bg-red-500 text-white" : "border border-black/15 text-black/70 hover:bg-black/5"}`}
            >
              {selectMode ? "선택 취소" : "선택 삭제"}
            </button>
            {selectMode && selected.size > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="inline-flex items-center rounded-full bg-red-600 px-5 py-2.5 text-sm text-white disabled:opacity-50"
              >
                {deleting ? "삭제 중..." : `${selected.size}개 삭제`}
              </button>
            )}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <p className="text-[13px] uppercase tracking-[0.3em] text-black/30 mb-4">Gallery</p>
            <p className="text-black/40 text-sm">준비 중입니다.</p>
            {admin && (
              <Link href="/admin/gallery" className="mt-6 inline-flex items-center rounded-full bg-black px-6 py-3 text-sm text-white">
                이미지 업로드하기
              </Link>
            )}
            <Link href="/contact" className="mt-4 inline-flex items-center rounded-full border border-black/20 px-6 py-3 text-sm text-black/60">
              촬영 문의하기
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <p className="text-[11px] uppercase tracking-[0.32em] text-black/30">Gallery</p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
              {posts.map((post) => {
                const isSelected = selected.has(post.id);
                return selectMode ? (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => toggleSelect(post.id)}
                    className={`group relative block text-left transition ${isSelected ? "ring-3 ring-red-500 rounded-sm" : ""}`}
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-[#ece7e2]">
                      <Image
                        src={post.cover_image as string}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className={`object-cover transition duration-300 ${isSelected ? "brightness-50" : ""}`}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white text-sm font-bold">✓</div>
                        </div>
                      )}
                    </div>
                  </button>
                ) : (
                  <Link key={post.id} href={"/portfolio/" + post.slug} className="group block">
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-[#ece7e2]">
                      <Image
                        src={post.cover_image as string}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
