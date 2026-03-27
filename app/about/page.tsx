"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/isAdmin";

const ABOUT_IMAGE_KEYS = ["about_image_1", "about_image_2", "about_image_3", "about_image_4"];

export default function AboutPage() {
  const [admin, setAdmin] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
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

  const handleUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(key);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `site/${key}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("gallery").upload(filePath, file);
      if (error) { alert("업로드 실패: " + error.message); return; }
      const { data } = supabase.storage.from("gallery").getPublicUrl(filePath);
      const res = await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: key, value: data.publicUrl }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setImages((prev) => ({ ...prev, [key]: data.publicUrl }));
    } catch (err: any) {
      alert("오류: " + err.message);
    } finally {
      setUploading(null);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <main className={`min-h-screen bg-[#f7f5f2] transition-all duration-1000 ease-out ${fadeIn ? "opacity-100 blur-0" : "opacity-0 blur-sm"}`}>
      <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">

        {/* 타이틀 */}
        <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-black/30">About</p>

        <h1 className="text-[1.5rem] font-light leading-[1.5] tracking-[-0.02em] text-black/80 md:text-[2.2rem]">
          어느덧 20년에 가까운 시간을
          <br />
          카메라와 함께했습니다.
        </h1>

        {/* 본문 */}
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
                      onChange={(e) => handleUpload(key, e)}
                      disabled={uploading === key}
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
  );
}