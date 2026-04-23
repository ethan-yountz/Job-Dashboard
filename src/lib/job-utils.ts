import type {
  CountMetric,
  DashboardSnapshot,
  JobFilters,
  JobPosting,
  RemoteClassification,
  RemotePreference,
  SalaryMetric,
} from "@/types/jobs";

export const DEFAULT_FILTERS: JobFilters = {
  keyword: "data scientist",
  location: "",
  remotePreference: "any",
};

const MAX_TERM_LENGTH = 80;

const SKILL_PATTERNS: Array<{ label: string; patterns: RegExp[] }> = [
  { label: "Python", patterns: [/\bpython\b/i] },
  { label: "SQL", patterns: [/\bsql\b/i] },
  { label: "Machine Learning", patterns: [/machine learning/i, /\bml\b/i] },
  { label: "Deep Learning", patterns: [/deep learning/i] },
  { label: "PyTorch", patterns: [/pytorch/i] },
  { label: "TensorFlow", patterns: [/tensorflow/i] },
  { label: "scikit-learn", patterns: [/scikit-learn/i, /\bsklearn\b/i] },
  { label: "Pandas", patterns: [/pandas/i] },
  { label: "NumPy", patterns: [/numpy/i] },
  { label: "AWS", patterns: [/\baws\b/i, /amazon web services/i] },
  { label: "Azure", patterns: [/\bazure\b/i] },
  { label: "GCP", patterns: [/\bgcp\b/i, /google cloud/i] },
  { label: "Spark", patterns: [/apache spark/i, /\bspark\b/i] },
  { label: "Airflow", patterns: [/airflow/i] },
  { label: "ETL", patterns: [/\betl\b/i] },
  { label: "Tableau", patterns: [/tableau/i] },
  { label: "Power BI", patterns: [/power\s?bi/i] },
  { label: "Excel", patterns: [/\bexcel\b/i] },
  {
    label: "Data Visualization",
    patterns: [/data visuali[sz]ation/i, /\bdashboard(s)?\b/i],
  },
  { label: "A/B Testing", patterns: [/a\/b testing/i, /experimentation/i] },
  { label: "Statistics", patterns: [/statistics/i, /statistical/i] },
  { label: "NLP", patterns: [/\bnlp\b/i, /natural language processing/i] },
  { label: "LLMs", patterns: [/\bllm(s)?\b/i, /large language model/i] },
  { label: "Docker", patterns: [/\bdocker\b/i] },
  { label: "Kubernetes", patterns: [/\bkubernetes\b/i, /\bk8s\b/i] },
  { label: "APIs", patterns: [/\bapi(s)?\b/i] },
  { label: "React", patterns: [/\breact\b/i] },
  { label: "Next.js", patterns: [/next\.?js/i] },
  { label: "TypeScript", patterns: [/typescript/i] },
  { label: "JavaScript", patterns: [/javascript/i] },
  { label: "Git", patterns: [/\bgit\b/i] },
  { label: "Data Analysis", patterns: [/data analy(sis|tics)/i, /\banalytics\b/i] },
  { label: "Computer Vision", patterns: [/computer vision/i] },
];

export interface AdzunaJobResult {
  id?: string | number;
  title?: string;
  description?: string;
  redirect_url?: string;
  created?: string;
  contract_type?: string | null;
  contract_time?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  company?: {
    display_name?: string;
  };
  location?: {
    display_name?: string;
    area?: string[];
  };
}

