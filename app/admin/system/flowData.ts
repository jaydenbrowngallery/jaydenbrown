/* 촬영 업무 흐름 + 각 단계의 자동화 현황.
   내용을 바꾸려면 이 파일만 고치면 됩니다. (2026-08-14 기준) */

export type Actor = "자동" | "수동" | "고객" | "감시";

export type Step = {
  no: number;
  title: string;
  desc: string;
  items: { actor: Actor; text: string }[];
  where?: string; // 어디서 하는지 (화면/폴더)
  code?: string; // 관련 코드 위치
  folders?: string[]; // 실제 폴더 경로 (클릭하면 복사)
  warn?: string; // 주의점
};

export const STEPS: Step[] = [
  {
    no: 1,
    title: "신청서 접수",
    desc: "고객이 홈페이지 신청서를 제출하면 예약이 접수됩니다.",
    items: [
      { actor: "고객", text: "홈페이지 신청서 작성 (이름·연락처·날짜·입금자명)" },
      { actor: "자동", text: "접수 즉시 사장님께 문자 발송 — 링크 누르면 신청서 상세로 바로 이동" },
      { actor: "수동", text: "내용 확인 후 예약금 안내" },
    ],
    where: "/booking-private-jb2026 → /admin/booking",
    code: "app/api/booking/route.ts",
  },
  {
    no: 2,
    title: "예약금 입금 확인",
    desc: "예약금이 들어오면 예약이 확정되고 고객에게 확인 문자가 나갑니다.",
    items: [
      { actor: "자동", text: "신한 입금 문자를 90초 안에 감지 (구글 메시지 → 서버)" },
      { actor: "자동", text: "입금자명 + 금액이 맞으면 예약 상태를 '확정'으로 변경" },
      { actor: "자동", text: "고객에게 입금확인 문자 발송 (일시·장소 안내 포함)" },
      { actor: "감시", text: "3시간 넘게 입금 문자를 읽지 못하면 사장님께 경고 문자" },
    ],
    where: "구글 메시지(맥미니) → /admin/booking",
    code: "deposit-forward/forward.py → app/api/deposit-sms/route.ts",
    warn: "이름·금액이 애매하면 자동 확정하지 않고 넘어갑니다. 예약이 계속 '입금대기'면 입금자명을 확인해주세요.",
  },
  {
    no: 3,
    title: "촬영 전 안내",
    desc: "촬영 1주일 전 주의사항을 안내합니다.",
    items: [
      { actor: "수동", text: "촬영 관련 주의사항 문자 발송" },
    ],
    where: "/admin/booking",
    warn: "아직 자동화되지 않은 단계입니다. 촬영일 기준 자동 발송으로 만들 수 있습니다.",
  },
  {
    no: 4,
    title: "촬영 · 원본 정리",
    desc: "촬영 후 원본을 작업용 폴더에 넣습니다.",
    items: [
      { actor: "수동", text: "원본을 '구글동기화 원본/<날짜 이름 장소>/사진' 에 업로드" },
      { actor: "자동", text: "45일이 지난 촬영은 '원본백업' 으로 자동 이동" },
    ],
    where: "Promise Pegasus / 맥미니메인",
    warn: "원본이 이동되면 셀렉 프로젝트의 원본 링크가 끊깁니다. 추출 단계에서 자동으로 다시 연결하므로 조치는 필요 없습니다.",
    folders: [
      "/Volumes/Promise Pegasus/맥미니메인/구글동기화 원본",
      "/Volumes/Promise Pegasus/맥미니메인/원본백업",
    ],
  },
  {
    no: 5,
    title: "후반작업 완료",
    desc: "보정·편집이 끝나면 완료 처리하고 셀렉 프로젝트를 만듭니다.",
    items: [
      { actor: "수동", text: "작업완료 처리" },
      { actor: "자동", text: "PhotoForge 셀렉 프로젝트 생성 (프록시 이미지 자동 생성)" },
      { actor: "자동", text: "주문관리 목록에 등록" },
    ],
    where: "/admin/booking → select.jaydenbrown.kr/admin",
    code: "app/api/work-ready/route.ts",
    folders: [
      "/Volumes/Promise Pegasus/맥미니메인/구글동기화 작업본",
    ],
  },
  {
    no: 6,
    title: "촬영비 안내",
    desc: "사진이 준비되었음을 알리고 촬영비를 안내합니다.",
    items: [
      { actor: "수동", text: "PhotoForge에서 '💰 촬영비' 클릭 → 팝업에서 내용 확인 후 발송" },
      { actor: "자동", text: "스냅 43만원 / 기념촬영 220,000원 문구 자동 선택" },
      { actor: "자동", text: "폴드8 구글메시지로 발송, 실패 시 SOLAPI로 폴백" },
    ],
    where: "select.jaydenbrown.kr/admin",
    code: "PhotoForge server.py · sendShootingFee()",
  },
  {
    no: 7,
    title: "촬영비 입금 → 셀렉 링크",
    desc: "촬영비가 들어오면 셀렉 링크가 자동으로 발송됩니다.",
    items: [
      { actor: "자동", text: "입금 감지 → 이름·금액이 유일하게 일치하면 셀렉 링크 문자 자동 발송" },
      { actor: "자동", text: "문자에 원본 다운로드 링크 + 셀렉 링크 + 보관 안내 포함" },
      { actor: "수동", text: "애매한 건은 '확인 필요' 목록에서 직접 발송" },
    ],
    where: "select.jaydenbrown.kr/admin",
    code: "PhotoForge server.py · match_and_send() / build_sms()",
  },
  {
    no: 8,
    title: "고객 셀렉",
    desc: "고객이 앨범과 액자에 넣을 사진을 고릅니다.",
    items: [
      { actor: "고객", text: "앨범 기본 30장 (최대 60장, 초과분 장당 8,000원)" },
      { actor: "고객", text: "액자 기본 5x7 2개 (추가 개당 20,000원)" },
      { actor: "자동", text: "30장 초과 시 추가비용을 화면에 실시간 표시" },
      { actor: "자동", text: "60장에 도달하면 안내 팝업 + 빼는 방법 안내" },
    ],
    where: "select.jaydenbrown.kr/select/…",
    code: "PhotoForge server.py · CUSTOMER_HTML",
  },
  {
    no: 9,
    title: "추출",
    desc: "고객이 고른 사진의 원본을 작업 폴더로 뽑아냅니다.",
    items: [
      { actor: "수동", text: "'📦 추출' 클릭 (제출 완료된 건만 버튼이 보임)" },
      { actor: "자동", text: "원본 링크가 끊겼으면 '원본백업'에서 찾아 자동 재연결" },
      { actor: "자동", text: "앨범 순서대로 번호 매기기 + 액자 파일명에 사이즈·수량 표기" },
      { actor: "감시", text: "원본을 못 찾으면 추출을 중단하고 에러 표시 (빈 폴더로 넘어가지 않음)" },
    ],
    where: "작업할 사진 / <날짜 이름> 셀렉",
    code: "PhotoForge server.py · export_project()",
    folders: [
      "/Volumes/Promise Pegasus/작업할 사진",
    ],
  },
  {
    no: 10,
    title: "주소 확인 · 배송 준비",
    desc: "고객 주소를 확인받고 배송 자료를 만듭니다.",
    items: [
      { actor: "고객", text: "주소 확인 링크에서 배송지 확인" },
      { actor: "자동", text: "확인되면 배송 폴더로 파일 이동" },
      { actor: "자동", text: "택배 주문서(주문서.xlsx) 갱신" },
    ],
    where: "/confirm-address/… → PNP주문/제이든브라운",
    code: "app/api/confirm-address",
    folders: [
      "/Volumes/Promise Pegasus/맥미니메인/구글동기화 작업본/PNP주문/제이든브라운",
    ],
  },
  {
    no: 11,
    title: "발주 (PNP)",
    desc: "업체에 앨범·액자를 발주합니다.",
    items: [
      { actor: "수동", text: "업체 공유 폴더에 파일 업로드" },
      { actor: "수동", text: "업체 명세서와 우리 자료 대조 (인원·수량·금액)" },
    ],
    where: "구글동기화 작업본 / PNP주문 / 제이든브라운",
    warn: "발주가 끝난 파일을 정리하는 자동화가 없습니다. 업체 폴더에 예전 출고분이 남아 혼선이 생긴 적이 있습니다.",
    folders: [
      "/Volumes/Promise Pegasus/맥미니메인/구글동기화 작업본/PNP주문/제이든브라운/앨범",
      "/Volumes/Promise Pegasus/맥미니메인/구글동기화 작업본/PNP주문/제이든브라운/액자",
    ],
  },
  {
    no: 12,
    title: "출고 · 주문완료",
    desc: "배송이 나가면 주문완료로 넘깁니다.",
    items: [
      { actor: "수동", text: "주문완료 처리" },
      { actor: "자동", text: "주문관리 목록에서 '주문완료'로 이동" },
    ],
    where: "/admin/orders",
  },
];

