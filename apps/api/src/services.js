import { IssuePriority, IssueStatus } from "@prisma/client";
import { prisma } from "./db.js";
import { HttpError } from "./middleware.js";
import { presentIssue } from "./utils.js";

const userSummary = { id: true, name: true, email: true };
const issueRelations = { reporter: { select: userSummary }, assignee: { select: userSummary } };

export const transitions = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED", "OPEN"],
  RESOLVED: ["CLOSED", "OPEN"],
  CLOSED: [],
};

export function canTransition(from, to) {
  return transitions[from]?.includes(to) ?? false;
}

export async function createIssue(data, reporterId) {
  if (data.assigneeId != null) {
    const assignee = await prisma.user.findFirst({
      where: { id: data.assigneeId, active: true },
      select: { id: true },
    });
    if (!assignee) {
      throw new HttpError(400, "VALIDATION_ERROR", "Assignee must be an active user.", [
        { field: "assigneeId", message: "Select an active user." },
      ]);
    }
  }
  const issue = await prisma.$transaction(async (tx) => {
    const created = await tx.issue.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority ?? IssuePriority.MEDIUM,
        labels: data.labels ?? [],
        assigneeId: data.assigneeId ?? null,
        reporterId,
      },
    });
    await tx.issueEvent.create({
      data: {
        issueId: created.id,
        actorId: reporterId,
        type: "CREATED",
        toValue: created.title,
      },
    });
    return tx.issue.findUnique({ where: { id: created.id }, include: issueRelations });
  });
  return presentIssue(issue);
}

export async function updateIssue(id, data, actorId) {
  const current = await prisma.issue.findUnique({ where: { id } });
  if (!current) throw new HttpError(404, "NOT_FOUND", "Issue not found.");

  let assigneeNames = new Map();
  if (data.assigneeId !== undefined && data.assigneeId !== current.assigneeId) {
    const ids = [current.assigneeId, data.assigneeId].filter((value) => value != null);
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, active: true },
    });
    assigneeNames = new Map(users.map((user) => [user.id, user.name]));
    if (data.assigneeId != null && !users.some((user) => user.id === data.assigneeId && user.active)) {
      throw new HttpError(400, "VALIDATION_ERROR", "Assignee must be an active user.", [
        { field: "assigneeId", message: "Select an active user." },
      ]);
    }
  }

  const events = [];
  if (data.title !== undefined && data.title !== current.title) {
    events.push({ type: "TITLE_CHANGED", fromValue: current.title, toValue: data.title });
  }
  if (data.priority !== undefined && data.priority !== current.priority) {
    events.push({ type: "PRIORITY_CHANGED", fromValue: current.priority, toValue: data.priority });
  }
  if (data.labels !== undefined && JSON.stringify([...data.labels].sort()) !== JSON.stringify([...current.labels].sort())) {
    events.push({
      type: "LABELS_CHANGED",
      fromValue: current.labels.join(", ") || null,
      toValue: data.labels.join(", ") || null,
    });
  }
  if (data.assigneeId !== undefined && data.assigneeId !== current.assigneeId) {
    events.push({
      type: "ASSIGNEE_CHANGED",
      fromValue: current.assigneeId == null ? null : assigneeNames.get(current.assigneeId) || String(current.assigneeId),
      toValue: data.assigneeId == null ? null : assigneeNames.get(data.assigneeId) || String(data.assigneeId),
    });
  }

  const issue = await prisma.$transaction(async (tx) => {
    const updated = await tx.issue.updateMany({
      where: { id, updatedAt: current.updatedAt },
      data,
    });
    if (updated.count !== 1) {
      throw new HttpError(409, "CONFLICT", "Issue changed while this update was being applied. Refresh and retry.");
    }
    if (events.length) {
      await tx.issueEvent.createMany({
        data: events.map((event) => ({ issueId: id, actorId, ...event })),
      });
    }
    return tx.issue.findUnique({ where: { id }, include: issueRelations });
  });
  return presentIssue(issue);
}

export async function changeStatus(id, nextStatus, actorId) {
  const current = await prisma.issue.findUnique({ where: { id } });
  if (!current) throw new HttpError(404, "NOT_FOUND", "Issue not found.");
  if (!Object.values(IssueStatus).includes(nextStatus) || !canTransition(current.status, nextStatus)) {
    throw new HttpError(400, "INVALID_STATUS_TRANSITION", `Cannot move an issue from ${current.status} to ${nextStatus}.`);
  }

  const issue = await prisma.$transaction(async (tx) => {
    const result = await tx.issue.updateMany({
      where: { id, status: current.status },
      data: { status: nextStatus },
    });
    if (result.count !== 1) {
      throw new HttpError(409, "CONFLICT", "Issue changed while this update was being applied. Refresh and retry.");
    }
    await tx.issueEvent.create({
      data: {
        issueId: id,
        actorId,
        type: "STATUS_CHANGED",
        fromValue: current.status,
        toValue: nextStatus,
      },
    });
    return tx.issue.findUnique({ where: { id }, include: issueRelations });
  });
  return presentIssue(issue);
}
