import { STEPS } from "./flowData";

/* 12단계 한눈에 보기 — 카드를 누르면 아래 해당 단계 설명으로 이동한다.
   막대는 그 단계에서 자동으로 처리되는 비중이다. */
export default function StepMap() {
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[1.05rem] font-medium text-black/75">한눈에 보기</h2>
        <p className="text-[12px] text-black/35">카드를 누르면 해당 단계로 이동</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {STEPS.map((s) => {
          const auto = s.items.filter((i) => i.actor === "자동" || i.actor === "감시").length;
          const manual = s.items.filter((i) => i.actor === "수동").length;
          const guest = s.items.filter((i) => i.actor === "고객").length;
          const pct = Math.round((auto / Math.max(1, s.items.length)) * 100);
          const fullyAuto = manual === 0 && guest === 0;

          return (
            <a
              key={s.no}
              href={`#step-${s.no}`}
              className="rounded-xl border border-black/10 bg-white px-3.5 py-3 transition hover:border-black/30 hover:shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10.5px] font-semibold tracking-[0.08em] text-black/25">
                  {String(s.no).padStart(2, "0")}
                </span>
                {fullyAuto && (
                  <span className="rounded-full bg-[#0f7a37] px-1.5 py-[1px] text-[9.5px] text-white">
                    전자동
                  </span>
                )}
                {!fullyAuto && manual > 0 && auto === 0 && (
                  <span className="rounded-full bg-black/[0.07] px-1.5 py-[1px] text-[9.5px] text-black/45">
                    수동
                  </span>
                )}
              </div>

              <p className="mt-1 text-[13px] font-medium leading-[1.45] text-black/75">{s.title}</p>

              <div className="mt-2.5 flex h-[3px] overflow-hidden rounded-full bg-black/[0.08]">
                <div className="bg-[#0f7a37]" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 text-[10.5px] text-black/30">
                자동 {auto}
                {manual ? ` · 수동 ${manual}` : ""}
                {guest ? ` · 고객 ${guest}` : ""}
              </p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
