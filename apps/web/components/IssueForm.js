"use client";

import { useState } from "react";
import { InlineError } from "./IssueUI";
import { titleCase } from "../lib/format";

const ISSUE_LABELS = ["bug", "feature", "documentation", "performance", "accessibility"];

export default function IssueForm({ users, initial = {}, onSubmit, submitLabel = "Create issue" }) {
  const [title, setTitle] = useState(initial.title || "");
  const [description, setDescription] = useState(initial.description || "");
  const [priority, setPriority] = useState(initial.priority || "MEDIUM");
  const [labels, setLabels] = useState(initial.labels || []);
  const [assigneeId, setAssigneeId] = useState(initial.assigneeId == null ? "" : String(initial.assigneeId));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (cleanTitle.length < 5 || cleanTitle.length > 120) return setError("Title must be between 5 and 120 characters.");
    if (cleanDescription.length < 10 || cleanDescription.length > 5000) return setError("Description must be between 10 and 5,000 characters.");

    setSaving(true);
    try {
      await onSubmit({
        title: cleanTitle,
        description: cleanDescription,
        priority,
        labels,
        assigneeId: assigneeId ? Number(assigneeId) : null,
      });
    } catch (submitError) {
      setError(submitError.message || "Unable to save this issue.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel space-y-6 p-5 sm:p-7">
      <InlineError>{error}</InlineError>
      <div>
        <label className="label" htmlFor="issue-title">Issue title</label>
        <input id="issue-title" className="field" maxLength={120} minLength={5} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Summarize the issue clearly" />
        <p className="mt-1.5 text-xs text-muted">5–120 characters</p>
      </div>
      <div>
        <label className="label" htmlFor="issue-description">Description</label>
        <textarea id="issue-description" className="field min-h-36 resize-y" maxLength={5000} minLength={10} required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What happened, and what should happen instead?" />
        <p className="mt-1.5 text-xs text-muted">10–5,000 characters</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="issue-priority">Priority</label>
          <select id="issue-priority" className="field" value={priority} onChange={(event) => setPriority(event.target.value)}>
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="issue-assignee">Assignee <span className="font-normal text-muted">(optional)</span></label>
          <select id="issue-assignee" className="field" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
            <option value="">Unassigned</option>
            {users.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}
          </select>
        </div>
      </div>
      <fieldset>
        <legend className="label">Labels <span className="font-normal text-muted">(choose up to 5)</span></legend>
        <div className="flex flex-wrap gap-2">
          {ISSUE_LABELS.map((label) => {
            const checked = labels.includes(label);
            return (
              <label key={label} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${checked ? "border-violet-200 bg-violet-50 text-violet-800" : "border-line bg-white text-slate-600 hover:bg-slate-50"}`}>
                <input
                  checked={checked}
                  className="accent-violet-700"
                  disabled={!checked && labels.length >= 5}
                  onChange={() => setLabels((current) => checked ? current.filter((item) => item !== label) : [...current, label])}
                  type="checkbox"
                />
                {titleCase(label)}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
        <button className="btn-primary" disabled={saving} type="submit">{saving ? "Saving…" : submitLabel}</button>
      </div>
    </form>
  );
}
