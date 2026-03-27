"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/isAdmin";
import { useParams, useRouter } from "next/navigation";

type GalleryImage = { id: string; image_url: string };
type GalleryPost = { id: string; title: string; slug: string; cover_image: string | null };

function getStoragePathFromUrl(url: string) {
  const marker = "/storage/v1/object/public/gallery/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.substring(idx + marker.length));
}

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [post, setPost] = useState<GalleryPost | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [allPosts, setAllPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAdmin(isAdmin(session?.user?.email)));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setAdmin(isAdmin(session?.user?.email)));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: postData, error: postError }, { data: postsData }] = await Promise.all([
        supabase.from("gallery_posts").select("id, title, slug, cover_image").eq("slug", slug).single(),
        supabase.from("gallery_posts").select("id, title, slug, cover_image").not("cover_image", "is", null).order("created_at", { ascending: false }),
      ]);
      if (postError || !postData) { setErrorMessage(postError?.message ?? "포스트를 찾을 수 없습니다."); setLoading(false); return; }
      setPost(postData);
      setAllPosts(postsData ?? []);
      const { data: imageData, error: imageError } = await supabase.from("gallery_images").select("id, image_url").eq("post_id", postData.id).order("sort_order", { ascending: true }).order("created_at", { ascending: true });
      if (imageError) { setErrorMessage(imageError.message); setLoading(false); return; }
      setImages(imageData ?? []);
      setLoading(false);
    };
    fetchData();
  }, [slug]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => { setCurrentIndex(Math.round(container.scrollTop / container.clientHeight)); };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [images]);

  const handleDeletePost = async () => {
    if (!post) return;
    if (!confirm("이 갤러리를 삭제하시겠습니까? 모든 이미지가 삭제됩니다.")) return;
    setDeleting(true);
    try {
      const { data: imgs } = await supabase.from("gallery_images").select("id, image_url").eq("post_id", post.id);
      if (imgs) {
        const paths = imgs.map((i) => getStoragePathFromUrl(i.image_url)).filter(Boolean) as string[];
        if (paths.length > 0) await supabase.storage.from("gallery").remove(paths);
        await supabase.from("gallery_images").delete().eq("post_id", post.id);
      }
      await supabase.from("gallery_posts").delete().eq("id", post.id);
      router.push("/portfolio");
    } catch (err: any) { alert("삭제 실패: " + err.message); } finally { setDeleting(false); }
  };

  if (loading) return <main className="fixed inset-0 bg-black flex items-center justify-center"><p className="text-sm text-white/60">불러오는 중...</p></main>;
  if (errorMessage) return <main className="fixed inset-0 bg-black flex items-center justify-center px-6"><p className="text-sm text-red-400">{errorMessage}</p></main>;

  return (
    <>
      <main ref={containerRef} className="gallery-detail gallery-detail-page gallery-detail-vertical" style={{ position: "fixed", inset: 0 }}>
        {/* 상단 헤더 */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 30, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 70%, transparent 100%)" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.95)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>Jayden Brown</span>
          <button onClick={() => setMenuOpen(true)} style={{ display: "flex", flexDirection: "column", gap: "5px", padding: "8px", cursor: "pointer", background: "none", border: "none" }} aria-label="메뉴 열기">
            {[0,1,2].map((i) => <span key={i} style={{ display: "block", width: "22px", height: "1.5px", background: "rgba(255,255,255,0.9)", borderRadius: "2px" }} />)}
          </button>
        </div>

        {/* 이미지 섹션 */}
        {images.length === 0 ? (
          <section className="gallery-detail-section flex h-screen items-center justify-center"><p className="text-sm text-white/50">이미지가 없습니다.</p></section>
        ) : (
          images.map((img) => (
            <section key={img.id} className="gallery-detail-section snap-start snap-always">
              <div className="gallery-detail-image-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt={post?.title || ""} className="gallery-detail-image gallery-detail-image-loaded" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
            </section>
          ))
        )}

        {/* 하단: 관리자 버튼 + 썸네일 */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, padding: admin ? "12px 14px 28px" : "20px 14px 28px", background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 70%, transparent 100%)" }}>
          {/* 관리자 버튼 */}
          {admin && post && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <Link href={`/admin/gallery/edit/${post.slug}`} style={{ display: "inline-flex", alignItems: "center", height: "36px", padding: "0 16px", borderRadius: "18px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", color: "#fff", fontSize: "13px", fontWeight: 500, border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none" }}>
                수정
              </Link>
              <button type="button" onClick={handleDeletePost} disabled={deleting} style={{ display: "inline-flex", alignItems: "center", height: "36px", padding: "0 16px", borderRadius: "18px", background: "rgba(220,38,38,0.7)", backdropFilter: "blur(10px)", color: "#fff", fontSize: "13px", fontWeight: 500, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", opacity: deleting ? 0.5 : 1 }}>
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          )}

          {/* 썸네일 */}
          {allPosts.length > 0 && (
            <div style={{ display: "flex", gap: "6px", overflowX: "auto", scrollbarWidth: "none" }}>
              {allPosts.map((p) => (
                <Link key={p.id} href={`/portfolio/${p.slug}`} style={{ flexShrink: 0, width: "48px", height: "60px", borderRadius: "8px", overflow: "hidden", border: p.slug === slug ? "2px solid rgba(255,255,255,0.9)" : "2px solid rgba(255,255,255,0.15)", opacity: p.slug === slug ? 1 : 0.55, transition: "all 0.2s ease" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.cover_image!} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 슬라이드인 메뉴 */}
      <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)", opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? "auto" : "none", transition: "opacity 0.25s ease" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 50, width: "80%", maxWidth: "320px", background: "#111", transform: menuOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 0.28s ease", padding: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {[{ href: "/", label: "Home" }, { href: "/portfolio", label: "Gallery" }, { href: "/about", label: "About" }, { href: "/guide", label: "Guide" }, { href: "/contact", label: "Contact" }].map((menu) => (
            <Link key={menu.href} href={menu.href} onClick={() => setMenuOpen(false)} style={{ color: "#fff", fontSize: "16px" }}>{menu.label}</Link>
          ))}
        </div>
      </div>
    </>
  );
}