export function sanitizeText(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function sanitizeFilters(input: {
  keyword?: string | null;
  location?: string | null;
  remotePreference?: string | null;
}): JobFilters {
  const remotePreference = isRemotePreference(input.remotePreference)
    ? input.remotePreference
    : DEFAULT_FILTERS.remotePreference;

  return {
    keyword: sanitizeText(input.keyword).slice(0, MAX_TERM_LENGTH) || DEFAULT_FILTERS.keyword,
    location: sanitizeText(input.location).slice(0, MAX_TERM_LENGTH),
    remotePreference,
  };
}

function isRemotePreference(value: string | null | undefined): value is RemotePreference {
  return value === "any" || value === "remote-friendly" || value === "non-remote";
}

export function computeAverageSalary(
  salaryMin: number | null | undefined,
  salaryMax: number | null | undefined,
): number | null {
  const min = typeof salaryMin === "number" ? salaryMin : null;
  const max = typeof salaryMax === "number" ? salaryMax : null;

  if (min !== null && max !== null) {
    return Math.round((min + max) / 2);
  }

  if (min !== null) {
    return Math.round(min);
  }

  if (max !== null) {
    return Math.round(max);
  }

  return null;
}

export function detectRemoteClassification(
  title: string,
  description: string,
  location: string,
): RemoteClassification {
  const haystack = `${title} ${description} ${location}`.toLowerCase();

  if (/\bhybrid\b/.test(haystack)) {
    return "Hybrid";
  }

  if (
    /\bremote\b/.test(haystack) ||
    /work from home/.test(haystack) ||
    /distributed team/.test(haystack)
  ) {
    return "Remote";
  }

  if (/\bon[\s-]?site\b/.test(haystack) || /\bin office\b/.test(haystack)) {
    return "On-site";
  }

  return "Unknown";
}

export function extractSkills(text: string): string[] {
  const normalized = sanitizeText(text);

  return SKILL_PATTERNS.filter(({ patterns }) =>
    patterns.some((pattern) => pattern.test(normalized)),
  ).map(({ label }) => label);
}

export function normalizeAdzunaJob(result: AdzunaJobResult): JobPosting {
  const title = sanitizeText(result.title) || "Untitled role";
  const description = sanitizeText(result.description);
  const company = sanitizeText(result.company?.display_name) || "Unknown company";
  const location =
    sanitizeText(result.location?.display_name) ||
    sanitizeText(result.location?.area?.join(", ")) ||
    "Unknown location";

  const salaryAverage = computeAverageSalary(result.salary_min, result.salary_max);
  const remoteClassification = detectRemoteClassification(title, description, location);

  return {
    id: String(result.id ?? `${title}-${company}-${location}`),
    title,
    company,
    location,
    url: result.redirect_url ?? "#",
    descriptionSnippet: description.slice(0, 220) + (description.length > 220 ? "..." : ""),
    salaryMin: typeof result.salary_min === "number" ? result.salary_min : null,
    salaryMax: typeof result.salary_max === "number" ? result.salary_max : null,
    salaryAverage,
    postedAt: result.created ?? null,
    remoteClassification,
    skills: extractSkills(`${title} ${description}`),
    contractType: result.contract_type ?? null,
    contractTime: result.contract_time ?? null,
    source: "adzuna",
  };
}

export function matchesFilters(job: JobPosting, filters: JobFilters): boolean {
  const keyword = filters.keyword.toLowerCase();
  const location = filters.location.toLowerCase();
  const searchableText = [
    job.title,
    job.company,
    job.location,
    job.descriptionSnippet,
    job.skills.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  const keywordMatch = !keyword || searchableText.includes(keyword);
  const locationMatch = !location || job.location.toLowerCase().includes(location);

  if (!keywordMatch || !locationMatch) {
    return false;
  }

  if (filters.remotePreference === "remote-friendly") {
    return job.remoteClassification === "Remote" || job.remoteClassification === "Hybrid";
  }

  if (filters.remotePreference === "non-remote") {
    return job.remoteClassification === "On-site" || job.remoteClassification === "Unknown";
  }

  return true;
}

export function buildDashboardSnapshot(
  jobs: JobPosting[],
  totalAvailable: number | null,
): DashboardSnapshot {
  const salaryValues = jobs
    .map((job) => job.salaryAverage)
    .filter((salary): salary is number => salary !== null);

  const averageSalary =
    salaryValues.length > 0
      ? Math.round(salaryValues.reduce((sum, salary) => sum + salary, 0) / salaryValues.length)
      : null;

  return {
    totalPostings: jobs.length,
    averageSalary,
    salarySampleSize: salaryValues.length,
    topHiringCompanies: buildCountMetrics(jobs.map((job) => job.company), 5),
    topLocations: buildCountMetrics(jobs.map((job) => job.location), 5),
    topSkills: buildCountMetrics(jobs.flatMap((job) => job.skills), 10),
    salaryByTitle: buildSalaryByTitle(jobs, 8),
    jobsByLocation: buildCountMetrics(jobs.map((job) => job.location), 8),
    companiesByPostingCount: buildCountMetrics(jobs.map((job) => job.company), 8),
    remoteBreakdown: buildCountMetrics(
      jobs.map((job) => job.remoteClassification),
      4,
      totalAvailable ?? undefined,
    ),
  };
}

function buildCountMetrics(
  values: string[],
  limit: number,
  fallbackTotal?: number,
): CountMetric[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    const key = sanitizeText(value) || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const results = Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);

  if (results.length === 0 && fallbackTotal) {
    return [{ label: "No matching postings", value: fallbackTotal }];
  }

  return results;
}

function buildSalaryByTitle(jobs: JobPosting[], limit: number): SalaryMetric[] {
  const aggregates = new Map<string, { total: number; count: number }>();

  for (const job of jobs) {
    if (job.salaryAverage === null) {
      continue;
    }

    const key = normalizeTitle(job.title);
    const current = aggregates.get(key) ?? { total: 0, count: 0 };
    aggregates.set(key, {
      total: current.total + job.salaryAverage,
      count: current.count + 1,
    });
  }

  return Array.from(aggregates.entries())
    .map(([label, aggregate]) => ({
      label,
      value: Math.round(aggregate.total / aggregate.count),
      postings: aggregate.count,
    }))
    .sort((a, b) => b.value - a.value || b.postings - a.postings)
    .slice(0, limit);
}

function normalizeTitle(title: string): string {
  return toTitleCase(
    sanitizeText(title)
      .toLowerCase()
      .replace(/\b(sr|senior|jr|junior|lead|staff|principal|ii|iii|iv)\b/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
