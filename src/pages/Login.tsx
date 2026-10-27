import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { DEMO_PASSWORD, demoUsers } from "../api/mock";
import { useAuth } from "../hooks/useAuth";
import { homeFor } from "../utils/routes";

const POINTS = [
  "See where every transferred course stands, not just zero units",
  "AI suggests matches with cited evidence",
  "Academic departments always make the final decision",
];

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const u = await signIn(email, password);
      navigate(homeFor(u.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const fill = (mail: string) => {
    setEmail(mail);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-bu-red p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded bg-white text-base font-bold text-bu-red">BU</span>
          <span className="text-lg font-semibold">Transfer credit evaluation</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight">Faster, clearer transfer credit decisions</h1>
          <ul className="mt-6 space-y-3 text-base text-red-50">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-white" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-red-100">Hackathon prototype. Synthetic data only.</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Use a demo account to explore each role.</p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="name@school.edu"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-bu-red focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-bu-red focus:ring-2 focus:ring-red-100"
              />
            </div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-bu-red px-4 py-2.5 text-sm font-medium text-white hover:bg-bu-dark disabled:opacity-60"
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Demo accounts</p>
            <div className="mt-2 space-y-2">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => fill(u.email)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-slate-400"
                >
                  <span>
                    <span className="block font-medium">{u.name}</span>
                    <span className="block text-xs text-slate-500">{u.email}</span>
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">{u.role}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Pick one to fill the form, then sign in.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
