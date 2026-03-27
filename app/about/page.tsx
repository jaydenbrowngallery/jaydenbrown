"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/isAdmin";

const ABOUT_IMAGE_KEYS = ["about_image_1", "about_image_2", "about_image_3", "about_image_4"];

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [imgW, setImgW] = useState(0);
  const [imgH, setImgH] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [ready, setReady] = useState(false);

  const FW = 300;
  const FH = 375; // 4:5

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const scale = Math.max(FW / nw, FH / nh);
      const w = Math.ceil(nw * scale);
      const h = Math.ceil(nh * scale);
      setImgW(w);
      setImgH(h);
      setPos({ x: Math.round((FW - w) / 2), y: Math.round((FH - h) / 2) });
      setImgEl(img);
      setReady(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (!ready || !imgEl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, FW, FH);
    ctx.drawImage(imgEl, pos.x, pos.y, imgW, imgH);
  }, [pos, imgEl, imgW, imgH, ready]);

  const clamp = useCallback((nx: number, ny: number) => ({
    x: Math.min(0, Math.max(FW - imgW, nx)),
    y: Math.min(0, Math.max(FH - imgH, ny)),
  }), [imgW, imgH]);

  const onDown = (cx: number, cy: number) => { setDragging(true); setStart({ x: cx - pos.x, y: cy - pos.y }); };
  const onMove = useCallback((cx: number, cy: number) => { if (!dragging) return; setPos(clamp(cx - start.x, cy - start.y)); }, [dragging, start, clamp]);
  const onUp = () => setDragging(false);

  const doCrop = async () => {
    if (!imgEl) return;
    setProcessing(true);
    const out = document.createElement("canvas");
    out.width = FW * 3;
    out.height = FH * 3;
    const ctx = out.getContext("2d")!;
    const sx = (-pos.x / imgW) * imgEl.naturalWidth;
    const sy = (-pos.y / imgH) * imgEl.naturalHeight;
    const sw = (FW / imgW) * imgEl.naturalWidth;
    const sh = (FH / imgH) * imgEl.naturalHeight;
    ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, out.width, out.height);
    out.toBlob((b) => { if (b) onComplete(b); setProcessing(false); }, "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-[24px] bg-white p-5 shadow-2xl">
        <h3 className="mb-2 text-base font-semibold">이미지 위치 조정</h3>
        <p className="mb-4 text-xs text-black/45">드래그하여 보여질 영역을 선택하세요</p>
        <div
          className="relative mx-auto cursor-grab overflow-hidden rounded-2xl bg-black active:cursor-grabbing"
          style={{ width: FW, height: FH, touchAction: "none" }}
          onMouseDown={(e) => { e.preventDefault(); onDown(e.clientX, e.clientY); }}
          onMouseMove={(e) => onMove(e.clientX, e.clientY)}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={(e) => onDown(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchEnd={onUp}
        >
          <canvas ref={canvasRef} width={FW} height={FH} style={{ width: FW, height: FH }} />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
            <div className="absolute left-2/3 top-0 h-full w-px bg-white/20" />
            <div className="absolute left-0 top-1/3 h-px w-full bg-white/20" />
            <div className="absolute left-0 top-2/3 h-px w-full bg-white/20" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={doCrop} disabled={processing || !ready}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-black text-sm text-white disabled:opacity-50">
            {processing ? "처리 중..." : "적용하기"}
          </button>
          <button type="button" onClick={onCancel}
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 px-5 text-sm">취소</button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 About 페이지 ───
export default function AboutPage() {
  const [admin, setAdmin] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropKey, setCropKey] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAdmin(isAdmin(session?.user?.email)));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setAdmin(isAdmin(session?.user?.email)));
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, string> = {};
        for (const s of data.settings ?? []) {
          if (ABOUT_IMAGE_KEYS.includes(s.id) && s.value) map[s.id] = s.value;
        }
        setImages(map);
        setTimeout(() => setFadeIn(true), 50);
      });
    return () => subscription.unsubscribe();
  }, []);

  const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropKey(key);
      setCropSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (blob: Blob) => {
    if (!cropKey) return;
    setUploading(cropKey);
    try {
      const filePath = `site/${cropKey}-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("gallery").upload(filePath, blob, { contentType: "image/jpeg" });
      if (error) { alert("업로드 실패: " + error.message); return; }
      const { data } = supabase.storage.from("gallery").getPublicUrl(filePath);
      const res = await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cropKey, value: data.publicUrl }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setImages((prev) => ({ ...prev, [cropKey]: data.publicUrl }));
      setCropSrc(null);
      setCropKey(null);
    } catch (err: any) {
      alert("오류: " + err.message);
    } finally {
      setUploading(null);
    }
  };

  return (
    <>
      {/* 크롭 모달 */}
      {cropSrc && cropKey && (
        <ImageCropper
          imageSrc={cropSrc}
          onComplete={handleCropComplete}
          onCancel={() => { setCropSrc(null); setCropKey(null); }}
        />
      )}

      <main className={`min-h-screen bg-[#f7f5f2] transition-all duration-1000 ease-out ${fadeIn ? "opacity-100 blur-0" : "opacity-0 blur-sm"}`}>
        <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">

          <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-black/30">About</p>

          <h1 className="text-[1.5rem] font-light leading-[1.5] tracking-[-0.02em] text-black/80 md:text-[2.2rem]">
            어느덧 20년에 가까운 시간을
            <br />
            카메라와 함께했습니다.
          </h1>

          <div className="mt-14 max-w-2xl">
            <p className="text-[14px] leading-[2.2] text-black/50 md:text-[15px]">
              시간이 흐르는 동안,
              <br />
              제가 돌잔치를 촬영했던 아이들이
              <br />
              다시 제 카메라 앞에 서는 순간들이 있습니다.
            </p>

            <p className="mt-5 text-[14px] leading-[2.2] text-black/50 md:text-[15px]">
              그때마다, 어느새 저보다 훌쩍 자라
              <br />
              제가 올려다보게 된 그 모습을 마주하게 됩니다.
              <br />
              그리고 그 순간,
              <br />
              처음 만났던 날이 겹쳐 보이듯 떠올라
              <br />
              조용히 웃게 됩니다.
            </p>

            <p className="mt-8 text-[15px] leading-[2] text-black/60 md:text-[16px]">
              참, 오래되었습니다.
            </p>

            <p className="mt-8 text-[14px] leading-[2.2] text-black/50 md:text-[15px]">
              그 시간 동안 변하지 않은 것이 있다면,
              <br />
              더 좋은 사진을 위해 노력해왔다는 것입니다.
              <br />
              늘 고민했고,
              <br />
              그 고민의 일부라 생각하며
              <br />
              장비에도 아낌없이 투자해왔습니다.
            </p>

            <p className="mt-8 text-[14px] leading-[2.2] text-black/50 md:text-[15px]">
              이제는 아이들의 작은 손짓만 보아도
              <br />
              마음이 느껴지고,
              <br />
              눈빛만으로도 그날의 감정을
              <br />
              읽을 수 있게 되었습니다.
            </p>

            <p className="mt-8 text-[14px] leading-[2.2] text-black/50 md:text-[15px]">
              비단 아이들뿐만이 아닙니다.
              <br />
              돌잔치, 칠순, 그리고 수많은 순간들 속에서
              <br />
              사람들의 표정과 분위기,
              <br />
              그날의 공기까지도
              <br />
              자연스럽게 느껴집니다.
            </p>

            <p className="mt-8 text-[14px] leading-[2.2] text-black/50 md:text-[15px]">
              그래서 알고 있습니다.
              <br />
              그날을 더 행복하게 만들기 위해
              <br />
              어떤 노력이 필요한지.
              <br />
              그것은 연출이 아니라,
              <br />
              그 순간을 이해하고 흐름을 읽는 일입니다.
            </p>

            <div className="my-12 h-px w-16 bg-black/10" />

            <p className="text-[14px] leading-[2.2] text-black/55 md:text-[15px]">
              20년 전에도, 지금도
              <br />
              변하지 않은 한 가지가 있습니다.
            </p>

            <p className="mt-6 text-[15px] leading-[2] text-black/65 md:text-[16px]">
              사람들의 가장 소중한 순간에
              <br />
              제가 함께하고 있다는 사실이
              <br />
              여전히 저를 설레게 합니다.
            </p>

            <p className="mt-4 text-[15px] leading-[2] text-black/65 md:text-[16px]">
              그리고 그 마음이
              <br />
              사진에 담긴다고 믿습니다.
            </p>

            <div className="my-12 h-px w-16 bg-black/10" />

            <p className="text-[14px] leading-[2.2] text-black/55 md:text-[15px]">
              그래서 말하고 싶습니다.
            </p>

            <p className="mt-6 text-[17px] font-medium leading-[1.8] text-black/75 md:text-[20px]">
              그냥, 믿고 맡겨주셔도 괜찮습니다.
            </p>

            <p className="mt-8 text-[14px] leading-[2.2] text-black/50 md:text-[15px]">
              이 순간을 어떻게 남겨야 하는지에 대해
              <br />
              오랜 시간 고민해왔습니다.
            </p>

            <p className="mt-4 text-[14px] leading-[2.2] text-black/50 md:text-[15px]">
              그리고 그 마음으로
              <br />
              지금도 촬영하고 있습니다.
            </p>
          </div>

          {/* 하단 이미지 4장 */}
          <div className="mt-24">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
              {ABOUT_IMAGE_KEYS.map((key) => {
                const imgUrl = images[key];
                return (
                  <div key={key} className="relative">
                    {imgUrl ? (
                      <div
                        className={`aspect-[4/5] w-full overflow-hidden rounded-lg bg-[#ece7e2] ${admin ? "cursor-pointer group" : ""}`}
                        onClick={() => admin && fileRefs.current[key]?.click()}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                        {admin && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 transition group-hover:bg-black/30">
                            <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-black opacity-0 transition group-hover:opacity-100">변경</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`flex aspect-[4/5] w-full items-center justify-center rounded-lg bg-[#ece7e2] ${admin ? "cursor-pointer hover:bg-[#e3ddd6] transition" : ""}`}
                        onClick={() => admin && fileRefs.current[key]?.click()}
                      >
                        {admin ? (
                          <div className="text-center">
                            <p className="text-2xl text-black/20">+</p>
                            <p className="mt-1 text-[11px] text-black/30">이미지 추가</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                    {admin && (
                      <input
                        ref={(el) => { fileRefs.current[key] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(key, e)}
                      />
                    )}
                    {uploading === key && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                        <span className="text-xs font-medium text-white">업로드 중...</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}