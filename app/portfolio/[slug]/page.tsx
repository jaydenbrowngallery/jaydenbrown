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

function getStoragePathFromPublicUrl(imageUrl: string) {
  const marker = "/storage/v1/object/public/gallery/";
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(imageUrl.substring(idx + marker.length));
}

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
      setErrorMessage("");
      setNotFound(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setAdmin(isAdmin(user?.email));

      const { data: postData } = await supabase
        .from("gallery_posts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!postData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPost(postData);

      const { data: imageData } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("post_id", postData.id)
        .order("sort_order", { ascending: true });

      const { data: listData } = await supabase
        .from("gallery_posts")
        .select("*")
        .not("cover_image", "is", null)
        .order("created_at", { ascending: false });

      setImages(imageData ?? []);
      setAllPosts(listData ?? []);
      setLoading(false);
    };

    fetchData();
  }, [slug]);

  const handleDelete = async () => {
    if (!post) return;

    const ok = confirm("정말 삭제하시겠습니까?");
    if (!ok) return;

    const { data: imageRows } = await supabase
      .from("gallery_images")
      .select("image_url")
      .eq("post_id", post.id);

    const filePaths =
      imageRows
        ?.map((img) => getStoragePathFromPublicUrl(img.image_url))
        .filter((v): v is string => Boolean(v)) ?? [];

    if (filePaths.length > 0) {
      await supabase.storage.from("gallery").remove(filePaths);
    }

    await supabase.from("gallery_images").delete().eq("post_id", post.id);
    await supabase.from("gallery_posts").delete().eq("id", post.id);

    alert("삭제 완료");
    window.location.href = "/portfolio";
  };

  if (loading) {
    return <div className="bg-black min-h-screen" />;
  }

  if (notFound || !post) {
    return <div className="bg-black min-h-screen text-white p-10">Not Found</div>;
  }

  return (
    <main className="min-h-screen bg-black px-4 py-3 md:px-8 md:py-4">
      <section className="mx-auto max-w-6xl">

        {/* 상단 */}
        <div className="mb-3 flex items-center justify-between">
          <Link
            href="/portfolio"
            className="text-sm text-white/40 hover:text-white/70"
          >
            ← 갤러리로 돌아가기
          </Link>

          {admin && (
            <div className="flex gap-2">
              <Link
                href={`/admin/gallery/edit/${post.slug}`}
                className="border border-white/30 px-3 py-1 text-white text-sm"
              >
                수정
              </Link>

              <button
                onClick={handleDelete}
                className="bg-white text-black px-3 py-1 text-sm"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 이미지 */}
        <div className="h-[100svh] snap-y snap-mandatory overflow-y-auto scroll-smooth">
          {images.map((image, index) => (
            <section
              key={image.id}
              className="flex min-h-[100svh] snap-start items-start justify-center px-4 pt-2 md:px-8 md:pt-4"
            >
              <div className="flex h-[85svh] w-full max-w-5xl items-center justify-center">
                <img
                  src={image.image_url}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </section>
          ))}
        </div>
      </section>

      {/* 하단 썸네일 */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur border-t border-white/10">
        <div className="flex gap-2 overflow-x-auto px-3 py-3">
          {allPosts.map((item) => (
            <Link key={item.id} href={`/portfolio/${item.slug}`}>
              <img
                src={item.cover_image || ""}
                className="h-14 w-24 object-cover opacity-60 hover:opacity-100"
              />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}