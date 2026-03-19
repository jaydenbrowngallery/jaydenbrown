"use client";

type Props = {
  email?: string | null;
  phone?: string | null;
};

export default function ActionButtons({ email, phone }: Props) {
  const handleCopyEmail = async () => {
    if (!email || email === "-") {
      alert("복사할 이메일이 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(email);
      alert("이메일을 복사했습니다.");
    } catch (error) {
      console.error(error);
      alert("이메일 복사에 실패했습니다.");
    }
  };

  const message = `안녕하세요? 제이든브라운 입니다.
행사 날 정말 수고많으셨어요😊
1차 선별 및 영상 작업이 마무리되어
금일 메일 발송예정입니다. 
촬영비 43만원 카카오뱅크 3333 09 0903931 (예금주 박이용)으로 부탁드립니다.`;

  const smsHref =
    phone && phone !== "-"
      ? `sms:${phone}?body=${encodeURIComponent(message)}`
      : null;

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={handleCopyEmail}
        className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5"
      >
        이메일 복사
      </button>

      {smsHref ? (
        <a
  href={smsHref}
  className="inline-flex h-12 items-center justify-center rounded-full bg-black px-5 text-sm font-medium !text-white transition hover:opacity-90"
>
  촬영비 입금 문자
</a>
      ) : (
        <button
          type="button"
          disabled
          className="inline-flex h-12 items-center justify-center rounded-full bg-black/30 px-5 text-sm font-medium text-white"
        >
          연락처 없음
        </button>
      )}
    </div>
  );
}