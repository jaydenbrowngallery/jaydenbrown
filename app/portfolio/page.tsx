export default function Portfolio() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-semibold md:text-6xl">Portfolio</h1>
        <p className="mt-4 text-black/60">
          단정하고 편안한 순간들을 기록합니다.
        </p>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] rounded-[2rem] bg-[#dcd7d1]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}