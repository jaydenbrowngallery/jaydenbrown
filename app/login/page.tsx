"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 마운트 즉시 stale 세션 제거 → refresh_token 자동 시도 차단
  useEffect(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
      .forEach((k) => localStorage.removeItem(k));
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    setLoading(false);

    if (error) {
      alert("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    router.replace("/admin/booking");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#f7f5f2] flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-sm space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-black/30 text-center mb-6">
          Jayden Brown
        </p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="아이디"
          className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 text-sm outline-none focus:border-black/30"
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 text-sm outline-none focus:border-black/30"
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 accent-black rounded"
          />
          <span className="text-sm text-black/50">로그인 유지</span>
        </label>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded-full bg-black py-3 text-sm text-white disabled:opacity-50 mt-1"
        >
          {loading ? "..." : "로그인"}
        </button>
      </div>
    </main>
  );
}
