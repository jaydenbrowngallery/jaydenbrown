"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

type GalleryImage = {
  id: string;
  image_url: string;
};

type GalleryPost = {
  id: string;
  title: string;
};

export default function PortfolioDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<GalleryPost | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: postData, error: postError } = await supabase
        .from("gallery_posts")
        .select("id, title")
        .eq("slug", slug)
        .single();

      if (postError) {
        setErrorMessage(postError.message);
        setLoading(false);
        return;
      }

      setPost(postData);

      const { data: imageData, error: imageError } = await supabase
        .from("gallery_images")
        .select("id, image_url")
        .eq("post_id", postData.id)
        .order("created_at", { ascending: true });

      if (imageError) {
        setErrorMessage(imageError.message);
        setLoading(false);
        return;
      }

      setImages(imageData || []);
      setLoading(false);
    };

    if (slug) fetchData();
  }, [slug]);

  if (loading) {
    return (
      <main className="gallery-detail gallery-detail-vertical min-h-screen bg-black flex items-center justify-center">
        <p className="text-sm text-white/60">불러오는 중...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="gallery-detail gallery-detail-vertical min-h-screen bg-black flex items-center justify-center px-6">
        <div>
          <p className="text-sm text-red-400">에러 발생</p>
          <pre className="mt-4 whitespace-pre-wrap text-xs text-white/60">
            {errorMessage}
          </pre>
        </div>
      </main>
    );
  }

  return (
    <main className="gallery-detail gallery-detail-vertical">
      <div className="gallery-detail-topbar">
        <div className="gallery-detail-meta">
          <div className="gallery-detail-title">{post?.title || ""}</div>
          
        </div>

        <Link href="/portfolio" className="gallery-detail-back">
          갤러리
        </Link>
      </div>

      {images.length === 0 ? (
        <section className="gallery-detail-section flex h-screen items-center justify-center">
          <p className="text-sm text-white/50">이미지가 없습니다.</p>
        </section>
      ) : (
        images.map((img, index) => {
          const isLoaded = loadedMap[img.id];

          return (
            <section
              key={img.id}
              className="gallery-detail-section snap-start snap-always"
            >
              <div className="gallery-detail-image-wrap">
                {!isLoaded && <div className="gallery-detail-placeholder" />}

                <img
                  src={img.image_url}
                  alt=""
                  onLoad={() =>
                    setLoadedMap((prev) => ({ ...prev, [img.id]: true }))
                  }
                  className={`gallery-detail-image ${
                    isLoaded
                      ? "gallery-detail-image-loaded"
                      : "gallery-detail-image-loading"
                  }`}
                />
              </div>

              <div className="gallery-detail-index">
                {index + 1} / {images.length}
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}