import type { Metadata } from "next";
import GalleryDior from "./_gallery/GalleryDior";
import { getStories, getIntro, getTracks } from "./_gallery/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Gallery | Jayden Brown Studio",
  description:
    "울산 도동산방 돌스냅 · 고희연 · 웨딩 스냅 갤러리. 행복이 머문 시간을 사진 속에 그대로 담았습니다.",
  openGraph: {
    title: "Gallery | Jayden Brown Studio",
    description: "도동산방 돌스냅 · 고희연 · 웨딩 스냅 갤러리",
  },
};

export default async function PortfolioPage() {
  const [stories, intro] = await Promise.all([getStories(), getIntro()]);
  return <GalleryDior stories={stories} intro={intro} tracks={getTracks()} />;
}
