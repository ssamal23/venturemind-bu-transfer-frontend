import { useEffect, useMemo, useState } from "react";
import { getReviewQueue, submitDecision } from "../api/client";
import ConfidenceBar from "../components/ConfidenceBar";
import CreditSummary from "../components/CreditSummary";
import Layout from "../components/Layout";
import type { DecisionOutcome, ReviewCase as Case } from "../types";
import ReviewCase from "./ReviewCase";

const OUTCOME_LABEL: Record<string, string> = {
  BU_EQUIVALENT: "BU equivalent",
  ELECTIVE: "Elective credit",
  NO_CREDIT: "No credit",
};

export default function EvaluatorQueue() {
  const [items, setItems] = useState<Case[] | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [dept, setDept] = useState("all");
  const [level, setLevel] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    getReviewQueue()
      .then(setItems)
      .catch(() => setError("Could not load the review queue. Refresh to try again."));
  }, []);

  const departments = useMemo(() => Array.from(new Set((items ?? []).map((i) => i.department))), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((i) => {
      if (dept !== "all" && i.department !== dept) return false;
      if (level === "high" && !(i.ai && i.ai.confidence >= 0.8)) return false;
      if (level === "low" && !(i.ai && i.ai.confidence < 0.8)) return false;
      if (level === "none" && i.ai) return false;
      if (q && !`${i.courseCode} ${i.courseTitle} ${i.sourceSchool}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, dept, level, query]);

  const metrics = useMemo(() => {
    const all = items ?? [];
    const oldest = all.reduce((m, i) => Math.max(m, i.waitingDays), 0);
    return [
      { label: "Waiting for review", value: String(all.length) },
      { label: "High confidence", value: String(all.filter((i) => i.ai && i.ai.confidence >= 0.8).length), hint: "80% or more" },
      { label: "No AI suggestion", value: String(all.filter((i) => !i.ai).length), hint: "Review manually" },
      { label: "Oldest case", value: all.length ? `${oldest} d` : "--" },
    ];
  }, [items]);

  const current = items?.find((i) => i.id === selected) ?? null;

  const decide = async (outcome: DecisionOutcome, reason: string) => {
    if (!current) return;
    await submitDecision(current.id, outcome, reason);
    setItems((prev) => (prev ?? []).filter((i) => i.id !== current.id));
    setSelected(null);
    setToast(
      outcome === "REQUEST_INFO"
        ? `Requested more information for ${current.courseCode}.`
        : `Decision recorded for ${current.courseCode}.`,
    );
  };

  return (
    <Layout title="Evaluator dashboard">
      <h1 className="text-xl font-semibold">Review queue</h1>
      <p className="mt-1 text-sm text-slate-500">
        AI suggestions are a starting point. You make the final decision on every course.
      </p>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {toast && (
        <p role="status" className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {toast}
          <button onClick={() => setToast("")} className="text-xs underline">Dismiss</button>
        </p>
      )}

      <div className="mt-5"><CreditSummary metrics={metrics} /></div>

      <div className="mt-6 flex flex-wrap gap-2">
        <select aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="all">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select aria-label="Confidence" value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="all">All confidence</option>
          <option value="high">High (80% or more)</option>
          <option value="low">Below 80%</option>
          <option value="none">No AI suggestion</option>
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search course or school"
          aria-label="Search course or school"
          className="min-w-[200px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-bu-red focus:ring-2 focus:ring-red-100"
        />
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
        {!items && !error ? (
          <p className="p-6 text-sm text-slate-500">Loading the queue...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {items && items.length === 0 ? "Queue is empty. Nothing is waiting for review." : "No cases match these filters."}
          </p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Source school</th>
                <th className="px-4 py-3 font-medium">AI suggestion</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium">Waiting</th>
                <th className="px-4 py-3 font-medium"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className={`border-b border-slate-100 ${selected === i.id ? "bg-slate-50" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{i.courseCode}</p>
                    <p className="text-xs text-slate-500">{i.department}</p>
                  </td>
                  <td className="px-4 py-3">{i.sourceSchool}</td>
                  <td className="px-4 py-3">
                    {i.ai ? (i.ai.buCourse ?? OUTCOME_LABEL[i.ai.outcome]) : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">No suggestion</span>}
                  </td>
                  <td className="px-4 py-3">{i.ai ? <ConfidenceBar value={i.ai.confidence} /> : "--"}</td>
                  <td className="px-4 py-3 tabular-nums">{i.waitingDays} d</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setSelected(i.id); setToast(""); }}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {current && <ReviewCase key={current.id} item={current} onDecide={decide} onClose={() => setSelected(null)} />}
    </Layout>
  );
}
