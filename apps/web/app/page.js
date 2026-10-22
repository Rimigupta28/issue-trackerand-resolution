"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedPage from "../components/ProtectedPage";
import { IssueTable, PageHeading } from "../components/IssueUI";
import { api, explainError } from "../lib/api";

function DashboardContent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/dashboard").then(setData).catch((requestError) => setError(explainError(requestError)));
  }, []);

  const stats = [
    { label: "Open issues", key: "open", tone: "text-blue-700", icon: "○" },
    { label: "In progress", key: "inProgress", tone: "text-amber-700", icon: "◷" },
    { label: "Resolved", key: "resolved", tone: "text-emerald-700", icon: "✓" },
    { label: "Assigned to me", key: "assignedToMe", tone: "text-brand", icon: "↗" },
  ];

  return (
    <>
      <PageHeading eyebrow="Workspace overview" title="Good work starts with clarity." description="A quick view of the issues that need attention across your team." action={<Link href="/issues/new" className="btn-primary">＋ New issue</Link>} />
      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Issue summary">
        {stats.map((stat) => (
          <div className="panel p-5" key={stat.key}>
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-muted">{stat.label}</span>
              <span aria-hidden="true" className={`grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-lg ${stat.tone}`}>{stat.icon}</span>
            </div>
            <div className={`mt-4 text-3xl font-bold tracking-tight ${stat.tone}`}>{data ? data.counts[stat.key] : "—"}</div>
            <div className="mt-1 text-xs text-muted">Current workspace</div>
          </div>
        ))}
      </section>
      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-bold text-ink">Recently updated</h2>
            <p className="mt-1 text-xs text-muted">The latest active issues across your team.</p>
          </div>
          <Link href="/issues" className="text-sm font-semibold text-brand hover:text-indigo-700">View all issues →</Link>
        </div>
        {!data ? <div className="p-6 text-sm text-muted">Loading issues…</div> : <IssueTable issues={data.recentIssues} emptyMessage="Create an issue to start tracking work." />}
      </section>
    </>
  );
}

export default function HomePage() {
  return <ProtectedPage><DashboardContent /></ProtectedPage>;
}
