import { NextRequest, NextResponse } from "next/server";
import { authorizeApiKey } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = authorizeApiKey(request);
  if (denied) return denied;
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: { code: "INVALID_ID", message: "Paper id must be a UUID." } }, { status: 400 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: { code: "PERSISTENCE_NOT_CONFIGURED", message: "Configure Supabase service role to retrieve stored papers." } }, { status: 503 });
  const client = createAdminClient();
  const { data: paper, error } = await client.from("generated_papers").select("*").eq("id", params.id).maybeSingle();
  if (error) return NextResponse.json({ error: { code: "DATABASE_ERROR", message: "Unable to retrieve paper." } }, { status: 500 });
  if (!paper) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Paper not found." } }, { status: 404 });
  const { data: questions, error: questionsError } = await client.from("questions").select("*").eq("paper_id", params.id).order("created_at", { ascending: true });
  if (questionsError) return NextResponse.json({ error: { code: "DATABASE_ERROR", message: "Unable to retrieve questions." } }, { status: 500 });
  return NextResponse.json({ data: { ...paper, questions } });
}
