import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getStudentSummary, uploadSyllabus } from "../api/client";
import CourseStatusBadge from "../components/CourseStatusBadge";
import CreditSummary from "../components/CreditSummary";
import Layout from "../components/Layout";
import StatusTimeline from "../components/StatusTimeline";
import { useAuth } from "../hooks/useAuth";
import type { StudentSummary } from "../types";
import { formatCredits } from "../utils/format";

export default function StudentDashboard() {
  const { user } = useAuth();
  const location = useLocation() as { state: { uploaded?: boolean } | null };
  const [data, setData] = useState<StudentSummary | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingCourse = useRef<string>("");

  useEffect(() => {
    if (!user) return;
    getStudentSummary(user.id)
      .then(setData)
      .catch(() => setError("Could not load your courses. Refresh to try again."));
  }, [user]);

  // While a transcript is being read, check again every few seconds so the courses appear on their own.
  const reading = data?.transcripts.some((t) => t.status === "PENDING") ?? false;
  useEffect(() => {
    if (!user || !reading) return;
    const timer = setInterval(() => {
      getStudentSummary(user.id).then(setData).catch(() => undefined);
    }, 4000);
    return () => clearInterval(timer);
  }, [user, reading]);

  const metrics = useMemo(() => {
    const courses = data?.courses ?? [];
    const secured = courses
      .filter((c) => c.status === "MATCHED" || c.status === "DECIDED" || c.status === "POSTED")
      .reduce((sum, c) => sum + (c.credits ?? 0), 0);
    return [
      { label: "Secured credits", value: String(Math.round(secured * 100) / 100), hint: "Matched or decided" },
      { label: "In department review", value: String(courses.filter((c) => c.status === "IN_REVIEW").length), hint: "Courses" },
      { label: "Needs your action", value: String(courses.filter((c) => c.status === "AWAITING_SYLLABUS").length), hint: "Syllabus needed" },
      { label: "Days left", value: String(data?.daysLeft ?? "--"), hint: "All credits within 1 year of starting" },
    ];
  }, [data]);

  const pickFile = (courseId: string) => {
    pendingCourse.current = courseId;
    fileRef.current?.click();
  };

  const onFile = async (file: File | undefined) => {
    if (!file || !user) return;
    const courseId = pendingCourse.current;
    setUploading(courseId);
    setError("");
    try {
      setData(await uploadSyllabus(user.id, courseId, file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setUploading(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Layout title="Student dashboard">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Your transfer credit</h1>
          <p className="mt-1 text-sm text-slate-500">
            Each course shows who has it and what happens next. Final decisions are made by BU academic departments.
          </p>
        </div>
        <Link
          to="/student/upload"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Upload a transcript
        </Link>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {location.state?.uploaded && !data?.transcripts.length && (
        <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Transcript received.
        </p>
      )}
      {data?.transcripts.map((t) =>
        t.status === "PENDING" ? (
          <p key={t.id} role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" aria-hidden="true" />
            Reading your transcript from {t.school}. Your courses will appear here in a minute.
          </p>
        ) : (
          <p key={t.id} role="alert" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            We couldn&apos;t read your transcript from {t.school}. {t.error}
          </p>
        ),
      )}

      <div className="mt-5">
        <CreditSummary metrics={metrics} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
        {!data && !error ? (
          <p className="p-6 text-sm text-slate-500">Loading your courses...</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Your course</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">BU result</th>
                <th className="px-4 py-3 font-medium">Credits</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {data?.courses.map((c) => (
                <Fragment key={c.id}>
                  <tr className="border-b border-slate-100 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.sourceCode}</p>
                      <p className="text-xs text-slate-500">{c.sourceSchool}</p>
                    </td>
                    <td className="px-4 py-3">{c.grade}</td>
                    <td className="px-4 py-3">{c.buResult ?? "Pending"}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCredits(c.credits)}</td>
                    <td className="px-4 py-3">
                      <CourseStatusBadge status={c.status} />
                      {c.note && <p className="mt-1 max-w-[220px] text-xs text-slate-500">{c.note}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === "AWAITING_SYLLABUS" ? (
                        <button
                          onClick={() => pickFile(c.id)}
                          disabled={uploading === c.id}
                          className="rounded-lg bg-bu-red px-3 py-1.5 text-xs font-medium text-white hover:bg-bu-dark disabled:opacity-60"
                        >
                          {uploading === c.id ? "Uploading..." : "Upload syllabus"}
                        </button>
                      ) : (
                        <button
                          onClick={() => setOpen(open === c.id ? null : c.id)}
                          aria-expanded={open === c.id}
                          className="text-xs font-medium text-slate-600 underline-offset-2 hover:underline"
                        >
                          {open === c.id ? "Hide timeline" : "View timeline"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {open === c.id && (
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <td colSpan={6} className="px-6 py-4">
                        <StatusTimeline events={c.timeline} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </Layout>
  );
}
