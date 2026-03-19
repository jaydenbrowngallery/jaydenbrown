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
  const [imageLoaded, setImageLoaded] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const wheelLockRef = useRef(false);

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
      setCurrentIndex(0);
      setLoading(false);
    };

    if (slug) fetchData();
  }, [slug]);

  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!images.length) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(prev + 1, images.length - 1));
      }

      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length]);

  useEffect(() => {
    if (!images.length) return;

    const nextIndex = currentIndex + 1;
    const prevIndex = currentIndex - 1;

    if (images[nextIndex]?.image_url) {
      const img = new Image();
      img.src = images[nextIndex].image_url;
    }

    if (images[prevIndex]?.image_url) {
      const img = new Image();
      img.src = images[prevIndex].image_url;
    }
  }, [currentIndex, images]);

  const goPrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, images.length - 1));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;

    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    touchStartX.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (wheelLockRef.current) return;

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 20) return;

    wheelLockRef.current = true;

    if (delta > 0) {
      goNext();
    } else {
      goPrev();
    }

    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 450);
  };

  if (loading) {
    return (
      <main className="gallery-detail min-h-screen bg-black flex items-center justify-center">
        <p className="text-sm text-white/60">불러오는 중...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="gallery-detail min-h-screen bg-black flex items-center justify-center px-6">
        <div>
          <p className="text-sm text-red-400">에러 발생</p>
          <pre className="mt-4 whitespace-pre-wrap text-xs text-white/60">
            {errorMessage}
          </pre>
        </div>
      </main>
    );
  }

  if (!images.length) {
    return (
      <main className="gallery-detail min-h-screen bg-black flex items-center justify-center">
        <p className="text-sm text-white/50">이미지가 없습니다.</p>
      </main>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <main
      className="gallery-detail gallery-detail-viewer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div className="gallery-detail-topbar">
        <div className="gallery-detail-meta">
          <div className="gallery-detail-title">{post?.title || ""}</div>
          <div className="gallery-detail-counter">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        <Link
          href="/portfolio"
          className="gallery-detail-back"
        >
          갤러리
        </Link>
      </div>

      <div className="gallery-detail-stage">
        {!imageLoaded && <div className="gallery-detail-placeholder" />}

        <img
          key={currentImage.id}
          src={currentImage.image_url}
          alt=""
          onLoad={() => setImageLoaded(true)}
          className={`gallery-detail-image ${
            imageLoaded ? "gallery-detail-image-loaded" : "gallery-detail-image-loading"
          }`}
        />
      </div>

      <button
        type="button"
        onClick={goPrev}
        disabled={currentIndex === 0}
        className="gallery-nav gallery-nav-left"
        aria-label="이전 이미지"
      >
        ‹
      </button>

      <button
        type="button"
        onClick={goNext}
        disabled={currentIndex === images.length - 1}
        className="gallery-nav gallery-nav-right"
        aria-label="다음 이미지"
      >
        ›
      </button>
    </main>
  );
}