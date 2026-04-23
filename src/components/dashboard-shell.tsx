"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/chart-card";
import { MetricCard } from "@/components/metric-card";
import { DEFAULT_FILTERS } from "@/lib/job-utils";
import type {
  JobFilters,
  JobsApiResponse,
  RemotePreference,
  SummaryRequestPayload,
} from "@/types/jobs";

interface DashboardShellProps {
  aiSummaryEnabled: boolean;
}
const ROLE_PRESETS = [
  { label: "Data Science", keyword: "data scientist" },
  { label: "Machine Learning", keyword: "machine learning engineer" },
  { label: "Software Engineering", keyword: "software engineer" },
  { label: "Data Analytics", keyword: "data analyst" },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// This client shell owns interactive search state and only talks to our
// internal API routes, keeping third-party credentials fully server-side.
export function DashboardShell({ aiSummaryEnabled }: DashboardShellProps) {
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<JobsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadJobs = useCallback(
    async (nextFilters: JobFilters) => {
      setLoading(true);
      setError(null);
      setSummary(null);
      setSummaryError(null);

      try {
        const params = new URLSearchParams({
          keyword: nextFilters.keyword,
          location: nextFilters.location,
          remotePreference: nextFilters.remotePreference,
        });

        const response = await fetch(`/api/jobs?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("The dashboard API could not be reached.");
        }

        const payload = (await response.json()) as JobsApiResponse;
        setData(payload);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Something went wrong while loading jobs.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    // The first render should hydrate with a default market view.
    void loadJobs(DEFAULT_FILTERS);
  }, [loadJobs]);

  async function handleSummaryGeneration() {
    if (!data) {
      return;
    }

    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const payload: SummaryRequestPayload = {
        filters: data.filters,
        totalAvailable: data.totalAvailable,
        snapshot: data.snapshot,
        recentTitles: data.jobs.slice(0, 6).map((job) => job.title),
      };

      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to generate the AI summary.");
      }

      const result = (await response.json()) as { summary: string };
      setSummary(result.summary);
    } catch (caughtError) {
      setSummaryError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to generate the AI summary.",
      );
    } finally {
      setSummaryLoading(false);
    }
  }

  function updateFilter<K extends keyof JobFilters>(key: K, value: JobFilters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadJobs(filters);
  }

  function applyPreset(keyword: string) {
    const nextFilters = {
      ...filters,
      keyword,
    };

    setFilters(nextFilters);
    void loadJobs(nextFilters);
  }

  const remoteFriendlyCount =
    (data?.snapshot.remoteBreakdown.find((item) => item.label === "Remote")?.value ?? 0) +
    (data?.snapshot.remoteBreakdown.find((item) => item.label === "Hybrid")?.value ?? 0);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.18),_transparent_42%),linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(241,245,249,0.86))] p-7 shadow-soft sm:p-10">
        <div className="absolute -right-20 top-8 h-44 w-44 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-emerald-300/25 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
          <div>
            <span className="inline-flex rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
              Live AI Job Market Intelligence
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              AI Job Market Intelligence Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Track live demand for data science, machine learning, software engineering,
              and analytics roles with salary signals, location trends, employer demand,
              and skills extracted from real postings.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {ROLE_PRESETS.map((preset) => (
                <button
                  key={preset.keyword}
                  type="button"
                  onClick={() => applyPreset(preset.keyword)}
                  className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-400 hover:text-teal-700"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel rounded-[30px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Snapshot context
            </p>
            <dl className="mt-5 grid gap-4">
              <div>
                <dt className="text-sm text-slate-500">Data source</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">
                  {data ? (data.source === "adzuna" ? "Live Adzuna feed" : "Seeded fallback data") : "Loading"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Coverage</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">
                  {data?.totalAvailable ? compactFormatter.format(data.totalAvailable) : "Focused sample"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">AI summary</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">
                  {aiSummaryEnabled ? "Available" : "Disabled until OPENAI_API_KEY is set"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="panel mt-8 rounded-[32px] p-5 sm:p-6">
        <form className="grid gap-4 lg:grid-cols-[1.2fr_1fr_0.8fr_auto]" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Role keyword</span>
            <input
              value={filters.keyword}
              onChange={(event) => updateFilter("keyword", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="data scientist, software engineer, ml engineer..."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Location</span>
            <input
              value={filters.location}
              onChange={(event) => updateFilter("location", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="United States, New York, Austin..."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Work mode</span>
            <select
              value={filters.remotePreference}
              onChange={(event) =>
                updateFilter("remotePreference", event.target.value as RemotePreference)
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="any">Any</option>
              <option value="remote-friendly">Remote / hybrid</option>
              <option value="non-remote">Non-remote</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-auto rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Refreshing..." : "Refresh dashboard"}
          </button>
        </form>

        {data?.notice ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {data.notice}
          </p>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </section>

      {loading ? <LoadingSkeleton /> : null}

      {!loading && data ? (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Postings returned"
              value={compactFormatter.format(data.snapshot.totalPostings)}
              description={`Current query returned ${data.snapshot.totalPostings} postings after filters.`}
            />
            <MetricCard
              title="Average salary"
              value={formatCurrency(data.snapshot.averageSalary)}
              description={`Based on ${data.snapshot.salarySampleSize} postings with salary data.`}
            />
            <MetricCard
              title="Remote-friendly share"
              value={data.snapshot.totalPostings > 0 ? `${Math.round((remoteFriendlyCount / data.snapshot.totalPostings) * 100)}%` : "0%"}
              description="Remote and hybrid postings detected from job titles and descriptions."
            />
            <MetricCard
              title="Market depth"
              value={data.totalAvailable ? compactFormatter.format(data.totalAvailable) : "n/a"}
              description={`Adzuna country feed: ${data.country.toUpperCase()}.`}
            />
          </section>

          <section className="mt-8">
            <section className="panel rounded-[32px] p-5 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">AI market summary</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Generate a concise server-side summary from the current live dataset.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!aiSummaryEnabled || summaryLoading}
                  onClick={() => void handleSummaryGeneration()}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {summaryLoading ? "Generating..." : "Generate summary"}
                </button>
              </div>

              <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                {!aiSummaryEnabled ? (
                  <p className="text-sm leading-6 text-slate-600">
                    Set <code>OPENAI_API_KEY</code> to enable the AI summary panel.
                  </p>
                ) : summary ? (
                  <div className="space-y-3 text-sm leading-7 text-slate-700">
                    {summary.split("\n").filter(Boolean).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-600">
                    Use the summary button to turn the current dashboard signals into a short
                    market narrative for students and early-career candidates.
                  </p>
                )}

                {summaryError ? (
                  <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {summaryError}
                  </p>
                ) : null}
              </div>
            </section>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Top skills"
              description="Most common skills extracted from job titles and descriptions."
            >
              <ChartWrapper>
                <BarChart data={data.snapshot.topSkills}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe4f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#475569", fontSize: 12 }}
                    interval={0}
                    angle={-22}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0f766e" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ChartWrapper>
            </ChartCard>

            <ChartCard
              title="Salary by job title"
              description="Average salary for the highest-paying normalized job titles in the current result set."
            >
              <ChartWrapper>
                <BarChart data={data.snapshot.salaryByTitle} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#dbe4f0" />
                  <XAxis
                    type="number"
                    tick={{ fill: "#475569", fontSize: 12 }}
                    tickFormatter={(value) => compactFormatter.format(Number(value))}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={140}
                    tick={{ fill: "#334155", fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ChartWrapper>
            </ChartCard>

            <ChartCard
              title="Jobs by location"
              description="Top locations represented in the current search."
            >
              <ChartWrapper>
                <BarChart data={data.snapshot.jobsByLocation}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe4f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#475569", fontSize: 12 }}
                    interval={0}
                    angle={-22}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0891b2" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ChartWrapper>
            </ChartCard>

            <ChartCard
              title="Top companies"
              description="Employers showing up most often in the current job set."
            >
              <ChartWrapper>
                <BarChart
                  data={data.snapshot.companiesByPostingCount}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#dbe4f0" />
                  <XAxis type="number" tick={{ fill: "#475569", fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={150}
                    tick={{ fill: "#334155", fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ChartWrapper>
            </ChartCard>
          </section>

          <section className="mt-8">
            <section className="panel overflow-hidden rounded-[32px]">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <h2 className="text-xl font-semibold text-slate-950">Recent job postings</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Recent roles returned by the current search query.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4 sm:px-6">Title</th>
                      <th className="px-5 py-4 sm:px-6">Company</th>
                      <th className="px-5 py-4 sm:px-6">Location</th>
                      <th className="px-5 py-4 sm:px-6">Salary</th>
                      <th className="px-5 py-4 sm:px-6">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {data.jobs.map((job) => (
                      <tr key={job.id} className="align-top">
                        <td className="px-5 py-4 sm:px-6">
                          <div className="font-medium text-slate-950">{job.title}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {job.remoteClassification}
                            </span>
                            {job.skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">{job.company}</td>
                        <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">{job.location}</td>
                        <td className="px-5 py-4 text-sm text-slate-600 sm:px-6">
                          {formatSalary(job.salaryMin, job.salaryMax, job.salaryAverage)}
                        </td>
                        <td className="px-5 py-4 text-sm sm:px-6">
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-teal-700 transition hover:text-teal-900"
                          >
                            View posting
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </>
      ) : null}
    </main>
  );
}

function ChartWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="h-[320px] w-full">
      {children && <ResponsiveContainer>{children}</ResponsiveContainer>}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="panel h-36 animate-pulse rounded-[28px] bg-white/70 p-5"
        />
      ))}
    </section>
  );
}

function formatCurrency(value: number | null): string {
  return value === null ? "n/a" : currencyFormatter.format(value);
}

function formatSalary(
  salaryMin: number | null,
  salaryMax: number | null,
  salaryAverage: number | null,
): string {
  if (salaryAverage !== null) {
    return formatCurrency(salaryAverage);
  }

  if (salaryMin !== null) {
    return formatCurrency(salaryMin);
  }

  if (salaryMax !== null) {
    return formatCurrency(salaryMax);
  }

  return "n/a";
}
