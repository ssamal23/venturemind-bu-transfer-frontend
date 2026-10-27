import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Layout({ title, children }: { title: string; children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-bu-red text-sm font-bold text-white">BU</span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Transfer credit</p>
            <p className="text-xs text-slate-500">{title}</p>
          </div>
          <div className="flex-1" />
          {user && (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden sm:inline">{user.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">{user.role.replace("_", " ")}</span>
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
