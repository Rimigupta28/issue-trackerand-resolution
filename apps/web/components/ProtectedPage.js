"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, clearToken, getToken } from "../lib/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const navItems = [
  { href: "/", label: "Overview", mark: "◫" },
  { href: "/issues", label: "All issues", mark: "▤" },
];

export default function ProtectedPage({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    if (!getToken()) {
      router.replace("/login");
      return () => { active = false; };
    }
    api("/auth/me")
      .then((result) => { if (active) setUser(result.user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  function signOut() {
    clearToken();
    router.replace("/login");
  }

  if (loading || !user) {
    return (
      <main className="grid min-h-screen place-items-center text-sm font-medium text-muted">
        {loading ? "Loading your workspace…" : "Redirecting to sign in…"}
      </main>
    );
  }

  return (
    <AuthContext.Provider value={{ user }}>
      <div className="min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-line bg-white px-5 py-6 lg:flex">
          <Link href="/" className="mb-10 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-bold text-white">I</span>
            <span>
              <span className="block text-base font-bold tracking-tight text-ink">IssueDesk</span>
              <span className="block text-xs text-muted">Team workspace</span>
            </span>
          </Link>
          <div className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Workspace</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const selected = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${selected ? "bg-indigo-50 text-brand" : "text-slate-600 hover:bg-slate-50"}`}>
                  <span aria-hidden="true" className="w-5 text-center text-base">{item.mark}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl bg-canvas p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Practice project</div>
            <p className="text-xs leading-5 text-slate-600">Keep issue ownership, priority, and progress in one shared place.</p>
          </div>
        </aside>
        <div className="lg:pl-64">
          <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-line bg-white/95 px-5 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-bold text-white">I</span>
              <span className="font-bold">IssueDesk</span>
            </div>
            <div className="hidden text-sm text-muted lg:block">Issue tracking &amp; resolution</div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold text-ink">{user.name}</div>
                <div className="text-xs text-muted">{user.email}</div>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-brand" aria-hidden="true">
                {user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <button onClick={signOut} className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100" type="button">Sign out</button>
            </div>
          </header>
          <nav className="flex gap-2 border-b border-line bg-white px-5 py-2 lg:hidden">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`rounded-lg px-3 py-2 text-sm font-semibold ${item.href === "/" ? pathname === "/" : pathname.startsWith(item.href) ? "bg-indigo-50 text-brand" : "text-slate-600"}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9">
            {children}
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  );
}
