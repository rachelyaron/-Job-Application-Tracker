import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { JobInsert } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("date_applied", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה לא ידועה";
    console.error("[GET /api/jobs]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: JobInsert = await req.json();
    const { data, error } = await supabase
      .from("jobs")
      .insert({ ...body, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה לא ידועה";
    console.error("[POST /api/jobs]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
