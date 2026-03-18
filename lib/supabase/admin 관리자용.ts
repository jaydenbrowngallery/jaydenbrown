import { redirect } from "next/navigation";
import { createClient } from "./server";
import { isAdmin } from "@/lib/isAdmin";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin(user.email)) {
    redirect("/");
  }

  return { supabase, user };
}