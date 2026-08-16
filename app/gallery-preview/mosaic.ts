import type { Shot } from "./page";

/* 썸네일 리듬 만들기.

   Safari 는 CSS 다단(columns)에서 높이 계산이 어긋나 레이아웃이 깨진다.
   그래서 '한 줄 안에서는 같은 비율' 을 지키는 행 단위 모자이크로 구성한다.
   행마다 1장(크게) 또는 2장(작게)을 배치하고, 가로 사진과 세로 사진을 번갈아 써서
   크기·방향이 섞인 인상을 만든다. 순서는 인덱스로 정해지므로 서버·클라이언트가 항상 같다. */

export type Row = { ratio: string; items: Shot[] };

const isLandscape = (s: Shot) => (s.iw && s.ih ? s.iw / s.ih > 1.15 : false);

/* 행 템플릿 — L=가로, P=세로, 숫자는 한 행에 넣을 장수 */
const TEMPLATE: { kind: "L" | "P"; count: 1 | 2; ratio: string }[] = [
  { kind: "L", count: 1, ratio: "3/2" },   // 가로 한 장 크게
  { kind: "P", count: 2, ratio: "3/4" },   // 세로 두 장
  { kind: "L", count: 2, ratio: "4/3" },   // 가로 두 장
  { kind: "P", count: 1, ratio: "4/5" },   // 세로 한 장 크게
  { kind: "L", count: 1, ratio: "16/9" },  // 가로 파노라마
  { kind: "P", count: 2, ratio: "3/4" },
  { kind: "L", count: 2, ratio: "1/1" },   // 가로를 정사각으로 잘라 리듬 변화
];

export function buildRows(shots: Shot[]): Row[] {
  const L = shots.filter(isLandscape);
  const P = shots.filter((s) => !isLandscape(s));
  const rows: Row[] = [];
  let li = 0;
  let pi = 0;
  let t = 0;

  while (li < L.length || pi < P.length) {
    const tpl = TEMPLATE[t % TEMPLATE.length];
    t++;

    // 원하는 종류가 비었으면 남은 쪽으로 대체한다
    const wantL = tpl.kind === "L" ? li < L.length : pi >= P.length;
    const src = wantL ? L : P;
    const idx = wantL ? li : pi;
    const take = Math.min(tpl.count, src.length - idx);
    if (take <= 0) continue;

    const items = src.slice(idx, idx + take);
    if (wantL) li += take;
    else pi += take;

    // 한 장만 남아 2장 행이 안 되면 크게 보여준다
    let ratio = tpl.ratio;
    if (tpl.count === 2 && take === 1) ratio = wantL ? "3/2" : "4/5";
    rows.push({ ratio, items });
  }
  return rows;
}
