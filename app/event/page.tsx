import type { Metadata } from "next";
import Image from "next/image";
import EventContact from "./EventContact";

/* ──────────────────────────────────────────────
   이벤트 페이지 설정 — 문구/금액은 여기만 고치면 됩니다.
   ────────────────────────────────────────────── */
const EVENT = {
  studioName: "연후 self",
  phone: "01020750119",
  // 기간을 두고 싶으면 "2026. 08. 01 ~ 08. 31" 처럼 적고, 상시라면 "" 로 두세요.
  period: "",
};

/* 링크 미리보기(카톡·문자)에는 이 한 줄만 나오게 합니다.
   description을 빈 값으로 두는 것은 상위 layout의 긴 설명이 상속되는 걸 막기 위함입니다. */
const PREVIEW_TEXT = "제이든브라운스튜디오 입니다.";

export const metadata: Metadata = {
  title: PREVIEW_TEXT,
  description: "",
  openGraph: {
    title: PREVIEW_TEXT,
    images: [{ url: "/img/event/family.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: PREVIEW_TEXT,
    images: ["/img/event/family.jpg"],
  },
  robots: { index: false, follow: false },
};

/* 셀프 촬영인데 결과물은 작가 촬영과 동일 — 이 페이지의 핵심 메시지 */
const SELF_POINTS = [
  {
    title: "작가 촬영과 동일한 퀄리티",
    desc: "모든 촬영은 플래그십 카메라(NIKON Z9)로 진행되어\n최상의 화질을 보장합니다.",
  },
  {
    title: "거울 보듯 편안하게",
    desc: "직접 보면서 편안하게 촬영하실 수 있도록 세팅되어 있습니다.\n가벼운 마음으로 오셔서 즐겁게 촬영하세요.",
  },
  {
    title: "연후만의 색감으로 보정",
    desc: "촬영된 모든 사진은 연후만의 색감을 입혀\n원본 사이즈 그대로 제공됩니다.",
  },
];

const INCLUDED = [
  {
    title: "촬영된 모든 사진, 원본 파일 제공",
    desc: "원본 제공에 따른 별도 비용은 없습니다.\n인화할 수 없는 작은 사이즈가 아닌, 원본 사이즈 그대로 드립니다.",
  },
  {
    title: "보정본 4장 (피부 · 라인 · 배경 정리)",
    desc: "보정본은 4컷 분할 편집본과 흑백으로 함께 제공됩니다.",
  },
  {
    title: "촬영 소품 제공",
    desc: "다양한 의자, 대형 인형, 헤어 액세서리, 부케 등",
  },
];

const OPTIONS = [
  {
    title: "인원 추가",
    price: "5인부터 1인당 10,000원",
    desc: "2인 6만원 / 3인 9만원 / 4인 12만원 / 5인 13만원 / 6인 14만원 …\n반려견, 반려묘도 인원에 포함됩니다.",
  },
  {
    title: "시간 추가",
    price: "10분 20,000원",
    desc: "당일 시간 추가는 어려울 수 있습니다. 예약 시 미리 신청해주세요.",
  },
  { title: "보정 추가", price: "1장 2,000원", desc: "" },
  {
    title: "의상 대여",
    price: "1벌 5,000원",
    desc: "셀프웨딩드레스, 학사가운, 학사모 등",
  },
];

/* 대표 이미지(family.jpg)와 겹치지 않도록 나머지 3장 */
const GALLERY = [
  { src: "/img/event/maternity.jpg", alt: "만삭 스튜디오 촬영" },
  { src: "/img/event/family-3gen.jpg", alt: "3대 가족사진 스튜디오 촬영" },
  { src: "/img/event/grandparents.jpg", alt: "부모님 · 손주 가족사진 스튜디오 촬영" },
];

export default function EventPage() {
  return (
    <main className="min-h-screen bg-[#efece7] px-4 py-8 md:px-6 md:py-16">
      {/* 팝업 느낌의 단독 카드 */}
      <div className="mx-auto max-w-[560px] overflow-hidden rounded-[26px] bg-[#f7f5f2] shadow-[0_10px_50px_rgba(0,0,0,0.07)]">

        {/* ── 인사말 ── */}
        <section className="px-7 pt-12 md:px-10 md:pt-14">
          <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-black/30">
            Self Studio
          </p>
          <h1 className="text-[1.45rem] font-light leading-[1.55] tracking-[-0.02em] text-black/80 md:text-[1.85rem]">
            거울 보듯 편안하게,
            <br />
            <span className="font-medium">작가 촬영과 동일한 퀄리티</span>로.
          </h1>

          <div className="mt-8 space-y-5 text-[14px] leading-[2] text-black/50 md:text-[15px]">
            <p>
              안녕하세요, 제이든 브라운입니다.
              <br />
              지난 촬영에서 뵈었던 분들께
              <br />
              오랜만에 인사드립니다.
            </p>
            <p>
              그동안 스냅 촬영이 바빠
              <br />
              따로 알려드릴 겨를이 없었는데,
              <br />
              <span className="text-black/65">직접 촬영하시는 셀프 스튜디오 &lsquo;연후&rsquo;</span>를
              <br />
              10년 전부터 운영해오고 있습니다.
            </p>
            <p>
              셀프라고 해서 사진이 아쉬워지지는 않습니다.
              <br />
              카메라와 조명, 세팅은 작가 촬영과 똑같이 두고
              <br />
              셔터만 직접 누르시는 것이라
              <br />
              <span className="text-black/65">결과물은 작가 촬영과 동일한 퀄리티</span>입니다.
            </p>
            <p>
              가족사진, 만삭, 부모님 사진처럼
              <br />
              날을 잡지 않으면 계속 미뤄지는 사진들.
              <br />
              부담 없이 오실 수 있도록 준비해두었으니
              <br />
              필요하실 때 편하게 찾아주세요.
            </p>
          </div>
        </section>

        {/* ── 대표 이미지 ── */}
        <div className="mt-10 px-7 md:px-10">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-black/5">
            <Image
              src="/img/event/family.jpg"
              alt="가족사진 스튜디오 촬영"
              fill
              sizes="(max-width: 560px) 100vw, 560px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* ── 셀프인데 퀄리티는 동일 (핵심) ── */}
        <section className="mt-12 px-7 md:px-10">
          <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-black/30">Why Self</p>

          <div className="space-y-3">
            {SELF_POINTS.map((p, i) => (
              <div key={p.title} className="rounded-2xl bg-black/[0.035] px-5 py-5">
                <div className="flex items-baseline gap-3">
                  <span className="text-[11px] font-semibold tracking-[0.1em] text-black/25">
                    0{i + 1}
                  </span>
                  <p className="text-[14.5px] font-medium leading-[1.6] text-black/75 md:text-[15px]">
                    {p.title}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-line pl-[26px] text-[13px] leading-[1.95] text-black/45 md:text-[13.5px]">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 가격 ── */}
        <section className="mt-12 px-7 md:px-10">
          <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-black/30">Price</p>

          <div className="rounded-2xl border border-black/8 bg-white px-6 py-7 text-center">
            <p className="text-[1.35rem] font-medium tracking-[-0.02em] text-black/80 md:text-[1.5rem]">
              1인 30,000원
            </p>
            <p className="mt-2.5 text-[13px] leading-[1.9] text-black/45 md:text-[13.5px]">
              20분 촬영 / 최소 2인 이상
            </p>
          </div>

          <div className="mt-8 space-y-7">
            {INCLUDED.map((item) => (
              <div key={item.title}>
                <p className="text-[14.5px] font-medium leading-[1.7] text-black/75 md:text-[15px]">
                  {item.title}
                </p>
                <p className="mt-2 whitespace-pre-line text-[13px] leading-[1.95] text-black/45 md:text-[13.5px]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 추가 옵션 ── */}
        <section className="mt-12 px-7 md:px-10">
          <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-black/30">Option</p>

          <div className="divide-y divide-black/6 overflow-hidden rounded-2xl border border-black/8">
            {OPTIONS.map((opt) => (
              <div key={opt.title} className="px-5 py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-[14px] font-medium text-black/75 md:text-[14.5px]">
                    {opt.title}
                  </p>
                  <p className="shrink-0 text-[13.5px] text-black/60 md:text-[14px]">
                    {opt.price}
                  </p>
                </div>
                {opt.desc && (
                  <p className="mt-2 whitespace-pre-line text-[12.5px] leading-[1.9] text-black/40 md:text-[13px]">
                    {opt.desc}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── 샘플 ── */}
        <section className="mt-12 px-7 md:px-10">
          <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-black/30">Sample</p>

          <div className="grid grid-cols-3 gap-2">
            {GALLERY.map((img) => (
              <div
                key={img.src}
                className="relative aspect-[4/5] overflow-hidden rounded-xl bg-black/5"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 560px) 33vw, 180px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <p className="mt-5 text-[12.5px] leading-[1.9] text-black/35 md:text-[13px]">
            가족사진 · 만삭 · 3대 가족 · 부모님 사진
            <br />
            돌 이후의 성장 기록도 함께 남기실 수 있습니다.
          </p>

          {/* 맺음말 */}
          <div className="mt-10 border-t border-black/8 pt-9 text-[13.5px] leading-[2] text-black/50 md:text-[14px]">
            <p>
              연후를 시작한 지 10년이 조금 넘어갑니다.
              <br />
              늘 그랬듯 제 바람은,
              <br />
              <span className="font-medium text-black/65">사진을 담는 시간이 행복했으면 합니다.</span>
            </p>
          </div>
        </section>

        {/* ── 문의 ── */}
        <section className="mt-12 px-7 pb-12 md:px-10 md:pb-14">
          <div className="border-t border-black/8 pt-10">
            <p className="text-[14.5px] font-medium text-black/75 md:text-[15px]">
              예약 및 문의
            </p>
            <p className="mt-2.5 text-[13px] leading-[1.95] text-black/45 md:text-[13.5px]">
              문의 주시면 안내 직원분이
              <br />
              친절하게 상담드립니다.
              <br />
              촬영 인원과 희망 날짜, 시간을 남겨주시면
              <br />
              가능 여부를 확인해 안내드리겠습니다.
            </p>

            <div className="mt-7">
              <EventContact phone={EVENT.phone} />
            </div>

            <p className="mt-6 text-center text-[12.5px] text-black/35">
              {EVENT.studioName}
            </p>

            {EVENT.period && (
              <p className="mt-2 text-center text-[12.5px] text-black/35">
                안내 기간 {EVENT.period}
              </p>
            )}

            <p className="mt-10 text-center text-[11px] uppercase tracking-[0.28em] text-black/20">
              © Jayden Brown
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
