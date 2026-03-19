import fs from "fs";
import path from "path";
import ical from "node-ical";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("환경변수가 없습니다. .env.local 확인:");
  console.error("NEXT_PUBLIC_SUPABASE_URL");
  console.error("SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const icsFilePath = path.join(process.cwd(), "data", "google-calendar.ics");

if (!fs.existsSync(icsFilePath)) {
  console.error(`ICS 파일이 없습니다: ${icsFilePath}`);
  process.exit(1);
}

const events = await ical.async.parseFile(icsFilePath);

const rows = [];

for (const key of Object.keys(events)) {
  const event = events[key];

  if (!event || event.type !== "VEVENT") continue;

  const start = event.start ? new Date(event.start).toISOString() : null;
  const end = event.end ? new Date(event.end).toISOString() : null;

  rows.push({
  external_id: `google_ics_${path.basename(icsFilePath)}_${event.uid || key}`,
    title: event.summary || "제목 없음",
    description: event.description || null,
    location: event.location || null,
    start_at: start,
    end_at: end,
    source: "google_ics",
    raw_data: event,
  });
}

if (rows.length === 0) {
  console.log("가져올 일정이 없습니다.");
  process.exit(0);
}

const { data, error } = await supabase
  .from("calendar_events")
  .upsert(rows, { onConflict: "external_id" })
  .select();

if (error) {
  console.error("DB 업로드 실패:", error);
  process.exit(1);
}

console.log(`완료: ${data.length}개 일정 업로드됨`);