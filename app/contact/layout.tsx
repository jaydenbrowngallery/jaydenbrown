import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "제이든브라운 촬영문의",
  description: "제이든 브라운 스튜디오 촬영 문의 페이지입니다.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
