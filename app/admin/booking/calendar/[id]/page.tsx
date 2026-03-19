import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";
import ActionButtons from "./ActionButtons";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html: string) {
  return decodeHtmlEntities(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseDescriptionTable(description?: string | null) {
  if (!description) return [];

  const matches = description.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];

  return matches
    .map((row) => {
      const th = row.match(/<th[^>]*>([\s\S]*?)<\/th>/);
      const td = row.match(/<td[^>]*>([\s\S]*?)<\/td>/);

      return {
        label: stripHtml(th?.[1] || ""),
        value: stripHtml(td?.[1] || ""),
      };
    })
    .filter((row) => row.label || row.value);
}

function findRowValue(
  rows: Array<{ label: string; value: string }>,
  labels: string[]
) {
  const normalizedLabels = labels.map((label) => label.replace(/\s/g, ""));

  const found = rows.find((row) =>
    normalizedLabels.includes(row.label.replace(/\s/g, ""))
  );

  return found?.value || null;
}

export default async function CalendarEventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: event, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !event) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <div className="rounded-[28px] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">기존 캘린더 일정</h1>
          <p className="mt-4 text-red-500">일정을 불러오지 못했습니다.</p>
          <Link
            href="/admin/booking"
            className="mt-6 inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const parsedRows = parseDescriptionTable(event.description);
  const plainDescription =
    parsedRows.length === 0 ? stripHtml(event.description || "") : "";

  const email =
    findRowValue(parsedRows, ["이메일 주소", "이메일", "메일", "email"]) || "-";

  const phone =
    findRowValue(parsedRows, ["연락처", "전화번호", "휴대폰", "핸드폰"]) || "-";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <div className="rounded-[28px] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              기존 캘린더 일정
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {event.title || "제목 없음"}
            </h1>
          </div>

          <Link
            href="/admin/booking"
            className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5"
          >
            목록으로
          </Link>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-black/10">
          <div className="grid grid-cols-1 divide-y divide-black/10">
            <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold text-black/55">제목</div>
              <div className="text-sm text-black">{event.title || "-"}</div>
            </div>

            <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold text-black/55">장소</div>
              <div className="text-sm text-black">{event.location || "-"}</div>
            </div>

            {parsedRows.length > 0 ? (
              <div className="p-0">
                <div className="grid grid-cols-1 divide-y divide-black/10">
                  {parsedRows.map((row, index) => (
                    <div
                      key={`${row.label}-${index}`}
                      className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]"
                    >
                      <div className="text-sm font-semibold text-black/55">
                        {row.label || "-"}
                      </div>
                      <div className="whitespace-pre-wrap break-words text-sm text-black">
                        {row.value || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
                <div className="text-sm font-semibold text-black/55">설명</div>
                <div className="whitespace-pre-wrap break-words text-sm text-black">
                  {plainDescription || "-"}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold text-black/55">출처</div>
              <div className="text-sm text-black">{event.source || "-"}</div>
            </div>
          </div>
        </div>

        <ActionButtons email={email} phone={phone} />
      </div>
    </main>
  );
}