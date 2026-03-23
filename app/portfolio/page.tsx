"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/isAdmin";

type GalleryPost = { id: string; title: string; slug: string; cover_image: string | null; created_at: string; };

export default function PortfolioPage() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setAdmin(isAdmin(session?.user?.email)); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { setAdmin(isAdmin(session?.user?.email)); });
    supabase.from("gallery_posts").select("id,title,slug,cover_image,created_at").not("cover_image","is",null).order("created_at",{ascending:false}).then(({data})=>{setPosts(data??[]);setLoading(false);});
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (<main className="min-h-screen bg-[#f7f5f2] px-6 py-16"><div className="mx-auto max-w-7xl grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">{Array.from({length:8}).map((_,i)=>(<div key={i} className="aspect-[4/5] w-full animate-pulse rounded-sm bg-[#ece7e2]" />))}</div></main>);

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-12 md:px-10">
      <section className="mx-auto max-w-7xl">
        {admin && (<div className="mb-10"><Link href="/admin/gallery" className="inline-flex items-center rounded-full bg-black px-5 py-2.5 text-sm text-white">이미지 업로드</Link></div>)}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <p className="text-[13px] uppercase tracking-[0.3em] text-black/30 mb-4">Gallery</p>
            <p className="text-black/40 text-sm">준비 중입니다.</p>
            {admin && (<Link href="/admin/gallery" className="mt-6 inline-flex items-center rounded-full bg-black px-6 py-3 text-sm text-white">이미지 업로드하기</Link>)}
            <Link href="/contact" className="mt-4 inline-flex items-center rounded-full border border-black/20 px-6 py-3 text-sm text-black/60">촬영 문의하기</Link>
          </div>
        ) : (
          <><div className="mb-10"><p className="text-[11px] uppercase tracking-[0.32em] text-black/30">Gallery</p></div><div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">{posts.map((post)=>(<Link key={post.id} href={} className="group block"><div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-[#ece7e2]"><Image src={post.cover_image as string} alt={post.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" /></div><p className="mt-2 px-1 text-[12px] text-black/40 truncate">{post.title}</p></Link>))}</div></>
        )}
      </section>
    </main>
  );
}