/* 상시 돌아가는 자동화 (단계와 무관하게 항상 동작) */
export const DAEMONS: {
  name: string;
  what: string;
  cycle: string;
  fail: string;
  where: string;
}[] = [
  {
    name: "입금 문자 감지",
    what: "구글 메시지에서 신한 입금 문자를 읽어 서버로 전달 → 예약금/촬영비 자동 처리",
    cycle: "90초마다",
    fail: "읽기 연속 실패 또는 3시간 무응답 시 사장님께 문자",
    where: "맥미니 launchd · deposit-forward",
  },
  {
    name: "문자 발송",
    what: "모든 고객 문자를 폴드8 구글메시지로 발송 (실패 시 SOLAPI 폴백)",
    cycle: "요청 시",
    fail: "발송 실패는 화면에 즉시 표시",
    where: "맥미니 pm2 · gmsg-sender (:8100)",
  },
  {
    name: "원본 자동 재연결",
    what: "45일 지나 원본백업으로 옮겨진 촬영도 추출 시 자동으로 찾아 연결",
    cycle: "추출할 때",
    fail: "못 찾으면 추출 중단 + 목록에 ⚠️ 원본없음 표시",
    where: "PhotoForge",
  },
  {
    name: "구글 캘린더 동기화",
    what: "예약 일정과 캘린더를 맞춤",
    cycle: "매일 09:00 + 웹훅",
    fail: "동기화 실패는 서버 로그에 기록",
    where: "vercel.json cron · /api/calendar-sync",
  },
];

