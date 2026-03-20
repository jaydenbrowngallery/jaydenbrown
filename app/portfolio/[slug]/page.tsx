"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: postData, error: postError } = await supabase
        .from("gallery_posts")
        .select("id, title")
        .eq("slug", slug)
        .single();

      if (postError || !postData) {
        setErrorMessage(postError?.message ?? "포스트를 찾을 수 없습니다.");
        setLoading(false);
        return;
      }

      setPost(postData);

      const { data: imageData, error: imageError } = await supabase
        .from("gallery_images")
        .select("id, image_url")
        .eq("post_id", postData.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (imageError) {
        setErrorMessage(imageError.message);
        setLoading(false);
        return;
      }

      setImages(imageData ?? []);
      setLoading(false);
    };
    fetchData();
  }, [slug]);

  // 스크롤 감지로 현재 인덱스 업데이트
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      const index = Math.round(scrollTop / height);
      setCurrentIndex(index);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [images]);

  // 썸네일 클릭 시 해당 섹션으로 스크롤
  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: index * container.clientHeight, behavior: "smooth" });
  };

  if (loading) {
    return (
      <main className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-sm text-white/60">불러오는 중...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="fixed inset-0 bg-black flex items-center justify-center px-6">
        <p className="text-sm text-red-400">{errorMessage}</p>
      </main>
    );
  }

  return (
    <main
      ref={containerRef}
      className="gallery-detail gallery-detail-page gallery-detail-vertical"
      style={{ position: "fixed", inset: 0 }}
    >
      {/* 상단 반투명 헤더 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      >
        <Link
          href="/portfolio"
          style={{ pointerEvents: "auto" }}
          className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80 hover:text-white transition"
        >
          Jayden Brown
        </Link>
        <Link
          href="/portfolio"
          style={{ pointerEvents: "auto" }}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs text-white/70 hover:text-white transition"
          aria-label="갤러리로 돌아가기"
        >
          ← 갤러리
        </Link>
      </div>

      {/* 이미지 섹션 */}
      {images.length === 0 ? (
        <section className="gallery-detail-section flex h-screen items-center justify-center">
          <p className="text-sm text-white/50">이미지가 없습니다.</p>
        </section>
      ) : (
        images.map((img, index) => (
          <section
            key={img.id}
            ref={(el) => { sectionRefs.current[index] = el; }}
            className="gallery-detail-section snap-start snap-always"
          >
            <div className="gallery-detail-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt={post?.title || ""}
                className="gallery-detail-image gallery-detail-image-loaded"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>
          </section>
        ))
      )}

      {/* 하단 반투명 썸네일 스트립 */}
      {images.length > 1 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            padding: "10px 14px 18px",
            background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {/* 인덱스 표시 */}
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "11px",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
              marginRight: "4px",
            }}
          >
            {currentIndex + 1} / {images.length}
          </span>

          {images.map((img, index) => (
            <button
              key={img.id}
              onClick={() => scrollToIndex(index)}
              style={{
                flexShrink: 0,
                width: currentIndex === index ? "44px" : "36px",
                height: currentIndex === index ? "56px" : "46px",
                borderRadius: "6px",
                overflow: "hidden",
                border: currentIndex === index
                  ? "2px solid rgba(255,255,255,0.9)"
                  : "2px solid transparent",
                opacity: currentIndex === index ? 1 : 0.5,
                transition: "all 0.2s ease",
                padding: 0,
                cursor: "pointer",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
