export default function Contact() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] flex items-center justify-center px-6">
      <div className="text-center max-w-md">

        <h1 className="text-4xl font-semibold md:text-5xl">
          문의는 문자로
          <br />
          남겨주세요.
        </h1>

        <p className="mt-6 text-black/60 leading-7">
          촬영 종류와 날짜를 함께 보내주시면
          빠르게 안내드릴 수 있습니다.
        </p>

        <a
          href="sms:01012345678?body=안녕하세요. 촬영 문의드립니다."
          className="mt-10 inline-block bg-black text-white px-6 py-3 rounded-full"
        >
          문자 보내기
        </a>

      </div>
    </main>
  );
}