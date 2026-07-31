import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/isAdmin";
import SmsClient from "./SmsClient";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminSmsPage() {
  // 고객 연락처가 노출되는 화면이라 관리자만 접근 가능하게 막는다.
  const { user } = await requireAdmin();
  if (!isAdmin(user?.email)) redirect("/login");

  return (
    <main className="min-h-screen bg-[#f7f5f2]">
      <SmsClient />
    </main>
  );
}
