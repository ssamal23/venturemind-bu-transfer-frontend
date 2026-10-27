import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getInstitutions, uploadTranscript } from "../api/client";
import Layout from "../components/Layout";
import type { Institution } from "../types";

const MAX_MB = 10;
const ACCEPT = ".pdf,.doc,.docx";

export default function UploadTranscript() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<Institution[] | null>(null);
  const [schoolId, setSchoolId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getInstitutions()
      .then(setSchools)
      .catch(() => setError("Could not load the list of schools. Refresh to try again."));
  }, []);

  const school = schools?.find((s) => s.id === schoolId);

  const pick = (f: File | null) => {
    setError("");
    if (f && f.size > MAX_MB * 1024 * 1024) {
      setError(`That file is larger than ${MAX_MB} MB.`);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!schoolId) return setError("Choose the school this transcript is from.");
    if (!file) return setError("Choose a transcript file to upload.");
    setBusy(true);
    setError("");
    try {
      await uploadTranscript(schoolId, file);
      navigate("/student", { state: { uploaded: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
      setBusy(false);
    }
  };

  return (
    <Layout title="Upload a transcript">
      <Link to="/student" className="text-sm text-slate-500 hover:text-slate-800">&larr; Back to your dashboard</Link>
      <h1 className="mt-3 text-xl font-semibold">Upload a transcript</h1>
      <p className="mt-1 max-w-xl text-sm text-slate-500">
        We read the courses, credits and grades from the file and check each one against BU&apos;s equivalency list.
        Courses we can&apos;t match yet will ask you for a syllabus. A BU academic department makes every final decision.
      </p>

      <form onSubmit={submit} noValidate className="mt-6 max-w-xl space-y-5 rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <div>
          <label htmlFor="school" className="text-sm font-medium">School</label>
          <select
            id="school"
            value={schoolId}
            onChange={(e) => { setSchoolId(e.target.value); setError(""); }}
            disabled={!schools}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-bu-red focus:ring-2 focus:ring-red-100"
          >
            <option value="">{schools ? "Choose a school" : "Loading..."}</option>
            {schools?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {school?.calendarType === "QUARTER" && (
            <p className="mt-1 text-xs text-slate-500">
              This school uses quarter credits. They convert at two-thirds (a 4-credit course counts as 2.66).
            </p>
          )}
        </div>

        <div>
          <label htmlFor="file" className="text-sm font-medium">Transcript file</label>
          <input
            id="file"
            type="file"
            accept={ACCEPT}
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm hover:file:bg-slate-50"
          />
          <p className="mt-1 text-xs text-slate-500">PDF or DOCX, up to {MAX_MB} MB. Scanned images can&apos;t be read automatically.</p>
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-bu-red px-4 py-2.5 text-sm font-medium text-white hover:bg-bu-dark disabled:opacity-60"
        >
          {busy ? "Uploading..." : "Upload transcript"}
        </button>
      </form>
    </Layout>
  );
}
