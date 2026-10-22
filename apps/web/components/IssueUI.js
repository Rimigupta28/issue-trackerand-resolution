"use client";

import Link from "next/link";
import { formatDate } from "../lib/format";
import { titleCase } from "../lib/format";

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <div className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-brand">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[30px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const statusClasses = {
  OPEN: "bg-blue-50 text-blue-700 ring-blue-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-200",
};
const priorityClasses = {
  LOW: "bg-slate-100 text-slate-600 ring-slate-200",
  MEDIUM: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  HIGH: "bg-orange-50 text-orange-700 ring-orange-200",
  URGENT: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function LabelChips({ labels = [] }) {
  if (!labels.length) return <span className="text-sm text-slate-400">No labels</span>;
  return (
    <div className="flex max-w-56 flex-wrap gap-1.5">
      {labels.map((label) => (
        <span className="rounded-md border border-violet-100 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700" key={label}>
          {titleCase(label)}
        </span>
      ))}
    </div>
  );
}

export function Badge({ value, type = "status" }) {
  const classes = type === "priority" ? priorityClasses[value] : statusClasses[value];
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${classes || "bg-slate-100 text-slate-600 ring-slate-200"}`}>{titleCase(value)}</span>;
}

export function IssueTable({ issues, emptyMessage = "No issues match your filters." }) {
  if (!issues.length) {
    return <div className="px-6 py-14 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-xl text-brand">✓</div>
      <p className="text-sm font-semibold text-ink">You’re all caught up</p>
      <p className="mt-1 text-sm text-muted">{emptyMessage}</p>
    </div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400">
          <tr>
            <th className="px-5 py-3.5">Issue</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5">Priority</th>
            <th className="px-4 py-3.5">Labels</th>
            <th className="px-4 py-3.5">Assignee</th>
            <th className="px-4 py-3.5">Reporter</th>
            <th className="px-4 py-3.5">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {issues.map((issue) => (
            <tr key={issue.id} className="group transition hover:bg-slate-50/70">
              <td className="px-5 py-4">
                <Link href={`/issues/${issue.id}`} className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-muted">{issue.key}</span>
                  <span className="block max-w-[330px] truncate text-sm font-semibold text-ink group-hover:text-brand">{issue.title}</span>
                </Link>
              </td>
              <td className="px-4 py-4"><Badge value={issue.status} /></td>
              <td className="px-4 py-4"><Badge value={issue.priority} type="priority" /></td>
              <td className="px-4 py-4"><LabelChips labels={issue.labels} /></td>
              <td className="px-4 py-4 text-sm text-slate-600">{issue.assignee?.name || <span className="text-slate-400">Unassigned</span>}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{issue.reporter?.name || "—"}</td>
              <td className="px-4 py-4 text-sm text-muted">{formatDate(issue.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InlineError({ children }) {
  if (!children) return null;
  return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{children}</div>;
}
