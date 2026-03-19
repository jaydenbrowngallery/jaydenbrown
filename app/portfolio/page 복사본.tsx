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

function getStoragePathFromPublicUrl(imageUrl: string) {
  const marker = "/storage/v1/object/public/gallery/";
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(imageUrl.substring(idx + marker.length));
}

export default function PortfolioPage() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [admin, setAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (post: GalleryPost) => {
    const ok = confirm(`"${post.title}" 갤러리를 삭제할까요?`);
    if (!ok) return;

    setDeletingId(post.id);

    try {
      const { data: imageRows, error: fetchImagesError } = await supabase
        .from("gallery_images")
        .select("id, image_url")
        .eq("post_id", post.id);

      if (fetchImagesError) {
        alert(`이미지 조회 실패: ${fetchImagesError.message}`);
        setDeletingId(null);
        return;
      }

      const filePaths =
        imageRows
          ?.map((img) => {
            try {
              return getStoragePathFromPublicUrl(img.image_url);
            } catch {
              return null;
            }
          })
          .filter((v): v is string => Boolean(v)) ?? [];

      if (filePaths.length > 0) {
        const { error: storageDeleteError } = await supabase.storage
          .from("gallery")
          .remove(filePaths);

        if (storageDeleteError) {
          alert(`스토리지 삭제 실패: ${storageDeleteError.message}`);
          setDeletingId(null);
          return;
        }
      }

      const { error: deleteImagesError } = await supabase
        .from("gallery_images")
        .delete()
        .eq("post_id", post.id);

      if (deleteImagesError) {
        alert(`이미지 DB 삭제 실패: ${deleteImagesError.message}`);
        setDeletingId(null);
        return;
      }

      const { error: deletePostError } = await supabase
        .from("gallery_posts")
        .delete()
        .eq("id", post.id);

      if (deletePostError) {
        alert(`갤러리 글 삭제 실패: ${deletePostError.message}`);
        setDeletingId(null);
        return;
      }

      await fetchData();
      alert("삭제 완료");
    } catch (error) {
      alert(
        "삭제 중 오류가 발생했습니다.\n\n" +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setDeletingId(null);
    }
  };

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
              <div key={post.id} className="relative">
                <Link
                  href={`/portfolio/${post.slug}`}
                  className="group block overflow-hidden bg-[#ece7e2]"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden">
                    <img
                      src={post.cover_image as string}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                </Link>

                {admin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(post)}
                    disabled={deletingId === post.id}
                    className="absolute right-2 top-2 rounded-full bg-black/80 px-3 py-1.5 text-xs text-white backdrop-blur disabled:opacity-50"
                  >
                    {deletingId === post.id ? "삭제 중..." : "삭제"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}