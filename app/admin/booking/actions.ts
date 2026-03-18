"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";

export async function deleteBookingRequest(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("잘못된 요청입니다.");
  }

  const { error } = await supabase
    .from("booking_requests")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/booking");
}