/* 아직 자동화되지 않은 것 / 다음에 손볼 것 */
export const TODO: { text: string; why: string }[] = [
  {
    text: "발주 완료 파일 자동 정리",
    why: "업체 폴더에 예전 출고분이 남아 업체가 혼선을 겪었습니다. 주문완료 시 '발주완료' 폴더로 자동 이동시키면 해결됩니다.",
  },
  {
    text: "촬영 1주일 전 안내 문자 자동화",
    why: "지금은 매번 수동 발송입니다. 촬영일 기준으로 자동 예약 발송이 가능합니다.",
  },
  {
    text: "예약 신청서에 문자 수신 동의 항목 추가",
    why: "이벤트·소식 안내를 합법적으로 보낼 명단이 쌓입니다. (지금은 6개월 내 고객만 가능)",
  },
];

/* 시스템 구성 — 무엇이 어디서 돌고 있는지 */
export const INFRA: { name: string; detail: string }[] = [
  { name: "홈페이지", detail: "jaydenbrown.kr · Next.js · 맥미니 pm2 'jaydenbrown' + Cloudflare 터널" },
  { name: "셀렉 앱", detail: "select.jaydenbrown.kr · Flask · 맥미니 pm2 'photoforge' (:8090)" },
  { name: "문자 발송기", detail: "맥미니 pm2 'gmsg-sender' (:8100) · 구글 메시지 웹 + 폴드8" },
  { name: "입금 감지", detail: "맥미니 launchd 'kr.jaydenbrown.depositforward' · 90초" },
  { name: "데이터", detail: "맥미니 SQLite ~/data/jaydenbrown.db (예약·주문) + PhotoForge projects/ (셀렉)" },
  { name: "저장소", detail: "Promise Pegasus 18TB · 구글동기화 원본 / 원본백업 / 작업할 사진 / PNP주문" },
];
