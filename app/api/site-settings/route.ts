import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("*");

    if (error) throw error;
    return NextResponse.json({ ok: true, settings: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, value } = await req.json();

    if (!id || !value) {
      return NextResponse.json({ error: "id와 value 필수" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ id, value, updated_at: new Date().toISOString() });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
