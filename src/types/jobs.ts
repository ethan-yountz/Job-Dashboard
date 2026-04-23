export type RemotePreference = "any" | "remote-friendly" | "non-remote";

export type RemoteClassification = "Remote" | "Hybrid" | "On-site" | "Unknown";

export type DataSource = "adzuna" | "mock";

export interface JobFilters {
  keyword: string;
  location: string;
  remotePreference: RemotePreference;
}

export interface CountMetric {
  label: string;
  value: number;
}

export interface SalaryMetric {
  label: string;
  value: number;
  postings: number;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  descriptionSnippet: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryAverage: number | null;
  postedAt: string | null;
  remoteClassification: RemoteClassification;
  skills: string[];
  contractType: string | null;
  contractTime: string | null;
  source: DataSource;
}

export interface DashboardSnapshot {
  totalPostings: number;
  averageSalary: number | null;
  salarySampleSize: number;
  topHiringCompanies: CountMetric[];
  topLocations: CountMetric[];
  topSkills: CountMetric[];
  salaryByTitle: SalaryMetric[];
  jobsByLocation: CountMetric[];
  companiesByPostingCount: CountMetric[];
  remoteBreakdown: CountMetric[];
}

export interface JobsApiResponse {
  filters: JobFilters;
  country: string;
  fetchedAt: string;
  source: DataSource;
  notice?: string;
  aiSummaryAvailable: boolean;
  totalAvailable: number | null;
  jobs: JobPosting[];
  snapshot: DashboardSnapshot;
}

export interface SummaryRequestPayload {
  filters: JobFilters;
  totalAvailable: number | null;
  snapshot: DashboardSnapshot;
  recentTitles: string[];
}
