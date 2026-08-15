/* 인물 위치 기반 크롭 계산.

   Vision 으로 미리 검출해 둔 '인물 합집합 박스'(정규화 좌표)를 받아,
   슬롯 종횡비에 맞춰 object-position 을 정한다. 원칙은 두 가지다.
     ① 검출된 사람이 모두 화면에 들어오게 (여백 MARGIN 확보)
     ② 사람이 한쪽으로 치우쳐 있으면 구도도 그쪽으로 살짝 더 치우치게
   모두 담을 수 없을 만큼 넓게 퍼져 있으면 인물 중심에 맞춘다. */

export type Focus = {
  x0: number; y0: number; x1: number; y1: number;
  n: number; src: string;
  iw: number; ih: number;
};

const MARGIN = 0.045; // 인물과 화면 끝 사이 최소 여백(이미지 크기 기준 비율)
const BIAS = 0.3; // 치우친 쪽으로 추가 이동 강도

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** ratio 예: "3/4" (가로/세로) */
export function focalPosition(f: Focus | undefined, ratio: string): string {
  if (!f || !f.iw || !f.ih) return "50% 50%";
  const [rw, rh] = ratio.split("/").map(Number);
  if (!rw || !rh) return "50% 50%";

  const containerAspect = rw / rh;
  const imageAspect = f.iw / f.ih;

  // 잘리는 축을 정한다. 이미지가 더 넓으면 좌우가, 더 좁으면 위아래가 잘린다.
  const horizontal = imageAspect > containerAspect;
  const v = horizontal ? containerAspect / imageAspect : imageAspect / containerAspect; // 보이는 비율
  if (v >= 0.999) return "50% 50%"; // 잘림 없음

  const a0 = horizontal ? f.x0 : f.y0;
  const a1 = horizontal ? f.x1 : f.y1;
  const c = (a0 + a1) / 2;

  // 인물 전체가 들어오는 위치 구간
  let lo = (a1 + MARGIN - v) / (1 - v);
  let hi = (a0 - MARGIN) / (1 - v);
  if (lo > hi) {
    // 다 담을 수 없다 → 인물 중심 맞춤
    const centered = clamp01((c - v / 2) / (1 - v));
    return horizontal ? `${(centered * 100).toFixed(1)}% 50%` : `50% ${(centered * 100).toFixed(1)}%`;
  }
  lo = clamp01(lo);
  hi = clamp01(hi);

  // 인물을 가운데 두는 위치에서 치우친 쪽으로 조금 더 이동
  const centered = (c - v / 2) / (1 - v);
  const biased = centered + (c - 0.5) * BIAS;
  const pos = clamp01(Math.max(lo, Math.min(hi, biased)));

  // 세로 방향은 얼굴이 위쪽에 오도록 살짝 위를 남긴다(인물 사진 관례)
  return horizontal ? `${(pos * 100).toFixed(1)}% 42%` : `50% ${(pos * 100).toFixed(1)}%`;
}
