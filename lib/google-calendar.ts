// lib/google-calendar.ts
import { SignJWT, importPKCS8 } from "jose";

export async function getGoogleAccessToken(
  scope = "https://www.googleapis.com/auth/calendar"
): Promise<string> {
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const privateKey = await importPKCS8(serviceAccount.private_key, "RS256");
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256" })
    .sign(privateKey);
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Google 토큰 발급 실패: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

const calendarBaseUrl = (calendarId: string) =>
  `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`;

// Google Calendar 이벤트 생성
export async function createCalendarEvent(eventData: {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
}) {
  const accessToken = await getGoogleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const body: any = {
    summary: eventData.summary,
    start: { dateTime: eventData.startDateTime, timeZone: "Asia/Seoul" },
    end: { dateTime: eventData.endDateTime, timeZone: "Asia/Seoul" },
  };
  if (eventData.description) body.description = eventData.description;
  if (eventData.location) body.location = eventData.location;

  const res = await fetch(`${calendarBaseUrl(calendarId)}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`이벤트 생성 실패 (${res.status}): ${err}`);
  }
  return res.json();
}

// Google Calendar 이벤트 수정
export async function updateCalendarEvent(
  eventId: string,
  updateData: {
    summary?: string;
    description?: string;
    startDateTime?: string;
    endDateTime?: string;
    location?: string;
  }
) {
  const accessToken = await getGoogleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  // 기존 이벤트 가져오기
  const getRes = await fetch(
    `${calendarBaseUrl(calendarId)}/events/${eventId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!getRes.ok) throw new Error(`이벤트 조회 실패: ${getRes.status}`);
  const existing = await getRes.json();

  const updated: any = { ...existing };
  if (updateData.summary) updated.summary = updateData.summary;
  if (updateData.description !== undefined) updated.description = updateData.description;
  if (updateData.location) updated.location = updateData.location;
  if (updateData.startDateTime) {
    updated.start = { dateTime: updateData.startDateTime, timeZone: "Asia/Seoul" };
  }
  if (updateData.endDateTime) {
    updated.end = { dateTime: updateData.endDateTime, timeZone: "Asia/Seoul" };
  }

  const putRes = await fetch(
    `${calendarBaseUrl(calendarId)}/events/${eventId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updated),
    }
  );
  if (!putRes.ok) throw new Error(`이벤트 수정 실패: ${putRes.status}`);
  return putRes.json();
}

// Google Calendar 이벤트 삭제
export async function deleteCalendarEvent(eventId: string) {
  const accessToken = await getGoogleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;
  const res = await fetch(
    `${calendarBaseUrl(calendarId)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`이벤트 삭제 실패: ${res.status}`);
  }
}

// Google Calendar 이벤트 목록 조회
export async function listCalendarEvents(options?: {
  timeMin?: string;
  timeMax?: string;
  updatedMin?: string;
  showDeleted?: boolean;
  maxResults?: number;
}) {
  const accessToken = await getGoogleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const params = new URLSearchParams({ singleEvents: "true" });
  if (options?.timeMin) params.set("timeMin", options.timeMin);
  if (options?.timeMax) params.set("timeMax", options.timeMax);
  if (options?.updatedMin) params.set("updatedMin", options.updatedMin);
  if (options?.showDeleted) params.set("showDeleted", "true");
  if (options?.maxResults) params.set("maxResults", String(options.maxResults));

  const res = await fetch(
    `${calendarBaseUrl(calendarId)}/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`이벤트 목록 조회 실패: ${res.status}`);
  const data = await res.json();
  return data.items || [];
}
// trigger #오후
