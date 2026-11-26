import { NextRequest } from "next/server";
import { handlePaperGeneration } from "@/lib/api/handler";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: NextRequest) { return handlePaperGeneration(request); }
