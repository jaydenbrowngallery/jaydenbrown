"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/isAdmin";

// ─── 크롭 컴포넌트 ───
function ImageCropper({
  imageSrc,
  onComplete,
  onCancel,
}: {
  imageSrc: string;
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [imgDim, setImgDim] = useState({ w: 0, h: 0 });
  const [processing, setProcessing] = useState(false);

  const FW = 320;
  const FH = 400;

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      const scale = Math.max(FW / img.naturalWidth, FH / img.naturalHeight);
      setImgDim({ w: img.naturalWidth * scale, h: img.naturalHeight * scale });
      setPos({ x: (FW - img.naturalWidth * scale) / 2, y: (FH - img.naturalHeight * scale) / 2 });
    }
  }, [imageSrc]);
  const calcSize = () => {
    const img = imgRef.current;
    if (!img) return;
    const scale = Math.max(FW / img.naturalWidth, FH / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    setImgDim({ w, h });
    setPos({ x: (FW - w) / 2, y: (FH - h) / 2 });
  };

  const clamp = useCallback((nx: number, ny: number) => ({
    x: Math.min(0, Math.max(FW - imgDim.w, nx)),
    y: Math.min(0, Math.max(FH - imgDim.h, ny)),
  }), [imgDim]);

  const onDown = (cx: number, cy: number) => {
    setDragging(true);
    setStart({ x: cx - pos.x, y: cy - pos.y });
  };
  const onMove = useCallback((cx: number, cy: number) => {
    if (!dragging) return;
    setPos(clamp(cx - start.x, cy - start.y));
  }, [dragging, start, clamp]);
  const onUp = () => setDragging(false);

  const doCrop = async () => {
    const img = imgRef.current;
    if (!img) return;
    setProcessing(true);
    const canvas = document.createElement("canvas");
    canvas.width = FW * 3;
    canvas.height = FH * 3;
    const ctx = canvas.getContext("2d")!;
    const sx = (-pos.x / imgDim.w) * img.naturalWidth;
    const sy = (-pos.y / imgDim.h) * img.naturalHeight;
    const sw = (FW / imgDim.w) * img.naturalWidth;
    const sh = (FH / imgDim.h) * img.naturalHeight;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => { if (b) onComplete(b); setProcessing(false); }, "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-[24px] bg-white p-5 shadow-2xl">
        <h3 className="mb-2 text-base font-semibold">이미지 위치 조정</h3>
        <p className="mb-4 text-xs text-black/45">드래그하여 보여질 영역을 선택하세요</p>
        <div
          className="relative mx-auto cursor-grab overflow-hidden rounded-2xl bg-black active:cursor-grabbing"
          style={{ width: FW, height: FH, maxWidth: "100%", touchAction: "none" }}
          onMouseDown={(e) => { e.preventDefault(); onDown(e.clientX, e.clientY); }}
          onMouseMove={(e) => onMove(e.clientX, e.clientY)}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={(e) => onDown(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchEnd={onUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt=""
            onLoad={calcSize}
            draggable={false}
            
            className="pointer-events-none select-none"
            style={{ position: "absolute", left: pos.x, top: pos.y, width: imgDim.w, height: imgDim.h }}
          />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
            <div className="absolute left-2/3 top-0 h-full w-px bg-white/20" />
            <div className="absolute left-0 top-1/3 h-px w-full bg-white/20" />
            <div className="absolute left-0 top-2/3 h-px w-full bg-white/20" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={doCrop} disabled={processing}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-black text-sm text-white disabled:opacity-50">
            {processing ? "처리 중..." : "적용하기"}
          </button>
          <button type="button" onClick={onCancel}
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 px-5 text-sm">
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───
export default function HomeImageEditor({ initialImage }: { initialImage: string }) {
  const [admin, setAdmin] = useState(false);
  const [image, setImage] = useState(initialImage);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [gallery, setGallery] = useState<{ id: string; title: string; cover_image: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAdmin(isAdmin(session?.user?.email)));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setAdmin(isAdmin(session?.user?.email)));
    return () => subscription.unsubscribe();
  };

  const openModal = async () => {
    if (!admin) return;
    const { data } = await supabase.from("gallery_posts").select("id, title, cover_image").not("cover_image", "is", null).order("created_at", { ascending: false });
    setGallery(data ?? []);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const reader = new FileReader();
    reader.onload = () => { setCropSrc(reader.result as string); setShowModal(false); };
    reader.readAsDataURL(selected);
  };

  const handleGallerySelect = (imageUrl: string) => {
    setCropSrc(imageUrl);
    setShowModal(false);
  };

  const handleCropComplete = async (blob: Blob) => {
    setSaving(true);
    try {
      const filePath = `site/home-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("gallery").upload(filePath, blob, { contentType: "image/jpeg" });
      if (error) { alert("업로드 실패: " + error.message); setSaving(false); return; }
      const { data } = supabase.storage.from("gallery").getPublicUrl(filePath);
      const res = await fetch("/api/site-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "home_image", value: data.publicUrl }) });
      if (!res.ok) throw new Error("저장 실패");
      setImage(data.publicUrl);
      setCropSrc(null);
    } catch (err: any) { alert("오류: " + err.message); } finally { setSaving(false); }
  };

  return (
    <>
      <div
        className={`overflow-hidden rounded-[24px] bg-[#ece7e1] shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:rounded-[30px] ${admin ? "cursor-pointer group" : ""}`}
        onClick={openModal}
      >
        <div className="relative">
          <div className="aspect-[4/3] w-full bg-cover bg-center md:aspect-[4/5]" style={{ backgroundImage: `url('${image}')` }} />
          {admin && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
              <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-black opacity-0 transition group-hover:opacity-100">이미지 변경</span>
            </div>
          )}
        </div>
      </div>

      {/* 선택 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[24px] bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">홈 이미지 변경</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl text-black/40 hover:text-black">&times;</button>
            </div>
            <div className="mb-5">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="inline-flex h-10 w-full items-center justify-center rounded-full border border-black/10 text-sm hover:bg-black/5">
                📁 새 이미지 업로드
              </button>
            </div>
            {gallery.length > 0 && (
              <>
                <p className="mb-3 text-sm text-black/50">또는 갤러리에서 선택</p>
                <div className="grid grid-cols-3 gap-2">
                  {gallery.map((post) => (
                    <button key={post.id} type="button" onClick={() => handleGallerySelect(post.cover_image)}
                      className={`relative overflow-hidden rounded-xl border-2 transition ${image === post.cover_image ? "border-black" : "border-transparent hover:border-black/20"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.cover_image} alt={post.title} className="aspect-square w-full object-cover" />
                      {image === post.cover_image && <div className="absolute inset-0 flex items-center justify-center bg-black/30"><span className="text-[10px] font-bold text-white">현재</span></div>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 크롭 모달 */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          onComplete={handleCropComplete}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </>
  );
}