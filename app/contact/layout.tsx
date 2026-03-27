import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "촬영 문의 | Jayden Brown Studio",
  description: "도동산방 돌스냅, 고희연, 웨딩 스냅 촬영 문의.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
