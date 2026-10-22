"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedPage from "../../../components/ProtectedPage";
import IssueForm from "../../../components/IssueForm";
import { PageHeading } from "../../../components/IssueUI";
import { api, explainError } from "../../../lib/api";

function NewIssueContent() {
  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState("");
  const router = useRouter();

  useEffect(() => {
    api("/users").then((result) => setUsers(result.items)).catch((error) => setLoadError(explainError(error)));
  }, []);

  async function createIssue(data) {
    const result = await api("/issues", { method: "POST", body: JSON.stringify(data) });
    router.push(`/issues/${result.issue.id}`);
  }

  return (
    <>
      <div className="mb-5"><Link href="/issues" className="text-sm font-semibold text-muted hover:text-brand">← Back to issues</Link></div>
      <PageHeading eyebrow="New issue" title="Give the work a clear starting point." description="Add the details your team needs to understand and act on this issue." />
      {loadError ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{loadError}</div> : <IssueForm users={users} onSubmit={createIssue} />}
    </>
  );
}

export default function NewIssuePage() {
  return <ProtectedPage><NewIssueContent /></ProtectedPage>;
}
