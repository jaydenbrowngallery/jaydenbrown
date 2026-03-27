"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/isAdmin";
import Link from "next/link";

// ─── 이미지 크롭 컴포넌트 ───
function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
}: {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0, scale: 1 });
  const [saving, setSaving] = useState(false);

  const FRAME_W = 400;
  const FRAME_H = 500; // 4:5 ratio

  const onImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    // 이미지가 프레임보다 작으면 확대, 크면 프레임에 맞춤
    const scaleW = FRAME_W / natW;
    const scaleH = FRAME_H / natH;
    const scale = Math.max(scaleW, scaleH); // 프레임을 채우는 최소 스케일

    setImgSize({ w: natW * scale, h: natH * scale, scale });
    // 중앙 정렬
    setPosition({
      x: (FRAME_W - natW * scale) / 2,
      y: (FRAME_H - natH * scale) / 2,
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragging) return;
      let newX = clientX - dragStart.x;
      let newY = clientY - dragStart.y;

      // 경계 제한: 이미지가 프레임 밖으로 나가지 않게
      const minX = FRAME_W - imgSize.w;
      const minY = FRAME_H - imgSize.h;
      newX = Math.min(0, Math.max(minX, newX));
      newY = Math.min(0, Math.max(minY, newY));

      setPosition({ x: newX, y: newY });
    },
    [dragging, dragStart, imgSize]
  );

  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const handleEnd = () => setDragging(false);

  const handleCrop = async () => {
    const img = imgRef.current;
    if (!img) return;
    setSaving(true);

    const canvas = document.createElement("canvas");
    canvas.width = FRAME_W * 2; // 고해상도
    canvas.height = FRAME_H * 2;
    const ctx = canvas.getContext("2d")!;

    // 캔버스에 이미지의 보이는 부분만 그리기
    const sourceX = (-position.x / imgSize.scale) * (img.naturalWidth / (imgSize.w / imgSize.scale));
    const sourceY = (-position.y / imgSize.scale) * (img.naturalHeight / (imgSize.h / imgSize.scale));
    const sourceW = (FRAME_W / imgSize.w) * img.naturalWidth;
    const sourceH = (FRAME_H / imgSize.h) * img.naturalHeight;

    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) onCropComplete(blob);
        setSaving(false);
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-semibold">이미지 위치 조정</h3>
        <p className="mb-4 text-sm text-black/50">드래그하여 보여질 영역을 선택하세요</p>

        {/* 크롭 프레임 */}
        <div
          ref={containerRef}
          className="relative mx-auto cursor-grab overflow-hidden rounded-[16px] bg-black active:cursor-grabbing"
          style={{ width: FRAME_W, height: FRAME_H, maxWidth: "100%" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleEnd}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="크롭 미리보기"
            onLoad={onImageLoad}
            draggable={false}
            className="pointer-events-none select-none"
            style={{
              position: "absolute",
              left: position.x,
              top: position.y,
              width: imgSize.w,
              height: imgSize.h,
            }}
          />
          {/* 가이드 격자선 */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
            <div className="absolute left-2/3 top-0 h-full w-px bg-white/20" />
            <div className="absolute left-0 top-1/3 h-px w-full bg-white/20" />
            <div className="absolute left-0 top-2/3 h-px w-full bg-white/20" />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={handleCrop}
            disabled={saving}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-black text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "처리 중..." : "적용하기"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-6 text-sm text-black"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 설정 페이지 ───
export default function AdminSettingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [homeImage, setHomeImage] = useState("/img/001.jpg");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<{ id: string; title: string; cover_image: string }[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isAdmin(user.email)) { router.replace("/login"); return; }
      setAuthorized(true);
      const settingsRes = await fetch("/api/site-settings");
      const settingsData = await settingsRes.json();
      const homeSetting = settingsData.settings?.find((s: any) => s.id === "home_image");
      if (homeSetting) setHomeImage(homeSetting.value);
      const { data: posts } = await supabase.from("gallery_posts").select("id, title, cover_image").not("cover_image", "is", null).order("created_at", { ascending: false });
      setGalleryImages(posts ?? []);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(selected);
  };

  const handleGallerySelect = (imageUrl: string) => {
    setCropSrc(imageUrl);
  };

  const handleCropComplete = async (blob: Blob) => {
    setSaving(true);
    try {
      const ext = "jpg";
      const filePath = `site/home-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("gallery").upload(filePath, blob, { contentType: "image/jpeg" });
      if (uploadError) { alert("업로드 실패: " + uploadError.message); return; }
      const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(filePath);
      const res = await fetch("/api/site-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "home_image", value: urlData.publicUrl }) });
      if (!res.ok) throw new Error("저장 실패");
      setHomeImage(urlData.publicUrl);
      setCropSrc(null);
      alert("홈 이미지가 변경되었습니다.");
    } catch (err: any) { alert("오류: " + err.message); } finally { setSaving(false); }
  };

  const handleDirectSave = async (imageUrl: string) => {
    if (!confirm("이 이미지를 홈 대표 이미지로 설정하시겠습니까?\n(크롭 없이 그대로 적용)")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "home_image", value: imageUrl }) });
      if (!res.ok) throw new Error("저장 실패");
      setHomeImage(imageUrl);
      alert("홈 이미지가 변경되었습니다.");
    } catch (err: any) { alert("오류: " + err.message); } finally { setSaving(false); }
  };

  if (loading) return <main className="min-h-screen bg-[#f7f5f2] px-6 py-20"><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-sm"><p className="text-sm text-black/50">로딩 중...</p></div></main>;
  if (!authorized) return null;

  return (
    <>
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropSrc(null)}
        />
      )}

      <main className="min-h-screen bg-[#f7f5f2] px-6 py-12 md:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">사이트 설정</h1>
            <Link href="/admin/booking" className="inline-flex h-10 items-center rounded-full border border-black/10 bg-white px-5 text-sm text-black hover:bg-black/5">관리자 홈</Link>
          </div>

          <div className="rounded-[24px] bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-4 text-lg font-semibold">홈 대표 이미지</h2>

            {/* 현재 이미지 미리보기 */}
            <div className="mb-6 overflow-hidden rounded-[16px] bg-[#ece7e1]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={homeImage} alt="홈 대표 이미지" className="aspect-[4/3] w-full object-cover md:aspect-[16/9]" />
            </div>

            {/* 새 이미지 업로드 → 크롭 */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-black/60">새 이미지 업로드 (크롭 가능)</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 text-sm" />
            </div>

            {/* 갤러리에서 선택 */}
            {galleryImages.length > 0 && (
              <div>
                <label className="mb-3 block text-sm font-medium text-black/60">또는 갤러리에서 선택</label>
                <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                  {galleryImages.map((post) => (
                    <div key={post.id} className="relative">
                      <button
                        type="button"
                        onClick={() => handleGallerySelect(post.cover_image)}
                        disabled={saving}
                        className={`group w-full overflow-hidden rounded-xl border-2 transition ${homeImage === post.cover_image ? "border-black" : "border-transparent hover:border-black/20"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.cover_image} alt={post.title} className="aspect-square w-full object-cover" />
                        {homeImage === post.cover_image && <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl"><span className="text-xs font-bold text-white">현재</span></div>}
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-black/35">클릭하면 크롭 화면이 나옵니다</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}