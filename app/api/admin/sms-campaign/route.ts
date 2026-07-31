import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/isAdmin";
import { getGoogleAccessToken } from "@/lib/google-calendar";

/*
  셀프스튜디오 안내 문자 발송 대상 명단.

  - 구글 캘린더의 도동산방 촬영 일정에서 보호자명·연락처를 추출한다.
  - 정보통신망법상 '거래관계 예외'(직접 수집 + 동종 서비스 + 6개월 이내)에 맞춰
    기본 조회 기간을 최근 6개월로 둔다. months 파라미터로 조정 가능.
  - 발송 진행 상태는 site_settings에 `sms_campaign:<번호>` 키로 저장한다.
    (today_memo: / today_done: 과 같은 기존 키-값 패턴)
*/

const KEY_PREFIX = "sms_campaign:";

type Target = {
  phone: string;
  parent: string; // 문자 받는 사람(보호자)
  baby: string; // 촬영 주인공
  date: string; // 촬영일 YYYY-MM-DD
  title: string;
  status: "pending" | "sent" | "skipped";
  at?: string;
};

function stripTags(s: string) {
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** HTML 표 형식 설명에서 <th>라벨</th><td>값</td> 추출 */
function tableField(desc: string, label: string) {
  const re = new RegExp(`<th>\\s*${label}\\s*</th>\\s*<td>([\\s\\S]*?)</td>`, "i");
  const m = desc.match(re);
  return m ? stripTags(m[1]) : "";
}

/* 태그를 벗기면 줄바꿈이 사라져 값이 뒤 항목까지 물고 오므로,
   다음 라벨이 나오는 지점에서 자른다. */
const LABELS = "전화|연락처|입금자명|시간|장소|상태|입금액|이메일|촬영날짜|촬영자명|글쓴이|이름";

function cutAtLabel(v: string) {
  const cut = v.split(new RegExp(`\\s*(?:${LABELS})\\s*:`))[0] || "";
  return cut.replace(/[✅•·]/g, " ").replace(/\s+/g, " ").trim().slice(0, 20);
}

/* 신청서 항목이 한 칸에 붙어 오는 경우가 있어("박아름 스냅상품구성(웨딩…"),
   앞머리가 한글 이름이면 그 이름만 남긴다. */
function cleanPersonName(v: string) {
  const s = cutAtLabel(v);
  const m = s.match(/^([가-힣]{2,4})(?:\s|\(|$)/);
  return m ? m[1] : s;
}

/** "이름: 홍길동 / 전화: 010-.." 형식에서 값 추출 */
function plainField(desc: string, label: string) {
  const re = new RegExp(`${label}\\s*:\\s*([^/\\n<]+)`, "i");
  const m = stripTags(desc).match(re);
  return m ? cutAtLabel(m[1]) : "";
}

function normalizePhone(raw: string) {
  const d = (raw || "").replace(/[^0-9]/g, "");
  return /^01[016789]\d{7,8}$/.test(d) ? d : "";
}

/** "[확정] 1430 김율 도동산방" → "김율" */
function nameFromTitle(title: string) {
  return title
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b\d{3,4}\b/g, " ")
    .replace(/도동산방|셀프|스냅|촬영/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstName(s: string) {
  // "진서아. 진서호" / "진서아, 진서호" → 대표 한 명만
  return (s || "").split(/[,.·\/]/)[0].trim();
}

async function fetchTargets(months: number) {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - months);

  const token = await getGoogleAccessToken(
    "https://www.googleapis.com/auth/calendar.readonly"
  );
  const cal = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID!);
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${cal}/events` +
    `?timeMin=${from.toISOString()}&timeMax=${to.toISOString()}` +
    `&maxResults=2500&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`캘린더 조회 실패: ${res.status} ${await res.text()}`);
  const events = (await res.json()).items || [];

  // 번호 기준으로 합치고, 같은 번호는 가장 최근 촬영 건을 남긴다.
  const byPhone = new Map<string, Target>();

  for (const ev of events) {
    const title: string = ev.summary || "";
    const desc: string = ev.description || "";
    const date: string = (ev.start?.dateTime || ev.start?.date || "").slice(0, 10);
    if (!date) continue;

    // 셀프(연후) 예약은 제외 — 스냅 촬영 고객만 대상
    const isSnap = /도동산방/.test(title) || /돌스냅|돌잔치|스냅예약/.test(desc);
    if (!isSnap || /셀프/.test(title)) continue;

    const phone =
      normalizePhone(tableField(desc, "연락처")) ||
      normalizePhone(plainField(desc, "전화")) ||
      normalizePhone((title + " " + stripTags(desc)).match(/01[016789][-. ]?\d{3,4}[-. ]?\d{4}/)?.[0] || "");
    if (!phone) continue;

    /* 문자를 받는 사람은 보호자다.
       - 신청서(표) 형식: 글쓴이 = 보호자, 촬영자명 = 아기
       - 확정 메모 형식: 이름 = 아기, 입금자명 = 보호자 */
    const parent = cleanPersonName(
      tableField(desc, "글쓴이") || plainField(desc, "입금자명") || ""
    );
    const baby = cleanPersonName(
      firstName(tableField(desc, "촬영자명")) ||
        plainField(desc, "이름") ||
        nameFromTitle(title)
    );

    const prev = byPhone.get(phone);
    if (!prev || date > prev.date) {
      byPhone.set(phone, {
        phone,
        parent: (parent || "").trim(),
        baby: (baby || "").trim(),
        date,
        title: title.trim(),
        status: "pending",
      });
    }
  }

  // 오래된 촬영부터 보낸다. (6개월 기한을 먼저 넘기는 분들이 앞에 오도록)
  return Array.from(byPhone.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
}

async function loadProgress() {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("id, value")
    .like("id", `${KEY_PREFIX}%`);

  const map = new Map<string, { status: Target["status"]; at?: string }>();
  (data || []).forEach((row: { id: string; value: string | null }) => {
    const phone = row.id.slice(KEY_PREFIX.length);
    try {
      const v = JSON.parse(row.value || "{}");
      if (v?.status) map.set(phone, { status: v.status, at: v.at });
    } catch {
      if (row.value === "sent" || row.value === "skipped") {
        map.set(phone, { status: row.value });
      }
    }
  });
  return map;
}

export async function GET(req: NextRequest) {
  const { user } = await requireAdmin();
  if (!isAdmin(user?.email)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const months = Math.min(
      Math.max(Number(req.nextUrl.searchParams.get("months") || 6), 1),
      36
    );
    const [targets, progress] = await Promise.all([fetchTargets(months), loadProgress()]);

    const items = targets.map((t) => {
      const p = progress.get(t.phone);
      return p ? { ...t, status: p.status, at: p.at } : t;
    });

    return NextResponse.json({
      months,
      items,
      counts: {
        total: items.length,
        sent: items.filter((i) => i.status === "sent").length,
        skipped: items.filter((i) => i.status === "skipped").length,
        pending: items.filter((i) => i.status === "pending").length,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "명단 조회 실패" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { user } = await requireAdmin();
  if (!isAdmin(user?.email)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { phone, action } = await req.json();
  const digits = normalizePhone(phone || "");
  if (!digits) return NextResponse.json({ error: "번호가 올바르지 않습니다." }, { status: 400 });

  const id = `${KEY_PREFIX}${digits}`;

  if (action === "reset") {
    const { error } = await supabaseAdmin.from("site_settings").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, phone: digits, status: "pending" });
  }

  if (action !== "sent" && action !== "skipped") {
    return NextResponse.json({ error: "action이 올바르지 않습니다." }, { status: 400 });
  }

  const value = JSON.stringify({ status: action, at: new Date().toISOString() });
  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert({ id, value }, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, phone: digits, status: action });
}
