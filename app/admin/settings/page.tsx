"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/isAdmin";
import Link from "next/link";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [homeImage, setHomeImage] = useState("/img/001.jpg");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUploadAndSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `site/home-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("gallery").upload(filePath, file);
      if (uploadError) { alert("업로드 실패: " + uploadError.message); return; }
      const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(filePath);
      const res = await fetch("/api/site-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "home_image", value: urlData.publicUrl }) });
      if (!res.ok) throw new Error("저장 실패");
      setHomeImage(urlData.publicUrl);
      setFile(null);
      setPreview(null);
      alert("홈 이미지가 변경되었습니다.");
    } catch (err: any) { alert("오류: " + err.message); } finally { setSaving(false); }
  };

  const handleSelectGallery = async (imageUrl: string) => {
    if (!confirm("이 이미지를 홈 대표 이미지로 설정하시겠습니까?")) return;
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
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-12 md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">사이트 설정</h1>
          <Link href="/admin/booking" className="inline-flex h-10 items-center rounded-full border border-black/10 bg-white px-5 text-sm text-black hover:bg-black/5">관리자 홈</Link>
        </div>
        <div className="rounded-[24px] bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-lg font-semibold">홈 대표 이미지</h2>
          <div className="mb-6 overflow-hidden rounded-[16px] bg-[#ece7e1]">
            <img src={preview || homeImage} alt="홈 대표 이미지" className="aspect-[4/3] w-full object-cover md:aspect-[16/9]" />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-black/60">새 이미지 업로드</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 text-sm" />
            {file && <button type="button" onClick={handleUploadAndSave} disabled={saving} className="mt-3 inline-flex h-10 items-center rounded-full bg-black px-6 text-sm text-white disabled:opacity-50">{saving ? "저장 중..." : "업로드 및 적용"}</button>}
          </div>
          {galleryImages.length > 0 && (
            <div>
              <label className="mb-3 block text-sm font-medium text-black/60">또는 갤러리에서 선택</label>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {galleryImages.map((post) => (
                  <button key={post.id} type="button" onClick={() => handleSelectGallery(post.cover_image)} disabled={saving} className={`group relative overflow-hidden rounded-xl border-2 transition ${homeImage === post.cover_image ? "border-black" : "border-transparent hover:border-black/20"}`}>
                    <img src={post.cover_image} alt={post.title} className="aspect-square w-full object-cover" />
                    {homeImage === post.cover_image && <div className="absolute inset-0 flex items-center justify-center bg-black/30"><span className="text-xs font-bold text-white">현재</span></div>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
