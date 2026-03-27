import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "제이든브라운 촬영신청서",
  description: "제이든 브라운 스튜디오 촬영 예약 신청서입니다.",
  openGraph: {
    title: "제이든브라운 촬영신청서",
    description: "제이든 브라운 스튜디오 촬영 예약 신청서입니다.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
