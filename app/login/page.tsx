"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    setLoading(true);

    const isLocalhost =
      typeof window !== "undefined" &&
      window.location.origin.includes("localhost");

    const redirectUrl = isLocalhost
      ? "http://localhost:3000"
      : "https://www.jaydenbrown.kr";

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    setLoading(false);

    if (error) {
      alert(`로그인 링크 발송 실패: ${error.message}`);
      return;
    }

    alert("이메일로 로그인 링크를 보냈습니다.");
  };

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6 py-20 md:px-10">
      <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-black/45">
          Admin Login
        </p>

        <h1 className="mt-4 text-3xl font-semibold md:text-5xl">
          관리자 로그인
        </h1>

        <p className="mt-4 text-black/60">
          관리자 이메일로 로그인 링크를 받아 접속합니다.
        </p>

        <div className="mt-10 space-y-6">
          <div>
            <label className="mb-2 block text-sm text-black/60">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm text-white disabled:opacity-50"
          >
            {loading ? "전송 중..." : "로그인 링크 보내기"}
          </button>
        </div>
      </div>
    </main>
  );
}