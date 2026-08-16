import GalleryDior from "../portfolio/_gallery/GalleryDior";
import { getStories, getIntro, getTracks } from "../portfolio/_gallery/data";

/* 갤러리 디자인 시험용 경로 — 실제 갤러리는 /portfolio 이고, 여기서 먼저 손본 뒤 반영한다. */
export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery — preview", robots: { index: false, follow: false } };

export default async function GalleryPreviewPage() {
  const [stories, intro] = await Promise.all([getStories(), getIntro()]);
  return <GalleryDior stories={stories} intro={intro} tracks={getTracks()} />;
}
