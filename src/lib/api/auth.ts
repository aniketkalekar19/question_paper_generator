import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export function authorizeApiKey(request: NextRequest): NextResponse | null {
  const expected = process.env.APP_API_KEY;
  if (!expected) return NextResponse.json({ error: { code: "SERVICE_NOT_CONFIGURED", message: "API key authentication is not configured." } }, { status: 503 });
  const supplied = request.headers.get("x-api-key") || "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "A valid x-api-key is required." } }, { status: 401 });
  return null;
}

export async function sendPaperWebhook(paper: unknown) {
  const url = process.env.WEBHOOK_URL;
  if (!url) return;
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) { console.error("Webhook configured without WEBHOOK_SECRET."); return; }
  try {
    const target = new URL(url);
    if (target.protocol !== "https:" || ["localhost", "127.0.0.1", "::1"].includes(target.hostname)) throw new Error("Webhook must use a public HTTPS URL.");
    const body = JSON.stringify({ event: "paper.generated", timestamp: new Date().toISOString(), data: paper });
    const { createHmac } = await import("crypto");
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    const response = await fetch(target, { method: "POST", headers: { "Content-Type": "application/json", "X-Webhook-Signature": `sha256=${signature}` }, body, signal: AbortSignal.timeout(5000), redirect: "error" });
    if (!response.ok) console.error("Webhook delivery returned status", response.status);
  } catch (error) { console.error("Webhook delivery failed:", error instanceof Error ? error.message : "unknown error"); }
}
