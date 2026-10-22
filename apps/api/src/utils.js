export function issueKey(id) {
  return `ISS-${String(id).padStart(5, "0")}`;
}

export function safeUser(user) {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
}

export function presentIssue(issue) {
  return {
    ...issue,
    key: issueKey(issue.id),
    reporter: safeUser(issue.reporter),
    assignee: safeUser(issue.assignee),
  };
}

export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
