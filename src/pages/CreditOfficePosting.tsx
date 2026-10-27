import { useCallback, useEffect, useMemo, useState } from "react";
import { getPostingHistory, getPostingQueue, postCourses } from "../api/client";
import CreditSummary from "../components/CreditSummary";
import Layout from "../components/Layout";
import type { BatchResult, PostedRecord, PostingCandidate } from "../types";

const credits = (n: number) => String(Math.round(n * 100) / 100);

export default function CreditOfficePosting() {
  const [queue, setQueue] = useState<PostingCandidate[] | null>(null);
  const [history, setHistory] = useState<PostedRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BatchResult | null>(null);

  const load = useCallback(async () => {
    try {
      const [q, h] = await Promise.all([getPostingQueue(), getPostingHistory()]);
      setQueue(q);
      setHistory(h);
      setSelected((prev) => new Set([...prev].filter((id) => q.some((c) => c.courseId === id && c.blockers.length === 0))));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the posting queue. Refresh to try again.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ready = useMemo(() => (queue ?? []).filter((c) => c.blockers.length === 0), [queue]);
  const blocked = (queue ?? []).length - ready.length;
  const byId = useMemo(() => new Map((queue ?? []).map((c) => [c.courseId, c])), [queue]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = ready.length > 0 && ready.every((c) => selected.has(c.courseId));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(ready.map((c) => c.courseId)));

  const confirmed = confirming?.map((id) => byId.get(id)).filter((c): c is PostingCandidate => Boolean(c)) ?? [];
  const confirmedCredits = confirmed.reduce((n, c) => n + c.credits, 0);

  const submit = async () => {
    if (!confirming) return;
    setBusy(true);
    setError("");
    try {
      const outcome = await postCourses(confirming);
      setResult(outcome);
      setConfirming(null);
      setSelected(new Set());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Posting failed. Nothing was changed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!confirming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) setConfirming(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming, busy]);

  const selectedCredits = [...selected].reduce((n, id) => n + (byId.get(id)?.credits ?? 0), 0);

  return (
    <Layout title="Credit office">
      <h1 className="text-xl font-semibold">Post results</h1>
      <p className="mt-1 text-sm text-slate-500">
        Department decisions and existing equivalencies, ready to post to the academic record as grade T. Rules are
        checked again when you post.
      </p>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {result && (
        <div role="status" className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <p>
            Posted {result.postedCount} {result.postedCount === 1 ? "course" : "courses"} ({credits(result.creditsPosted)} credits).
            {result.failedCount > 0 && ` ${result.failedCount} could not be posted:`}
          </p>
          {result.items.filter((i) => i.result === "failed").map((i) => (
            <p key={i.courseId} className="mt-1 text-red-800">
              {byId.get(i.courseId)?.courseCode ?? "Course"}: {i.detail}
            </p>
          ))}
          <button onClick={() => setResult(null)} className="mt-1 text-xs underline">Dismiss</button>
        </div>
      )}

      <div className="mt-5">
        <CreditSummary
          metrics={[
            { label: "Ready to post", value: String(ready.length) },
            { label: "Credits ready", value: credits(ready.reduce((n, c) => n + c.credits, 0)) },
            { label: "Needs attention", value: String(blocked), hint: "A rule no longer passes" },
            { label: "Posted recently", value: String(history.length) },
          ]}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Waiting to be posted</h2>
        <button
          disabled={selected.size === 0}
          onClick={() => setConfirming([...selected])}
          className="rounded-lg bg-bu-red px-4 py-2 text-sm font-medium text-white hover:bg-bu-dark disabled:opacity-50"
        >
          Post selected ({selected.size}) &middot; {credits(selectedCredits)} credits
        </button>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
        {!queue && !error ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : queue && queue.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nothing is waiting. New decisions appear here.</p>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" aria-label="Select all ready courses" checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium">Credits</th>
                <th className="px-4 py-3 font-medium">Basis</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {queue?.map((c) => {
                const blockedRow = c.blockers.length > 0;
                return (
                  <tr key={c.courseId} className="border-b border-slate-100 align-top">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${c.courseCode}`}
                        disabled={blockedRow}
                        checked={selected.has(c.courseId)}
                        onChange={() => toggle(c.courseId)}
                      />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{c.studentRef}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.courseCode}</p>
                      <p className="text-xs text-slate-500">{c.sourceSchool} &middot; grade {c.grade}</p>
                    </td>
                    <td className="px-4 py-3">{c.result}</td>
                    <td className="px-4 py-3 tabular-nums">{credits(c.credits)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {c.source === "DEPARTMENT_DECISION"
                        ? `Decided by ${c.decidedBy ?? "a department"}${c.decidedOn ? ` on ${c.decidedOn}` : ""}`
                        : "Existing equivalency"}
                      {c.reason && <p className="mt-0.5 max-w-[220px] text-slate-500">&ldquo;{c.reason}&rdquo;</p>}
                    </td>
                    <td className="px-4 py-3">
                      {blockedRow ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
                          Blocked
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          Ready
                        </span>
                      )}
                      {c.blockers.map((b) => <p key={b} className="mt-1 max-w-[200px] text-xs text-amber-800">{b}</p>)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={blockedRow}
                        onClick={() => setConfirming([c.courseId])}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
                      >
                        Post
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="mt-8 text-base font-semibold">Recently posted</h2>
      <div className="mt-3 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
        {history.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nothing has been posted yet.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium">Credits</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Posted by</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.postingId} className="border-b border-slate-100">
                  <td className="px-4 py-3 tabular-nums">{h.studentRef}</td>
                  <td className="px-4 py-3 font-medium">{h.courseCode}</td>
                  <td className="px-4 py-3">{h.result}</td>
                  <td className="px-4 py-3 tabular-nums">{credits(h.creditsPosted)}</td>
                  <td className="px-4 py-3">{h.gradePosted}</td>
                  <td className="px-4 py-3">{h.postedBy}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(h.postedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !busy) setConfirming(null);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h2 id="confirm-title" className="text-lg font-semibold">
              Post {confirmed.length} {confirmed.length === 1 ? "course" : "courses"} to the academic record?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {credits(confirmedCredits)} credits will be posted as grade T. A posting can&apos;t be edited or removed here.
            </p>
            <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-3 text-sm">
              {confirmed.map((c) => (
                <li key={c.courseId} className="flex justify-between gap-3">
                  <span>{c.studentRef} &middot; {c.courseCode} &rarr; {c.result}</span>
                  <span className="tabular-nums text-slate-600">{credits(c.credits)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button disabled={busy} onClick={() => setConfirming(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60">
                Cancel
              </button>
              <button disabled={busy} onClick={submit} className="rounded-lg bg-bu-red px-4 py-2 text-sm font-medium text-white hover:bg-bu-dark disabled:opacity-60">
                {busy ? "Posting..." : "Post to academic record"}
              </button>
            </div>
          </section>
        </div>
      )}
    </Layout>
  );
}
