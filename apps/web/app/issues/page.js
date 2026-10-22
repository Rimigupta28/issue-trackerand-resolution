"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedPage from "../../components/ProtectedPage";
import { Badge, InlineError, IssueTable, PageHeading } from "../../components/IssueUI";
import { api, explainError } from "../../lib/api";
import { titleCase } from "../../lib/format";

function IssuesContent() {
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ q: "", status: "", priority: "", label: "", assigneeId: "" });
  const [draft, setDraft] = useState(filters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadIssues = useCallback(async (page = 1, applied = filters) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    Object.entries(applied).forEach(([key, value]) => { if (value) params.set(key, value); });
    try {
      const result = await api(`/issues?${params.toString()}`);
      setIssues(result.items);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(explainError(requestError));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    api("/users").then((result) => setUsers(result.items)).catch((requestError) => setError(explainError(requestError)));
    loadIssues(1);
  }, [loadIssues]);

  function applyFilters(event) {
    event.preventDefault();
    setFilters(draft);
    loadIssues(1, draft);
  }

  function resetFilters() {
    const cleared = { q: "", status: "", priority: "", label: "", assigneeId: "" };
    setDraft(cleared);
    setFilters(cleared);
    loadIssues(1, cleared);
  }

  return (
    <>
      <PageHeading eyebrow="Issue queue" title="All issues" description="Search, triage, and follow every issue in your team workspace." action={<Link href="/issues/new" className="btn-primary">＋ Create issue</Link>} />
      <section className="panel mb-5 p-4 sm:p-5">
        <form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(200px,1.6fr)_repeat(4,minmax(130px,1fr))_auto_auto] xl:items-end">
          <div className="md:col-span-2 xl:col-span-1">
            <label className="label" htmlFor="search-issues">Search</label>
            <input id="search-issues" className="field" placeholder="Search title or description…" value={draft.q} onChange={(event) => setDraft({ ...draft, q: event.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="filter-status">Status</label>
            <select id="filter-status" className="field" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
              <option value="">All statuses</option>
              {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="filter-priority">Priority</label>
            <select id="filter-priority" className="field" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}>
              <option value="">All priorities</option>
              {["LOW", "MEDIUM", "HIGH", "URGENT"].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="filter-label">Label</label>
            <select id="filter-label" className="field" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })}>
              <option value="">All labels</option>
              {["bug", "feature", "documentation", "performance", "accessibility"].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="filter-assignee">Assignee</label>
            <select id="filter-assignee" className="field" value={draft.assigneeId} onChange={(event) => setDraft({ ...draft, assigneeId: event.target.value })}>
              <option value="">Anyone</option>
              <option value="unassigned">Unassigned</option>
              {users.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}
            </select>
          </div>
          <button className="btn-primary h-[46px]" type="submit">Apply</button>
          <button className="btn-secondary h-[46px]" type="button" onClick={resetFilters}>Clear</button>
        </form>
      </section>
      <InlineError>{error}</InlineError>
      <section className="panel mt-5 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-ink">Issue list</h2>
            <Badge value={String(pagination.totalItems)} type="priority" />
          </div>
          <div className="text-xs text-muted">Sorted by recently updated</div>
        </div>
        {loading ? <div className="p-8 text-center text-sm text-muted">Loading issues…</div> : <IssueTable issues={issues} />}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
          <p className="text-xs text-muted">Page {pagination.page} of {Math.max(pagination.totalPages, 1)} <span className="px-1">·</span> {pagination.totalItems} issues</p>
          <div className="flex gap-2">
            <button className="btn-secondary px-3 py-2 text-xs" disabled={loading || pagination.page <= 1} onClick={() => loadIssues(pagination.page - 1)} type="button">← Previous</button>
            <button className="btn-secondary px-3 py-2 text-xs" disabled={loading || pagination.page >= pagination.totalPages} onClick={() => loadIssues(pagination.page + 1)} type="button">Next →</button>
          </div>
        </div>
      </section>
    </>
  );
}

export default function IssuesPage() {
  return <ProtectedPage><IssuesContent /></ProtectedPage>;
}
