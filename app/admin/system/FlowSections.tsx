import Link from "next/link";
import { STEPS, DAEMONS, TODO, INFRA, type Actor } from "./flowData";
import StepMap from "./StepMap";
import PathChips from "./PathChips";
import { readFolderStats } from "./folders";

const ACTOR_STYLE: Record<Actor, string> = {
  자동: "bg-[#0f7a37] text-white",
  수동: "bg-black/[0.07] text-black/55",
  고객: "bg-[#1f5f9b] text-white",
  감시: "bg-[#b45309] text-white",
};

/* 작업 순서 · 상시 자동화 · 미자동화 · 시스템 구성 · 바로가기 (읽기 전용 정리 화면) */
export default function FlowSections() {
  return (
    <>
        <StepMap />

        {/* ── 작업 흐름 ── */}
        <section className="mt-16">
          <h2 className="text-[1.05rem] font-medium text-black/75">작업 순서</h2>
          <div className="mt-5 space-y-3">
            {STEPS.map((s) => (
              <div
                key={s.no}
                id={`step-${s.no}`}
                className="scroll-mt-6 rounded-2xl border border-black/10 bg-white px-5 py-5"
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-[12px] font-semibold tracking-[0.06em] text-black/25">
                    {String(s.no).padStart(2, "0")}
                  </span>
                  <h3 className="text-[15.5px] font-medium text-black/80">{s.title}</h3>
                </div>
                <p className="mt-2 pl-[30px] text-[13px] leading-[1.8] text-black/45">{s.desc}</p>

                <ul className="mt-3.5 space-y-2 pl-[30px]">
                  {s.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span
                        className={`mt-[2px] shrink-0 rounded-full px-2 py-[3px] text-[10.5px] ${ACTOR_STYLE[it.actor]}`}
                      >
                        {it.actor}
                      </span>
                      <span className="text-[13px] leading-[1.75] text-black/65">{it.text}</span>
                    </li>
                  ))}
                </ul>

                {(s.where || s.code) && (
                  <div className="mt-4 space-y-1 pl-[30px] text-[11.5px] leading-[1.7] text-black/30">
                    {s.where && <p>위치 · {s.where}</p>}
                    {s.code && <p>코드 · {s.code}</p>}
                  </div>
                )}

                {s.folders && <PathChips paths={s.folders} />}

                {s.warn && (
                  <p className="mt-3.5 ml-[30px] rounded-xl bg-[#fdf3e7] px-4 py-3 text-[12.5px] leading-[1.8] text-[#8a5a1a]">
                    {s.warn}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── 원본·작업 폴더 지도 ── */}
        <section className="mt-16">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[1.05rem] font-medium text-black/75">사진 원본 · 작업 폴더</h2>
            <p className="text-[12px] text-black/35">개수는 지금 실제 폴더를 읽은 값</p>
          </div>
          <p className="mt-2 text-[13px] leading-[1.85] text-black/45">
            원본이 어디로 들어와서 어디로 옮겨지는지, 각 폴더가 무슨 역할인지 정리했습니다.
          </p>

          <div className="mt-5 space-y-2.5">
            {readFolderStats().map((f) => (
              <div key={f.path} className="rounded-2xl border border-black/10 bg-white px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[14.5px] font-medium text-black/75">{f.name}</h3>
                  <span className="shrink-0 text-[12px] text-black/40">
                    {f.dirs === null ? (
                      <span className="text-[#9b2c2c]">읽기 실패</span>
                    ) : (
                      <>
                        {f.dirs}개 폴더
                        {f.files ? ` · 파일 ${f.files}` : ""}
                      </>
                    )}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-[1.8] text-black/55">{f.role}</p>
                {f.rule && (
                  <p className="mt-1.5 text-[12.5px] leading-[1.75] text-black/40">{f.rule}</p>
                )}
                {f.latest && (
                  <p className="mt-1.5 text-[11.5px] text-black/30">최근 · {f.latest}</p>
                )}
                <div className="-ml-[30px]">
                  <PathChips paths={[f.path]} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 상시 자동화 ── */}
        <section className="mt-16">
          <h2 className="text-[1.05rem] font-medium text-black/75">상시 돌아가는 자동화</h2>
          <p className="mt-2 text-[13px] text-black/45">단계와 무관하게 항상 동작합니다.</p>
          <div className="mt-5 space-y-2.5">
            {DAEMONS.map((d) => (
              <div key={d.name} className="rounded-2xl border border-black/10 bg-white px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[14.5px] font-medium text-black/75">{d.name}</h3>
                  <span className="shrink-0 rounded-full bg-[#0f7a37] px-2.5 py-1 text-[11px] text-white">
                    {d.cycle}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-[1.8] text-black/55">{d.what}</p>
                <p className="mt-2 text-[12px] leading-[1.7] text-black/35">문제 생기면 · {d.fail}</p>
                <p className="mt-1 text-[11.5px] text-black/25">{d.where}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 아직 안 된 것 ── */}
        <section className="mt-16">
          <h2 className="text-[1.05rem] font-medium text-black/75">아직 자동화 안 된 것</h2>
          <div className="mt-5 space-y-2.5">
            {TODO.map((t) => (
              <div key={t.text} className="rounded-2xl bg-black/[0.035] px-5 py-4">
                <p className="text-[14px] font-medium text-black/70">{t.text}</p>
                <p className="mt-1.5 text-[12.5px] leading-[1.8] text-black/45">{t.why}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 시스템 구성 ── */}
        <section className="mt-16">
          <h2 className="text-[1.05rem] font-medium text-black/75">시스템 구성</h2>
          <div className="mt-5 divide-y divide-black/[0.07] overflow-hidden rounded-2xl border border-black/10 bg-white">
            {INFRA.map((i) => (
              <div key={i.name} className="px-5 py-3.5">
                <p className="text-[13.5px] font-medium text-black/70">{i.name}</p>
                <p className="mt-1 text-[12px] leading-[1.7] text-black/40">{i.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 바로가기 */}
        <section className="mt-16">
          <h2 className="text-[1.05rem] font-medium text-black/75">바로가기</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { href: "/admin/booking", label: "예약 관리" },
              { href: "/admin/orders", label: "주문 관리" },
              { href: "/admin/sms", label: "안내 문자 발송" },
              { href: "/admin/deposits", label: "입금 확인" },
              { href: "https://select.jaydenbrown.kr/admin", label: "셀렉 앱 (PhotoForge)" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full border border-black/12 bg-white px-4 py-2 text-[13px] text-black/60 transition hover:border-black/30"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </section>

    </>
  );
}
