import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import HomeImageEditor from "./components/HomeImageEditor";

export const metadata: Metadata = {
  title: "Jayden Brown Studio | 도동산방 돌스냅 · 고희연 · 웨딩 스냅",
  description:
    "울산 도동산방 전문 스냅 촬영 스튜디오. 돌스냅, 고희연, 웨딩 스냅을 담당합니다.",
};

async function getHomeImage() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "home_image")
      .single();
    return data?.value || "/img/001.jpg";
  } catch {
    return "/img/001.jpg";
  }
}

export default async function HomePage() {
  const homeImage = await getHomeImage();

  return (
    <main className="bg-[#f7f5f2] text-[#111111]">
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-6 md:px-10 md:pb-24 md:pt-20">
        <div className="grid items-center gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
          <div className="order-2 md:order-1">
            <p className="mb-4 text-[11px] uppercase tracking-[0.32em] text-black/30">
              Jayden Brown Studio
            </p>

            <h1 className="text-[1.35rem] font-medium leading-[1.5] tracking-[-0.01em] text-black/80 md:text-[2rem] md:leading-[1.45]">
              &ldquo;누군가에게 선물이 될 순간,
              <br />
              행복하길 바라며 셔터를 누릅니다.&rdquo;
            </h1>

            <div className="mt-7 max-w-xl space-y-5 text-[13.5px] font-normal leading-[1.85] text-black/50 md:text-[15px] md:leading-[1.95]">
              <p>
                주인공에게 가장 큰 선물은
                <br />
                그날, 모두가 함께 행복했다는 기억입니다.
              </p>
              <p>
                그래서 예뻐 보이려 애쓰기보다
                <br />
                그저, 그 순간을 편안하게 느껴주세요.
              </p>
              <p>
                행복은 애써 만들어내는 것이 아니라,
                <br />
                그 사람이 곁에 있다는 것만으로도
                <br />
                충분히 시작되고 있으니까요.
              </p>
              <p className="font-medium text-black/60">
                당신이 행복하다면,
                <br />
                그것이 진정한 선물이 됩니다.
              </p>
              <p className="font-medium text-black/60">
                저는 그 순간을, 있는 그대로 담습니다.
                <br />
                오늘이, 주인공에게 진짜 선물이 될 수 있도록.
              </p>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <HomeImageEditor initialImage={homeImage} />
          </div>
        </div>
      </section>
    </main>
  );
}
