"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, explainError, setToken } from "../../lib/api";
import { InlineError } from "../../components/IssueUI";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("alex@example.com");
  const [password, setPassword] = useState("Practice123!");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(result.token);
      router.replace("/");
    } catch (loginError) {
      setError(explainError(loginError));
      setSaving(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#222e55] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-24 -top-20 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-48 -left-20 h-[34rem] w-[34rem] rounded-full border border-white/10" />
        <Link href="/" className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-xl font-bold text-brand">I</span>
          <span className="text-lg font-bold">IssueDesk</span>
        </Link>
        <div className="relative max-w-xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Less chasing. More resolving.</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">Make every issue easier to move forward.</h1>
          <p className="mt-5 max-w-lg leading-7 text-slate-300">A calm, shared workspace for reporting, prioritizing, and resolving your team’s work.</p>
          <div className="mt-9 flex gap-2">
            <span className="h-1.5 w-8 rounded-full bg-indigo-300" />
            <span className="h-1.5 w-3 rounded-full bg-white/30" />
            <span className="h-1.5 w-3 rounded-full bg-white/30" />
          </div>
        </div>
        <p className="relative text-xs text-slate-400">A focused issue workflow for small teams.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[410px]">
          <div className="mb-8 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-xl font-bold text-white">I</span>
          </div>
          <p className="text-sm font-semibold text-brand">Welcome back</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">Sign in to IssueDesk</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Use your team account to access the issue workspace.</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <InlineError>{error}</InlineError>
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input className="field" id="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label mb-0" htmlFor="password">Password</label>
              </div>
              <input className="field" id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <button className="btn-primary w-full py-3" disabled={saving} type="submit">{saving ? "Signing in…" : "Sign in"}</button>
          </form>
          <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-brand">Practice demo account</div>
            <div className="mt-2 text-xs leading-5 text-slate-600">alex@example.com <span className="text-slate-400">·</span> Practice123!</div>
          </div>
          <p className="mt-7 text-center text-xs text-muted">Demo credentials are for local practice only.</p>
        </div>
      </section>
    </main>
  );
}
