# 예약 상태 흐름 변경 — 구현 가이드

## 상태 흐름

```
pending(접수) → deposit_pending(입금대기) → confirmed(예약확정)
```

## 생성/수정된 파일

### 1. `app/api/confirm-booking/route.ts` (수정)

**변경 사항:**
- status를 `confirmed` → `deposit_pending`으로 변경
- 문자 내용을 "예약 확정"에서 "입금 안내"로 변경
- Google Calendar 이벤트 제목: `[입금대기] 이름`
- 캘린더 색상: Tangerine (6번, 주황색)

**기존 코드 교체 방법:**
기존 `app/api/confirm-booking/route.ts`를 새 파일로 교체합니다.
백업본이 `route.ts.bak`에 있으니 안전합니다.

> ⚠️ 문자 내용의 `[계좌정보]` 부분을 실제 계좌번호로 변경하세요!

### 2. `app/api/deposit-match/route.ts` (신규)

**기능:**
- 은행 CSV 파일 업로드 수신 (FormData)
- CSV 파싱 (국민/신한/우리/하나/농협 등 주요 은행 형식 자동 인식)
- `deposit_pending` 상태인 예약의 `depositor_name` ↔ 거래내역 입금자명 자동 매칭
- `autoConfirm=true` 시 매칭 즉시 확정 처리 (문자 발송 + 캘린더 업데이트)

**이름 매칭 로직:**
- 공백, 특수문자 제거 후 비교
- 정확 일치 또는 부분 포함 ("홍길동촬영" ↔ "홍길동") 매칭

### 3. `app/api/deposit-confirm/route.ts` (신규)

**기능:**
- 개별 예약 수동 확정 API
- `bookingId`를 받아서:
  1. Supabase status → `confirmed`
  2. Google Calendar 이벤트 업데이트 (제목: `[확정] 이름`, 색상: Basil/초록)
  3. 확정 문자 발송

### 4. `app/api/bookings/route.ts` (신규)

**기능:**
- 관리자용 예약 목록 조회
- `?status=deposit_pending` 등 필터링 지원

### 5. `app/admin/deposits/page.tsx` (신규)

**관리자 UI:**
- 거래내역 CSV 파일 업로드 영역 (드래그앤드롭 스타일)
- "자동 확정" 체크박스 옵션
- 매칭 결과 테이블 (매칭 성공 / 미매칭 분리)
- 입금대기 예약 목록 + 수동 확정 버튼
- 상태 필터 (입금대기 / 확정 / 접수 / 전체)

## Google Calendar 색상 규칙

| 상태 | 캘린더 색상 | Color ID | 제목 형식 |
|------|------------|----------|-----------|
| deposit_pending | Tangerine (주황) | 6 | `[입금대기] 홍길동` |
| confirmed | Basil (초록) | 10 | `[확정] 홍길동` |

## 적용 순서

1. **파일 복사**: 생성된 파일들을 레포의 해당 경로에 복사
2. **계좌 정보 수정**: `confirm-booking/route.ts`의 `[계좌정보]`를 실제 계좌로 변경
3. **google-calendar.ts 확인**: `updateCalendarEvent`에 `colorId` 파라미터가 지원되는지 확인
4. **로컬 테스트**: `npm run dev`로 동작 확인
5. **배포**: `npx vercel --prod` 또는 git push

## google-calendar.ts에 필요한 수정

기존 `updateCalendarEvent` 함수가 `colorId`를 지원하지 않을 수 있습니다.
아래처럼 수정해주세요:

```typescript
// lib/google-calendar.ts — updateCalendarEvent 함수
export async function updateCalendarEvent(
  eventId: string,
  data: {
    summary?: string;
    description?: string;
    start?: { dateTime: string; timeZone: string };
    end?: { dateTime: string; timeZone: string };
    location?: string;
    colorId?: string;  // ← 추가
  }
) {
  const accessToken = await getGoogleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar update failed: ${err}`);
  }

  return res.json();
}
```

마찬가지로 `createCalendarEvent`에도 `colorId`를 body에 포함하도록 확인하세요.

## CSV 형식 예시

은행에서 다운로드한 거래내역 CSV가 아래 형식 중 하나면 자동 인식됩니다:

```csv
거래일자,입금액,출금액,입금자명,잔액,메모
2026-03-25,150000,,홍길동,500000,
2026-03-25,200000,,김철수,700000,
```

필수 컬럼: 거래일자(날짜), 입금액(금액), 입금자명(이름)
