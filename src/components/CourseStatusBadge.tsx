import type { CourseStatus } from "../types";

const STYLES: Record<CourseStatus, { label: string; cls: string }> = {
  MATCHED: { label: "Matched", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  DECIDED: { label: "Decided", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  IN_REVIEW: { label: "In department review", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  AWAITING_SYLLABUS: { label: "Syllabus needed", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  NOT_ELIGIBLE: { label: "Not eligible", cls: "bg-red-50 text-red-700 ring-red-200" },
  POSTED: { label: "Posted to record", cls: "bg-emerald-100 text-emerald-800 ring-emerald-300" },
};

export default function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const s = STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.cls}`}>
      {s.label}
    </span>
  );
}
