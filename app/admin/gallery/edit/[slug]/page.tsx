"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/isAdmin";

type GalleryPost = { id: string; title: string; slug: string; cover_image: string | null; created_at: string };
type GalleryImage = { id: string; image_url: string; sort_order: number };

function slugify(value: string) {
  const raw = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-가-힣]/g, "");
  return raw || `gallery-${Date.now()}`;
}

function getStoragePath(url: string) {
  const marker = "/storage/v1/object/public/gallery/";
  const idx = url.indexOf(marker);
  return idx === -1 ? null : decodeURIComponent(url.substring(idx + marker.length));
}

export default function EditGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = useMemo(() => String(params.slug ?? ""), [params.slug]);

  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [post, setPost] = useState<GalleryPost | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingTitle, setSavingTitle] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      if (!isAdmin(user.email)) { setAuthorized(false); setCheckingAuth(false); return; }
      setAuthorized(true); setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authorized || !slug) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: postData, error: postError } = await supabase.from("gallery_posts").select("*").eq("slug", slug).maybeSingle();
      if (postError || !postData) { alert("갤러리 조회 실패"); router.replace("/portfolio"); return; }
      const { data: imageData } = await supabase.from("gallery_images").select("id, image_url, sort_order").eq("post_id", postData.id).order("sort_order", { ascending: true });
      setPost(postData); setTitle(postData.title); setImages(imageData ?? []); setLoading(false);
    };
    fetchData();
  }, [authorized, slug, router]);

  const refreshImages = async (postId: string) => {
    const { data } = await supabase.from("gallery_images").select("id, image_url, sort_order").eq("post_id", postId).order("sort_order", { ascending: true });
    setImages(data ?? []);
    return data ?? [];
  };

  const updateCover = async (postId: string, imgs?: GalleryImage[]) => {
    const list = imgs ?? (await supabase.from("gallery_images").select("id, image_url, sort_order").eq("post_id", postId).order("sort_order", { ascending: true })).data ?? [];
    const cover = list.length > 0 ? list[0].image_url : null;
    await supabase.from("gallery_posts").update({ cover_image: cover }).eq("id", postId);
  };

  const handleSaveTitle = async () => {
    if (!post || !title.trim()) return;
    setSavingTitle(true);
    const nextSlug = slugify(title);
    const { error } = await supabase.from("gallery_posts").update({ title: title.trim(), slug: nextSlug }).eq("id", post.id);
    setSavingTitle(false);
    if (error) { alert("제목 수정 실패: " + error.message); return; }
    alert("제목 수정 완료");
    router.replace(`/admin/gallery/edit/${nextSlug}`);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!post || !e.target.files?.length) return;
    setUploading(true);
    try {
      const files = e.target.files;
      let startOrder = images.length;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `${post.id}/${Date.now()}-${startOrder + i}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("gallery").upload(filePath, file);
        if (uploadErr) { alert("업로드 실패: " + uploadErr.message); break; }
        const { data } = supabase.storage.from("gallery").getPublicUrl(filePath);
        await supabase.from("gallery_images").insert({ post_id: post.id, image_url: data.publicUrl, sort_order: startOrder + i });
      }
      const refreshed = await refreshImages(post.id);
      await updateCover(post.id, refreshed);
      e.target.value = "";
      alert("이미지 추가 완료");
    } catch (err: any) { alert("오류: " + err.message); } finally { setUploading(false); }
  };

  const handleDelete = async (image: GalleryImage) => {
    if (!post || !confirm("이 이미지를 삭제하시겠습니까?")) return;
    setDeletingId(image.id);
    try {
      const path = getStoragePath(image.image_url);
      if (path) await supabase.storage.from("gallery").remove([path]);
      await supabase.from("gallery_images").delete().eq("id", image.id);
      const refreshed = await refreshImages(post.id);
      await updateCover(post.id, refreshed);
    } catch (err: any) { alert("삭제 실패: " + err.message); } finally { setDeletingId(null); }
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= images.length) return;
    const next = [...images];
    [next[index], next[newIdx]] = [next[newIdx], next[index]];
    setImages(next);
  };

  const handleSaveOrder = async () => {
    if (!post) return;
    setSavingOrder(true);
    try {
      for (let i = 0; i < images.length; i++) {
        await supabase.from("gallery_images").update({ sort_order: i }).eq("id", images[i].id);
      }
      await updateCover(post.id, images);
      alert("순서 저장 완료");
    } catch (err: any) { alert("순서 저장 실패: " + err.message); } finally { setSavingOrder(false); }
  };

  if (checkingAuth || loading) return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm text-black/50">{checkingAuth ? "권한 확인 중..." : "불러오는 중..."}</p>
      </div>
    </main>
  );

  if (!authorized) return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold">접근 권한이 없습니다</h1>
      </div>
    </main>
  );

  if (!post) return null;

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-12 md:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* 헤더 */}
        <div className="rounded-[24px] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-black/35">Admin Edit</p>
              <h1 className="mt-2 text-2xl font-semibold">갤러리 수정</h1>
            </div>
            <div className="flex gap-2">
              <Link href={`/portfolio/${post.slug}`} className="inline-flex h-10 items-center rounded-full border border-black/10 px-5 text-sm hover:bg-black/5">상세 보기</Link>
              <Link href="/portfolio" className="inline-flex h-10 items-center rounded-full border border-black/10 px-5 text-sm hover:bg-black/5">목록</Link>
            </div>
          </div>
        </div>

        {/* 제목 수정 */}
        <div className="rounded-[24px] bg-white p-6 shadow-sm">
          <p className="mb-4 text-base font-semibold">제목 수정</p>
          <div className="flex gap-3">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 text-sm outline-none" />
            <button type="button" onClick={handleSaveTitle} disabled={savingTitle} className="inline-flex h-11 items-center rounded-full bg-black px-5 text-sm text-white disabled:opacity-50">
              {savingTitle ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>

        {/* 이미지 추가 */}
        <div className="rounded-[24px] bg-white p-6 shadow-sm">
          <p className="mb-4 text-base font-semibold">이미지 추가</p>
          <label className="inline-flex h-11 cursor-pointer items-center rounded-full border border-black/10 px-5 text-sm hover:bg-black/5">
            {uploading ? "업로드 중..." : "📁 사진 추가하기"}
            <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        {/* 현재 이미지 - 썸네일 + 순서 변경 */}
        <div className="rounded-[24px] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-base font-semibold">이미지 순서 ({images.length}장)</p>
            <button type="button" onClick={handleSaveOrder} disabled={savingOrder} className="inline-flex h-9 items-center rounded-full bg-black px-4 text-xs text-white disabled:opacity-50">
              {savingOrder ? "저장 중..." : "순서 저장"}
            </button>
          </div>

          {images.length === 0 ? (
            <p className="text-sm text-black/40">등록된 이미지가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {images.map((img, idx) => (
                <div key={img.id} className="relative group">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl bg-[#ece7e2]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.image_url} alt={`#${idx + 1}`} className="h-full w-full object-cover" />
                  </div>

                  {/* 순서 번호 */}
                  <div className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white">
                    {idx + 1}
                  </div>

                  {/* 순서 이동 버튼 */}
                  <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                    {idx > 0 && (
                      <button type="button" onClick={() => moveImage(idx, -1)} className="flex h-5 w-5 items-center justify-center rounded bg-white/90 text-[10px] shadow hover:bg-white">←</button>
                    )}
                    {idx < images.length - 1 && (
                      <button type="button" onClick={() => moveImage(idx, 1)} className="flex h-5 w-5 items-center justify-center rounded bg-white/90 text-[10px] shadow hover:bg-white">→</button>
                    )}
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleDelete(img)}
                    disabled={deletingId === img.id}
                    className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80 text-[10px] text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
