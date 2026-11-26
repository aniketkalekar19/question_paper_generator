import { NextRequest, NextResponse } from "next/server";
import { generatePaper, persistPaper, validateGenerateInput } from "@/lib/api/paper";
import { sendPaperWebhook } from "@/lib/api/auth";

export async function handlePaperGeneration(request: NextRequest) {
  if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Send application/json." } }, { status: 415 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } }, { status: 400 }); }
  const validated = validateGenerateInput(body);
  if (!validated.input) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Request validation failed.", details: validated.errors } }, { status: 422 });
  try {
    const generated = await generatePaper(validated.input);
    const paper = await persistPaper(generated);
    await sendPaperWebhook(paper);
    return NextResponse.json({ data: paper }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Paper generation failed.";
    const status = message.includes("not configured") ? 503 : message.includes("Gemini API request failed (429)") ? 429 : 502;
    return NextResponse.json({ error: { code: status === 429 ? "AI_RATE_LIMITED" : status === 503 ? "SERVICE_NOT_CONFIGURED" : "GENERATION_FAILED", message } }, { status });
  }
}
