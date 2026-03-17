"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminGalleryPage() {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!files || files.length === 0) {
      alert("사진을 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const slugValue = title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-가-힣]/g, "");

      const titleValue = title.trim();

      const { error: insertPostError } = await supabase
        .from("gallery_posts")
        .insert({
          title: titleValue,
          slug: slugValue,
        });

      if (insertPostError) {
        alert(
          "갤러리 글 생성 실패\n\n" +
            JSON.stringify(insertPostError, null, 2)
        );
        return;
      }

      const { data: post, error: fetchPostError } = await supabase
        .from("gallery_posts")
        .select("id, title, slug, cover_image")
        .eq("slug", slugValue)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchPostError || !post) {
        alert(
          "생성된 갤러리 글 조회 실패\n\n" +
            JSON.stringify(fetchPostError, null, 2) +
            "\n\npost 존재 여부: " +
            String(!!post)
        );
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeFileName = `${Date.now()}-${i}.${extension}`;
        const filePath = `${post.id}/${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(filePath, file);

        if (uploadError) {
          alert(
            "파일 업로드 실패\n\n" +
              JSON.stringify(uploadError, null, 2)
          );
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("gallery")
          .getPublicUrl(filePath);

        const imageUrl = publicUrlData.publicUrl;

        const { error: imageInsertError } = await supabase
          .from("gallery_images")
          .insert({
            post_id: post.id,
            image_url: imageUrl,
            sort_order: i,
          });

        if (imageInsertError) {
          alert(
            "이미지 DB 저장 실패\n\n" +
              JSON.stringify(imageInsertError, null, 2)
          );
          return;
        }

        if (i === 0) {
          const { error: coverUpdateError } = await supabase
            .from("gallery_posts")
            .update({ cover_image: imageUrl })
            .eq("id", post.id);

          if (coverUpdateError) {
            alert(
              "대표 이미지 저장 실패\n\n" +
                JSON.stringify(coverUpdateError, null, 2)
            );
            return;
          }
        }
      }

      alert("업로드 완료");
      setTitle("");
      setFiles(null);
    } catch (error) {
      alert(
        "예상치 못한 오류\n\n" +
          (error instanceof Error ? error.message : JSON.stringify(error))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-black/45">
          Admin
        </p>

        <h1 className="mt-4 text-3xl font-semibold md:text-5xl">
          갤러리 업로드
        </h1>

        <p className="mt-4 text-black/60">
          제목을 입력하고 여러 장의 사진을 첨부하면 갤러리용 데이터가 생성됩니다.
        </p>

        <div className="mt-10 space-y-6">
          <div>
            <label className="mb-2 block text-sm text-black/60">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 돌스냅 01"
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-black/60">사진 첨부</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3"
            />
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm text-white disabled:opacity-50"
          >
            {loading ? "업로드 중..." : "업로드"}
          </button>
        </div>
      </div>
    </main>
  );
}