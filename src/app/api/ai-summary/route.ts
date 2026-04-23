import { NextRequest, NextResponse } from "next/server";

import { generateJobMarketSummary } from "@/lib/openai";
import type { SummaryRequestPayload } from "@/types/jobs";

export const dynamic = "force-dynamic";

// The summary endpoint accepts aggregated dashboard data, generates a compact
// narrative server-side, and never exposes the OpenAI API key to the client.
export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new NextResponse("OPENAI_API_KEY is not configured.", { status: 400 });
  }

  try {
    const payload = (await request.json()) as SummaryRequestPayload;

    if (!payload?.snapshot) {
      return new NextResponse("Missing dashboard snapshot payload.", { status: 400 });
    }

    const summary = await generateJobMarketSummary(payload);

    return NextResponse.json({
      summary,
      generatedAt: new Date().toISOString(),
    });
  } catch (caughtError) {
    console.error("Failed to generate AI summary:", caughtError);

    return new NextResponse("The AI summary request failed.", {
      status: 500,
    });
  }
}
