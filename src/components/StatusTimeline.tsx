import type { TimelineEvent } from "../types";

export default function StatusTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="space-y-2 border-l border-slate-200 pl-4">
      {events.map((e, i) => (
        <li key={i} className="relative text-sm">
          <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-bu-red" />
          <span className="mr-2 text-xs text-slate-500">{e.date}</span>
          {e.label}
        </li>
      ))}
    </ol>
  );
}
