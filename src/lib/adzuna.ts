import {
  DEFAULT_FILTERS,
  buildDashboardSnapshot,
  matchesFilters,
  normalizeAdzunaJob,
} from "@/lib/job-utils";
import type { AdzunaJobResult } from "@/lib/job-utils";
import type { JobFilters, JobsApiResponse } from "@/types/jobs";

interface AdzunaSearchResponse {
  count?: number;
  results?: AdzunaJobResult[];
}

const CACHE_TTL_MS = 1000 * 60 * 10;
const jobsCache = new Map<string, { expiresAt: number; value: JobsApiResponse }>();

// Adzuna responses are cached briefly in memory so repeated dashboard refreshes
// do not burn API quota during local development or serverless warm periods.
export async function fetchAdzunaDashboardData(filters: JobFilters): Promise<JobsApiResponse> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const country = process.env.ADZUNA_COUNTRY?.trim().toLowerCase() || "us";

  if (!appId || !appKey) {
    throw new Error("Missing Adzuna credentials.");
  }

  const cacheKey = JSON.stringify({ country, filters });
  const cached = jobsCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    "content-type": "application/json",
    results_per_page: "50",
    what: filters.keyword || DEFAULT_FILTERS.keyword,
  });

  if (filters.location) {
    params.set("where", filters.location);
  }

  const endpoint = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`;
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Adzuna request failed with ${response.status}: ${message}`);
  }

  const payload = (await response.json()) as AdzunaSearchResponse;
  const jobs = (payload.results ?? [])
    .map(normalizeAdzunaJob)
    .filter((job) => matchesFilters(job, filters));

  const value: JobsApiResponse = {
    filters,
    country,
    fetchedAt: new Date().toISOString(),
    source: "adzuna",
    aiSummaryAvailable: Boolean(process.env.OPENAI_API_KEY),
    totalAvailable: typeof payload.count === "number" ? payload.count : null,
    jobs,
    snapshot: buildDashboardSnapshot(jobs, typeof payload.count === "number" ? payload.count : null),
  };

  jobsCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });

  return value;
}
