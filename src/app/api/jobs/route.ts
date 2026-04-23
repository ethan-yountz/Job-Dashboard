import { NextRequest, NextResponse } from "next/server";

import { fetchAdzunaDashboardData } from "@/lib/adzuna";
import {
  DEFAULT_FILTERS,
  buildDashboardSnapshot,
  matchesFilters,
  sanitizeFilters,
} from "@/lib/job-utils";
import { MOCK_JOB_POSTINGS } from "@/lib/mock-data";
import type { JobsApiResponse } from "@/types/jobs";

export const dynamic = "force-dynamic";

// This route centralizes third-party job fetching so Adzuna credentials stay on
// the server and the browser only receives normalized, dashboard-ready data.
export async function GET(request: NextRequest) {
  const filters = sanitizeFilters({
    keyword: request.nextUrl.searchParams.get("keyword") ?? DEFAULT_FILTERS.keyword,
    location: request.nextUrl.searchParams.get("location") ?? "",
    remotePreference:
      request.nextUrl.searchParams.get("remotePreference") ?? DEFAULT_FILTERS.remotePreference,
  });

  try {
    const data = await fetchAdzunaDashboardData(filters);
    return NextResponse.json(data);
  } catch (caughtError) {
    console.error("Falling back to mock data:", caughtError);

    const jobs = MOCK_JOB_POSTINGS.filter((job) => matchesFilters(job, filters));
    const payload: JobsApiResponse = {
      filters,
      country: "us",
      fetchedAt: new Date().toISOString(),
      source: "mock",
      notice:
        "Live Adzuna data is unavailable or rate-limited right now, so the dashboard is showing seeded fallback data.",
      aiSummaryAvailable: Boolean(process.env.OPENAI_API_KEY),
      totalAvailable: jobs.length,
      jobs,
      snapshot: buildDashboardSnapshot(jobs, jobs.length),
    };

    return NextResponse.json(payload);
  }
}
