import { NextResponse } from "next/server";
import { validateServerEnv } from "@/lib/validations/env";

export const dynamic = "force-dynamic";

/**
 * Public health check endpoint.
 * Returns an unauthenticated, sanitized status without exposing internal
 * environment details, variable names, or stack traces.
 */
export async function GET() {
  try {
    const envValidation = validateServerEnv();
    const securityErrors = envValidation.errors.filter((err) => err.startsWith("SECURITY ERROR:"));
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY?.trim());

    if (securityErrors.length > 0 || !hasGeminiKey) {
      // Detailed diagnostics are logged strictly on the server; never exposed publicly
      console.error("[Health Check] Server environment validation failed:", {
        securityErrorCount: securityErrors.length,
        hasGeminiKey,
      });

      return NextResponse.json(
        { status: "error" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { status: "ok" },
      { status: 200 }
    );
  } catch (error) {
    // Log unexpected exceptions on the server only
    console.error(
      "[Health Check] Unexpected exception during health check execution:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { status: "error" },
      { status: 500 }
    );
  }
}
