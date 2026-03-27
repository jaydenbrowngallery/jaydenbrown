import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

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
      {/* ── Hero Section ── */}
      <section className="mx-auto max-w-7xl px-6 pb-4 pt-6 md:px-10 md:pb-24 md:pt-20">
        <div className="grid items-center gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
          <div className="order-2 md:order-1">
            <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-black/30">
              Jayden Brown Studio
            </p>

            <h1 className="text-[1.5rem] font-light leading-[1.4] tracking-[-0.02em] text-black/80 md:text-[2.2rem]">
              &ldquo;누군가에게 선물이 될 순간,
              <br />
              행복하길 바라며 셔터를 누릅니다.&rdquo;
            </h1>

            <div className="mt-8 max-w-xl space-y-4 text-[13.5px] leading-[1.9] text-black/45 md:text-[15px] md:leading-[2]">
              <p>
                주인공에게 가장 큰 선물은
                <br className="hidden md:inline" /> 그날, 모두가 함께 행복했다는
                기억입니다.
              </p>
              <p>
                그래서 예뻐 보이려 애쓰기보다
                <br className="hidden md:inline" /> 그저, 그 순간을 편안하게
                느껴주세요.
              </p>
              <p>
                행복은 애써 만들어내는 것이 아니라,
                <br className="hidden md:inline" /> 그 사람이 곁에 있다는
                것만으로도
                <br className="hidden md:inline" /> 충분히 시작되고 있으니까요.
              </p>
              <p className="text-black/55">
                당신이 행복하다면, 그것이 진정한 선물이 됩니다.
              </p>
              <p className="text-black/55">
                저는 그 순간을, 있는 그대로 담습니다.
                <br />
                오늘이, 주인공에게 진짜 선물이 될 수 있도록.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/portfolio"
                className="inline-flex items-center rounded-full bg-black px-6 py-3 text-sm text-white transition hover:bg-black/80"
              >
                갤러리 보기
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full border border-black/20 px-6 py-3 text-sm text-black transition hover:bg-black/5"
              >
                촬영 문의
              </Link>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="overflow-hidden rounded-[24px] bg-[#ece7e1] shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:rounded-[30px]">
              <div
                className="aspect-[4/3] w-full bg-cover bg-center md:aspect-[4/5]"
                style={{ backgroundImage: `url('${homeImage}')` }}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
