interface Metric {
  label: string;
  value: string;
  hint?: string;
}

export default function CreditSummary({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((m) => (
        <div key={m.label} className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">{m.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{m.value}</p>
          {m.hint && <p className="mt-1 text-xs text-slate-500">{m.hint}</p>}
        </div>
      ))}
    </div>
  );
}
