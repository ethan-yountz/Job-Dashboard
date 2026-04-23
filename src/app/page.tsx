import { DashboardShell } from "@/components/dashboard-shell";

export default function Home() {
  return <DashboardShell aiSummaryEnabled={Boolean(process.env.OPENAI_API_KEY)} />;
}
