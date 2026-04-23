import OpenAI from "openai";

import type { SummaryRequestPayload } from "@/types/jobs";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

// The summary route keeps LLM usage server-side and only sends aggregated job
// market signals instead of raw secrets or full browser-side prompts.
export async function generateJobMarketSummary(
  payload: SummaryRequestPayload,
): Promise<string> {
  const client = getOpenAIClient();

  const prompt = `
You are a labor market analyst writing for students and early-career professionals.
Write a concise summary in 3 bullet points.

Requirements:
- Highlight demand patterns by skills, locations, and employers.
- Mention salary direction only if salary sample size is at least 3.
- Keep each bullet to one sentence.
- Be concrete and avoid hype.

Dashboard data:
${JSON.stringify(payload, null, 2)}
`;

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.2",
    input: prompt,
    max_output_tokens: 220,
  });

  const summary = response.output_text.trim();

  if (!summary) {
    throw new Error("The OpenAI API returned an empty summary.");
  }

  return summary;
}
