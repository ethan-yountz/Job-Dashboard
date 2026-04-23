interface MetricCardProps {
  title: string;
  value: string;
  description: string;
}

export function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <article className="panel h-full rounded-[28px] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {title}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-3 text-sm text-slate-600">{description}</p>
    </article>
  );
}
