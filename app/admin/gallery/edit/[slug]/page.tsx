"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/isAdmin";

type GalleryPost = {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  created_at: string;
};

type GalleryImage = {
  id: string;
  image_url: string;
  sort_order: number;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-가-힣]/g, "");
}

function getStoragePathFromPublicUrl(imageUrl: string) {
  const marker = "/storage/v1/object/public/gallery/";
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(imageUrl.substring(idx + marker.length));
}

export default function EditGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = useMemo(() => String(params.slug ?? ""), [params.slug]);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [post, setPost] = useState<GalleryPost | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [title, setTitle] = useState("");
  const [newFiles, setNewFiles] = useState<FileList | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingTitle, setSavingTitle] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      if (!isAdmin(user.email)) {
        setAuthorized(false);
        setCheckingAuth(false);
        return;
      }

      setAuthorized(true);
      setCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authorized || !slug) return;

    const fetchData = async () => {
      setLoading(true);

      const { data: postData, error: postError } = await supabase
        .from("gallery_posts")
        .select("id, title, slug, cover_image, created_at")
        .eq("slug", slug)
        .maybeSingle();

      if (postError || !postData) {
        alert(`갤러리 조회 실패: ${postError?.message ?? "존재하지 않음"}`);
        router.replace("/portfolio");
        return;
      }

      const { data: imageData, error: imageError } = await supabase
        .from("gallery_images")
        .select("id, image_url, sort_order")
        .eq("post_id", postData.id)
        .order("sort_order", { ascending: true });

      if (imageError) {
        alert(`이미지 조회 실패: ${imageError.message}`);
        router.replace("/portfolio");
        return;
      }

      setPost(postData);
      setTitle(postData.title);
      setImages(imageData ?? []);
      setLoading(false);
    };

    fetchData();
  }, [authorized, slug, router]);

  const refreshImages = async (postId: string) => {
    const { data, error } = await supabase
      .from("gallery_images")
      .select("id, image_url, sort_order")
      .eq("post_id", postId)
      .order("sort_order", { ascending: true });

    if (error) {
      alert(`이미지 새로고침 실패: ${error.message}`);
      return null;
    }

    setImages(data ?? []);
    return data ?? [];
  };

  const updateCoverImage = async (postId: string, imageList?: GalleryImage[]) => {
    const currentImages =
      imageList ??
      (await supabase
        .from("gallery_images")
        .select("id, image_url, sort_order")
        .eq("post_id", postId)
        .order("sort_order", { ascending: true }))
        .data ??
      [];

    const nextCover = currentImages.length > 0 ? currentImages[0].image_url : null;

    const { error } = await supabase
      .from("gallery_posts")
      .update({ cover_image: nextCover })
      .eq("id", postId);

    if (error) {
      alert(`대표 이미지 갱신 실패: ${error.message}`);
    }
  };

  const handleSaveTitle = async () => {
    if (!post) return;

    const nextTitle = title.trim();
    if (!nextTitle) {
      alert("제목을 입력해주세요.");
      return;
    }

    const nextSlug = slugify(nextTitle);

    setSavingTitle(true);

    const { error } = await supabase
      .from("gallery_posts")
      .update({
        title: nextTitle,
        slug: nextSlug,
      })
      .eq("id", post.id);

    setSavingTitle(false);

    if (error) {
      alert(`제목 수정 실패: ${error.message}`);
      return;
    }

    alert("제목 수정 완료");
    router.replace(`/admin/gallery/edit/${nextSlug}`);
  };

  const handleUploadNewImages = async () => {
    if (!post) return;
    if (!newFiles || newFiles.length === 0) {
      alert("추가할 사진을 선택해주세요.");
      return;
    }

    setUploading(true);

    try {
      const currentImages = [...images];
      let startOrder = currentImages.length;

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeFileName = `${Date.now()}-${startOrder + i}.${extension}`;
        const filePath = `${post.id}/${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(filePath, file);

        if (uploadError) {
          alert(`파일 업로드 실패: ${uploadError.message}`);
          setUploading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("gallery")
          .getPublicUrl(filePath);

        const imageUrl = publicUrlData.publicUrl;

        const { error: insertError } = await supabase
          .from("gallery_images")
          .insert({
            post_id: post.id,
            image_url: imageUrl,
            sort_order: startOrder + i,
          });

        if (insertError) {
          alert(`이미지 DB 저장 실패: ${insertError.message}`);
          setUploading(false);
          return;
        }
      }

      const refreshed = await refreshImages(post.id);
      if (refreshed) {
        await updateCoverImage(post.id, refreshed);
      }

      setNewFiles(null);
      const fileInput = document.getElementById("new-images") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      alert("이미지 추가 완료");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (image: GalleryImage) => {
    if (!post) return;
    const ok = confirm("이 이미지를 삭제하시겠습니까?");
    if (!ok) return;

    setDeletingImageId(image.id);

    try {
      const filePath = getStoragePathFromPublicUrl(image.image_url);

      if (filePath) {
        const { error: storageDeleteError } = await supabase.storage
          .from("gallery")
          .remove([filePath]);

        if (storageDeleteError) {
          alert(`스토리지 삭제 실패: ${storageDeleteError.message}`);
          setDeletingImageId(null);
          return;
        }
      }

      const { error: deleteRowError } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", image.id);

      if (deleteRowError) {
        alert(`이미지 DB 삭제 실패: ${deleteRowError.message}`);
        setDeletingImageId(null);
        return;
      }

      const refreshed = await refreshImages(post.id);
      if (refreshed) {
        await updateCoverImage(post.id, refreshed);
      }

      alert("이미지 삭제 완료");
    } finally {
      setDeletingImageId(null);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 shadow-sm">
          <p className="text-sm text-black/50">관리자 권한 확인 중...</p>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.35em] text-black/45">
            Access Denied
          </p>
          <h1 className="mt-4 text-3xl font-semibold md:text-5xl">
            접근 권한이 없습니다
          </h1>
          <p className="mt-4 text-black/60">
            관리자 계정으로 로그인한 경우에만 수정 페이지를 사용할 수 있습니다.
          </p>
        </div>
      </main>
    );
  }

  if (loading || !post) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 shadow-sm">
          <p className="text-sm text-black/50">불러오는 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-16 md:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-black/45">
                Admin Edit
              </p>
              <h1 className="mt-4 text-3xl font-semibold md:text-5xl">
                갤러리 수정
              </h1>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/portfolio/${post.slug}`}
                className="inline-flex rounded-full border border-black/10 px-5 py-3 text-sm text-black/70"
              >
                상세 보기
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex rounded-full border border-black/10 px-5 py-3 text-sm text-black/70"
              >
                목록 가기
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <p className="text-lg font-semibold">제목 수정</p>

          <div className="mt-6 flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none"
            />

            <button
              type="button"
              onClick={handleSaveTitle}
              disabled={savingTitle}
              className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm text-white disabled:opacity-50"
            >
              {savingTitle ? "저장 중..." : "제목 저장"}
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <p className="text-lg font-semibold">이미지 추가</p>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
            <input
              id="new-images"
              type="file"
              multiple
              onChange={(e) => setNewFiles(e.target.files)}
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3"
            />

            <button
              type="button"
              onClick={handleUploadNewImages}
              disabled={uploading}
              className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm text-white disabled:opacity-50"
            >
              {uploading ? "업로드 중..." : "이미지 추가"}
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">현재 이미지</p>
            <p className="text-sm text-black/45">{images.length}장</p>
          </div>

          {images.length === 0 ? (
            <p className="mt-6 text-sm text-black/45">등록된 이미지가 없습니다.</p>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-[#f7f5f2]"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={`${post.title} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex items-center justify-between px-4 py-4">
                    <p className="text-sm text-black/60">#{index + 1}</p>

                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image)}
                      disabled={deletingImageId === image.id}
                      className="rounded-full border border-black/10 px-4 py-2 text-xs text-black/70 disabled:opacity-50"
                    >
                      {deletingImageId === image.id ? "삭제 중..." : "이미지 삭제"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}