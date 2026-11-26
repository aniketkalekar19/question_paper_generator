import { NextRequest, NextResponse } from "next/server";
import { authorizeApiKey } from "@/lib/api/auth";
import { handlePaperGeneration } from "@/lib/api/handler";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const denied = authorizeApiKey(request);
  return denied || handlePaperGeneration(request);
}
export async function GET(request: NextRequest) {
  const denied = authorizeApiKey(request);
  if (denied) return denied;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: { code: "PERSISTENCE_NOT_CONFIGURED", message: "Configure Supabase service role to list stored papers." } }, { status: 503 });
  try {
    const { data, error } = await createAdminClient().from("generated_papers").select("id,title,subject,difficulty,total_marks,duration_minutes,status,created_at").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch { return NextResponse.json({ error: { code: "DATABASE_ERROR", message: "Unable to retrieve papers." } }, { status: 500 }); }
}
