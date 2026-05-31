import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SwingDiary 개인정보 처리방침",
  robots: { index: false, follow: false },
};

export default function SwingDiaryPrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-neutral-800">
      <h1 className="text-3xl font-bold mb-2">SwingDiary 개인정보 처리방침</h1>
      <p className="text-sm text-neutral-500 mb-10">
        <strong>시행일: 2026년 5월 31일</strong>
      </p>

      <p className="mb-8">
        SwingDiary(이하 &quot;앱&quot;)는 사용자의 개인정보를 중요하게 생각하며,
        관련 법령(개인정보보호법 등)을 준수합니다. 본 처리방침은 앱이 어떤 정보를
        수집하고 어떻게 이용하는지 설명합니다.
      </p>

      <Section title="1. 수집하는 정보">
        <p className="mb-3">
          앱은 골프 스윙 기록 기능 제공을 위해 다음 정보를 수집·이용합니다.
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>
            <strong>위치 정보(GPS)</strong>: 현재 위치를 기반으로 골프장을 자동
            인식하기 위해 사용됩니다.
          </li>
          <li>
            <strong>사진 및 동영상</strong>: 사용자가 촬영한 스윙 영상 및
            이미지.
          </li>
          <li>
            <strong>카메라·마이크 접근</strong>: 스윙 영상 촬영을 위해
            사용됩니다.
          </li>
        </ul>
        <p className="mb-2">
          앱은 이름, 이메일, 전화번호, 결제 정보 등 별도의 회원 식별 정보를
          수집하지 않습니다. 또한 광고 식별자나 사용 통계를 수집하지 않으며,
          사용자를 추적하지 않습니다.
        </p>
      </Section>

      <Section title="2. 정보의 저장 위치">
        <p>
          촬영된 영상과 기록 데이터는 사용자 기기 및 사용자 본인의 iCloud 계정
          (Apple CloudKit Private Database)에만 저장됩니다. 이 데이터는 사용자
          본인만 접근할 수 있으며, 개발자는 접근할 수 없습니다.
        </p>
      </Section>

      <Section title="3. 정보의 제3자 제공">
        <p>
          앱은 수집한 정보를 제3자에게 제공·판매·공유하지 않습니다. 사용자가
          직접 공유 기능(공유 시트 등)을 통해 외부로 내보내는 경우는
          예외이며, 이는 전적으로 사용자의 선택에 따릅니다.
        </p>
      </Section>

      <Section title="4. 제3자 서비스">
        <p>
          앱은 골프장 위치 표시를 위해 지도 서비스를 사용합니다. 지도 표시
          과정에서 해당 지도 제공사의 약관 및 개인정보 처리방침이 적용될 수
          있습니다.
        </p>
      </Section>

      <Section title="5. 정보의 보관 및 삭제">
        <p>
          기록 데이터는 사용자가 앱 내에서 삭제하거나 앱을 삭제할 때 함께
          삭제됩니다. iCloud에 저장된 데이터는 사용자의 iCloud 설정에 따라
          관리됩니다.
        </p>
      </Section>

      <Section title="6. 아동의 개인정보">
        <p>
          앱은 만 14세 미만 아동을 대상으로 하지 않으며, 의도적으로 아동의
          개인정보를 수집하지 않습니다.
        </p>
      </Section>

      <Section title="7. 처리방침 변경">
        <p>본 처리방침이 변경될 경우 본 페이지를 통해 고지합니다.</p>
      </Section>

      <Section title="8. 문의처">
        <ul className="list-disc pl-6 space-y-1">
          <li>운영자: Jayden Brown (박이용)</li>
          <li>
            이메일:{" "}
            <a
              href="mailto:jaydenbrown@naver.com"
              className="text-blue-600 underline"
            >
              jaydenbrown@naver.com
            </a>
          </li>
        </ul>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}
