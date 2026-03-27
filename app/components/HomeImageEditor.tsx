"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/isAdmin";

export default function HomeImageEditor({ initialImage }: { initialImage: string }) {
  const [admin, setAdmin] = useState(false);
  const [image, setImage] = useState(initialImage);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [gallery, setGallery] = useState<{ id: string; title: string; cover_image: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdmin(isAdmin(session?.user?.email));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAdmin(isAdmin(session?.user?.email));
    });
    return () => subscription.unsubscribe();
  }, []);

  const openModal = async () => {
    if (!admin) return;
    const { data } = await supabase
      .from("gallery_posts")
      .select("id, title, cover_image")
      .not("cover_image", "is", null)
      .order("created_at", { ascending: false });
    setGallery(data ?? []);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const saveImage = async (imageUrl: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "home_image", value: imageUrl }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setImage(imageUrl);
      setShowModal(false);
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      alert("오류: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `site/home-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("gallery").upload(filePath, file);
      if (error) { alert("업로드 실패: " + error.message); setSaving(false); return; }
      const { data } = supabase.storage.from("gallery").getPublicUrl(filePath);
      await saveImage(data.publicUrl);
    } catch (err: any) {
      alert("오류: " + err.message);
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className={`overflow-hidden rounded-[24px] bg-[#ece7e1] shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:rounded-[30px] ${admin ? "cursor-pointer group" : ""}`}
        onClick={openModal}
      >
        <div className="relative">
          <div
            className="aspect-[4/3] w-full bg-cover bg-center md:aspect-[4/5]"
            style={{ backgroundImage: `url('${image}')` }}
          />
          {admin && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
              <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-black opacity-0 transition group-hover:opacity-100">
                이미지 변경
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[24px] bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">홈 이미지 변경</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl text-black/40 hover:text-black">&times;</button>
            </div>

            {/* 미리보기 */}
            {preview && (
              <div className="mb-4 overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="미리보기" className="aspect-[4/3] w-full object-cover" />
              </div>
            )}

            {/* 업로드 */}
            <div className="mb-5">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex h-10 items-center rounded-full border border-black/10 px-5 text-sm hover:bg-black/5"
                >
                  📁 파일 선택
                </button>
                {file && (
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={saving}
                    className="inline-flex h-10 items-center rounded-full bg-black px-5 text-sm text-white disabled:opacity-50"
                  >
                    {saving ? "저장 중..." : "✓ 업로드 및 적용"}
                  </button>
                )}
              </div>
            </div>

            {/* 갤러리에서 선택 */}
            {gallery.length > 0 && (
              <>
                <p className="mb-3 text-sm text-black/50">또는 갤러리에서 선택</p>
                <div className="grid grid-cols-3 gap-2">
                  {gallery.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => saveImage(post.cover_image)}
                      disabled={saving}
                      className={`relative overflow-hidden rounded-xl border-2 transition ${image === post.cover_image ? "border-black" : "border-transparent hover:border-black/20"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.cover_image} alt={post.title} className="aspect-square w-full object-cover" />
                      {image === post.cover_image && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="text-[10px] font-bold text-white">현재</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
