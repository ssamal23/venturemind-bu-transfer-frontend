import { useEffect, useState } from "react";
import ConfidenceBar from "../components/ConfidenceBar";
import type { DecisionOutcome, ReviewCase as Case } from "../types";

const OUTCOME_LABEL: Record<string, string> = {
  BU_EQUIVALENT: "BU equivalent",
  ELECTIVE: "Elective credit",
  NO_CREDIT: "No credit",
};

interface Props {
  item: Case;
  onDecide: (outcome: DecisionOutcome, reason: string) => Promise<void>;
  onClose: () => void;
}

export default function ReviewCase({ item, onDecide, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const decide = async (outcome: DecisionOutcome) => {
    if (!reason.trim()) {
      setError("Enter a reason. It is saved with your decision.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onDecide(outcome, reason.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the decision. Try again.");
      setBusy(false);
    }
  };

  const ai = item.ai;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-title"
      className="w-full max-w-4xl rounded-xl bg-white p-5 shadow-xl"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="case-title" className="text-lg font-semibold">
          {item.courseCode}
          {item.buCourse ? ` to ${item.buCourse.code}` : ""}
        </h2>
        {ai && (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700 ring-1 ring-inset ring-blue-200">
            Suggested by {ai.model}
          </span>
        )}
        <div className="flex-1" />
        <button onClick={onClose} aria-label="Close" className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800">Close &#10005;</button>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {item.studentRef} &middot; {item.sourceSchool} &middot; grade {item.grade} &middot; {item.credits} credits
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3 text-sm">
          <h3 className="font-medium">Student syllabus</h3>
          <p className="mt-1 text-slate-700">{item.courseTitle}</p>
          <ul className="mt-2 list-disc pl-5 text-slate-600">
            {item.syllabusOutcomes.map((o) => <li key={o}>{o}</li>)}
          </ul>
          <p className="mt-2 text-slate-500">{item.syllabusNotes}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 text-sm">
          <h3 className="font-medium">BU course</h3>
          {item.buCourse ? (
            <>
              <p className="mt-1 text-slate-700">{item.buCourse.code}: {item.buCourse.title} ({item.buCourse.credits} credits)</p>
              <ul className="mt-2 list-disc pl-5 text-slate-600">
                {item.buCourse.outcomes.map((o) => <li key={o}>{o}</li>)}
              </ul>
            </>
          ) : (
            <p className="mt-1 text-slate-500">No single BU course was proposed.</p>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3 text-sm">
          <h3 className="font-medium">AI suggestion</h3>
          {ai ? (
            <>
              <div className="mt-1 flex items-center gap-3">
                <span>{OUTCOME_LABEL[ai.outcome]}</span>
                <ConfidenceBar value={ai.confidence} />
              </div>
              <ul className="mt-2 list-disc pl-5 text-slate-600">
                {ai.evidence.map((e) => <li key={e}>{e}</li>)}
              </ul>
              <p className="mt-2 text-amber-700">Gap: {ai.gaps}</p>
            </>
          ) : (
            <p className="mt-1 text-slate-500">
              No AI suggestion: all providers were unavailable. Review this case manually.
            </p>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 p-3 text-sm">
          <h3 className="font-medium">Rule checks (code, not AI)</h3>
          <ul className="mt-2 space-y-1">
            {item.rules.map((r) => (
              <li key={r.label} className="flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-xs ${r.note ? "bg-slate-100 text-slate-600" : r.pass ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {r.note ? "Note" : r.pass ? "Pass" : "Fail"}
                </span>
                {r.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="reason" className="text-sm font-medium">Decision reason (required)</label>
        <textarea
          id="reason"
          rows={2}
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(""); }}
          placeholder="Syllabus covers the core topics of the BU course"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bu-red focus:ring-2 focus:ring-red-100"
        />
        {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={() => decide("BU_EQUIVALENT")}
            className="rounded-lg bg-bu-red px-3 py-2 text-sm font-medium text-white hover:bg-bu-dark disabled:opacity-60"
          >
            {item.buCourse ? `Approve as ${item.buCourse.code}` : "Approve BU equivalent"}
          </button>
          <button disabled={busy} onClick={() => decide("ELECTIVE")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60">Elective credit</button>
          <button disabled={busy} onClick={() => decide("NO_CREDIT")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60">No credit</button>
          <button disabled={busy} onClick={() => decide("REQUEST_INFO")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60">Request more info</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Your decision is final and is logged with your name, time and reason. The AI cannot post anything.
        </p>
      </div>
    </section>
    </div>
  );
}
