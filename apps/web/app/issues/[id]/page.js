"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ProtectedPage from "../../../components/ProtectedPage";
import IssueForm from "../../../components/IssueForm";
import { Badge, InlineError, LabelChips, PageHeading } from "../../../components/IssueUI";
import { api, explainError } from "../../../lib/api";
import { formatDateTime, titleCase } from "../../../lib/format";

function activityText(event) {
  if (event.type === "CREATED") return "created this issue";
  const field = {
    STATUS_CHANGED: "status",
    ASSIGNEE_CHANGED: "assignee",
    PRIORITY_CHANGED: "priority",
    TITLE_CHANGED: "title",
    LABELS_CHANGED: "labels",
  }[event.type] || "issue";
  return `changed ${field} from “${event.fromValue ?? "None"}” to “${event.toValue ?? "None"}”`;
}

function IssueDetailContent({ id }) {
  const [issue, setIssue] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await api(`/issues/${id}`);
      setIssue(result.issue);
    } catch (loadError) {
      setError(explainError(loadError));
    }
  }, [id]);

  useEffect(() => {
    load();
    api("/users").then((result) => setUsers(result.items)).catch((loadError) => setError(explainError(loadError)));
  }, [load]);

  async function saveChanges(data) {
    const result = await api(`/issues/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    setIssue((current) => ({ ...current, ...result.issue }));
    await load();
  }

  async function transition(status) {
    setStatusSaving(true);
    setError("");
    try {
      await api(`/issues/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (changeError) {
      setError(explainError(changeError));
    } finally {
      setStatusSaving(false);
    }
  }

  async function postComment(event) {
    event.preventDefault();
    if (!comment.trim()) {
      setError("Comment cannot be blank.");
      return;
    }
    setPosting(true);
    setError("");
    try {
      await api(`/issues/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: comment.trim() }),
      });
      setComment("");
      await load();
    } catch (commentError) {
      setError(explainError(commentError));
    } finally {
      setPosting(false);
    }
  }

  if (!issue && !error) return <div className="py-14 text-center text-sm text-muted">Loading issue…</div>;
  if (!issue) {
    return <><div className="mb-5"><Link href="/issues" className="text-sm font-semibold text-muted hover:text-brand">← Back to issues</Link></div><InlineError>{error || "Issue not found."}</InlineError></>;
  }

  const nextStatuses = {
    OPEN: ["IN_PROGRESS"],
    IN_PROGRESS: ["RESOLVED", "OPEN"],
    RESOLVED: ["CLOSED", "OPEN"],
    CLOSED: [],
  }[issue.status];

  return (
    <>
      <div className="mb-5"><Link href="/issues" className="text-sm font-semibold text-muted hover:text-brand">← Back to issues</Link></div>
      <PageHeading eyebrow={`${issue.key} · Reported ${formatDateTime(issue.createdAt)}`} title={issue.title} description="Review details, update ownership, and keep the resolution conversation together." action={<Badge value={issue.status} />} />
      <InlineError>{error}</InlineError>
      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        <div className="space-y-5">
          <section className="panel p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-ink">Description</h2>
              <Badge value={issue.priority} type="priority" />
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{issue.description}</p>
            <div className="mt-5">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Labels</div>
              <LabelChips labels={issue.labels} />
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-xs text-muted">
              <span>Reporter: <strong className="text-slate-700">{issue.reporter?.name || "—"}</strong></span>
              <span>Updated: <strong className="text-slate-700">{formatDateTime(issue.updatedAt)}</strong></span>
            </div>
          </section>

          <section className="panel p-5 sm:p-6">
            <h2 className="font-bold text-ink">Conversation <span className="ml-1 text-sm font-medium text-muted">({issue.comments.length})</span></h2>
            <div className="mt-5 space-y-4">
              {issue.comments.length ? issue.comments.map((item) => (
                <article className="flex gap-3" key={item.id}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-brand">{item.author.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
                  <div className="min-w-0 flex-1 rounded-xl bg-slate-50 p-3.5">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">{item.author.name}</span>
                      <time className="text-xs text-muted">{formatDateTime(item.createdAt)}</time>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                </article>
              )) : <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-muted">No comments yet. Add context or share an update.</p>}
            </div>
            <form onSubmit={postComment} className="mt-5 border-t border-line pt-5">
              <label className="label" htmlFor="new-comment">Add a comment</label>
              <textarea id="new-comment" className="field min-h-24 resize-y" maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share a useful update with the team…" />
              <div className="mt-3 flex justify-end"><button className="btn-primary" disabled={posting} type="submit">{posting ? "Posting…" : "Post comment"}</button></div>
            </form>
          </section>
        </div>

        <div className="space-y-5">
          <section className="panel p-5">
            <h2 className="font-bold text-ink">Move issue forward</h2>
            <p className="mt-1 text-xs leading-5 text-muted">Choose a valid next step in the team workflow.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {nextStatuses.length ? nextStatuses.map((status) => (
                <button className="btn-secondary px-3 py-2 text-xs" disabled={statusSaving} key={status} onClick={() => transition(status)} type="button">
                  {statusSaving ? "Updating…" : `Move to ${titleCase(status)}`}
                </button>
              )) : <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">Closed issues cannot be reopened.</span>}
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 font-bold text-ink">Edit issue</h2>
            <IssueForm
              users={users}
              initial={{ ...issue, assigneeId: issue.assignee?.id ?? null }}
              onSubmit={saveChanges}
              submitLabel="Save changes"
            />
          </section>

          <section className="panel p-5">
            <h2 className="font-bold text-ink">Activity</h2>
            <ol className="mt-5 space-y-4">
              {issue.events.map((event) => (
                <li className="relative flex gap-3" key={event.id}>
                  <span aria-hidden="true" className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-brand">•</span>
                  <div className="min-w-0 pb-1">
                    <p className="text-sm leading-5 text-slate-600"><strong className="text-ink">{event.actor.name}</strong> {activityText(event)}</p>
                    <time className="mt-1 block text-xs text-muted">{formatDateTime(event.createdAt)}</time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}

export default function IssueDetailPage() {
  const params = useParams();
  return <ProtectedPage><IssueDetailContent id={Number(params.id)} /></ProtectedPage>;
}
