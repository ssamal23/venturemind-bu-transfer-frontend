import { pct } from "../utils/format";

export default function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 0.8 ? "bg-emerald-500" : value >= 0.6 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2" aria-label={`Confidence ${pct(value)}`}>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full ${color}`} style={{ width: pct(value) }} />
      </div>
      <span className="text-xs tabular-nums text-slate-600">{pct(value)}</span>
    </div>
  );
}
