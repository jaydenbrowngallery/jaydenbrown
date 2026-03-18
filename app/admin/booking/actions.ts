"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";

const ALLOWED_STATUS = ["pending", "confirmed", "done", "cancelled"] as const;

export async function updateBookingStatus(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");

  if (!id) {
    throw new Error("잘못된 요청입니다.");
  }

  if (!ALLOWED_STATUS.includes(status as (typeof ALLOWED_STATUS)[number])) {
    throw new Error("허용되지 않은 상태값입니다.");
  }

  const { error } = await supabase
    .from("booking_requests")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/booking");
  revalidatePath(`/admin/booking/${id}`);
}

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