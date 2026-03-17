export default function Booking() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold md:text-6xl">
          예약 신청서
        </h1>

        <p className="mt-4 text-black/60">
          작성 후 확인하여 문자로 안내드립니다.
        </p>

        <form className="mt-10 space-y-6">

          <input placeholder="제목" className="w-full border p-3" />

          <input placeholder="촬영자명" className="w-full border p-3" />

          <input placeholder="연락처 *" className="w-full border p-3" />

          <input type="date" className="w-full border p-3" />

          <input placeholder="시간" className="w-full border p-3" />

          <input placeholder="촬영장소" className="w-full border p-3" />

          <input placeholder="주소" className="w-full border p-3" />

          <input placeholder="예약금 입금자명" className="w-full border p-3" />

          <div>
            <p className="mb-2 font-medium">상품 선택</p>
            <div className="flex gap-4">
              <label><input type="radio" name="type" /> 돌스냅</label>
              <label><input type="radio" name="type" /> 고희연/생신</label>
              <label><input type="radio" name="type" /> 웨딩스냅</label>
            </div>
          </div>

          <textarea
            placeholder="문의 내용"
            className="w-full border p-3 h-32"
          />

          <button className="w-full bg-black text-white py-3 rounded-full">
            신청하기
          </button>

        </form>
      </div>
    </main>
  );
}