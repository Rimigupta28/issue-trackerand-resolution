import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IssuePriority, IssueStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./db.js";
import { ISSUE_LABELS, issueLabelsSchema } from "./labels.js";
import { HttpError, requireAuth, validate } from "./middleware.js";
import { changeStatus, createIssue, updateIssue } from "./services.js";
import { asyncRoute, presentIssue, safeUser } from "./utils.js";

const router = Router();
const issueIdSchema = z.object({ id: z.coerce.number().int().positive() });
const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200),
}).strict();
const createSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(10).max(5000),
  priority: z.nativeEnum(IssuePriority).optional(),
  labels: issueLabelsSchema.optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
}).strict();
const patchSchema = z.object({
  title: z.string().trim().min(5).max(120).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  priority: z.nativeEnum(IssuePriority).optional(),
  labels: issueLabelsSchema.optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, "Provide at least one field to update.");
const statusSchema = z.object({ status: z.nativeEnum(IssueStatus) }).strict();
const commentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
}).strict();
const querySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.nativeEnum(IssueStatus).optional(),
  priority: z.nativeEnum(IssuePriority).optional(),
  label: z.enum(ISSUE_LABELS).optional(),
  assigneeId: z.union([z.literal("unassigned"), z.coerce.number().int().positive()]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

router.post("/auth/login", validate(loginSchema), asyncRoute(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.validated.body.email } });
  const valid = user?.active && await bcrypt.compare(req.validated.body.password, user.passwordHash);
  if (!valid) throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");

  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
  res.json({ token, user: safeUser(user) });
}));

router.use(requireAuth);

router.get("/auth/me", (req, res) => res.json({ user: safeUser(req.user) }));

router.get("/users", asyncRoute(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  res.json({ items: users });
}));

router.get("/dashboard", asyncRoute(async (req, res) => {
  const [open, inProgress, resolved, assignedToMe, recent] = await Promise.all([
    prisma.issue.count({ where: { status: "OPEN" } }),
    prisma.issue.count({ where: { status: "IN_PROGRESS" } }),
    prisma.issue.count({ where: { status: "RESOLVED" } }),
    prisma.issue.count({ where: { assigneeId: req.user.id, status: { not: "CLOSED" } } }),
    prisma.issue.findMany({
      where: { status: { not: "CLOSED" } },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 8,
      include: { reporter: { select: { id: true, name: true, email: true } }, assignee: { select: { id: true, name: true, email: true } } },
    }),
  ]);
  res.json({
    counts: { open, inProgress, resolved, assignedToMe },
    recentIssues: recent.map(presentIssue),
  });
}));

router.get("/issues", validate(querySchema, "query"), asyncRoute(async (req, res) => {
  const { q, status, priority, label, assigneeId, page, pageSize } = req.validated.query;
  const where = {
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(label ? { labels: { has: label } } : {}),
    ...(assigneeId === "unassigned" ? { assigneeId: null } : typeof assigneeId === "number" ? { assigneeId } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    } : {}),
  };
  const [totalItems, records] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { reporter: { select: { id: true, name: true, email: true } }, assignee: { select: { id: true, name: true, email: true } } },
    }),
  ]);
  res.json({
    items: records.map(presentIssue),
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  });
}));

router.post("/issues", validate(createSchema), asyncRoute(async (req, res) => {
  const issue = await createIssue(req.validated.body, req.user.id);
  res.status(201).json({ issue });
}));

router.get("/issues/:id", validate(issueIdSchema, "params"), asyncRoute(async (req, res) => {
  const issue = await prisma.issue.findUnique({
    where: { id: req.validated.params.id },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      comments: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { author: { select: { id: true, name: true, email: true } } },
      },
      events: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { actor: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!issue) throw new HttpError(404, "NOT_FOUND", "Issue not found.");
  res.json({
    issue: {
      ...presentIssue(issue),
      comments: issue.comments.map((comment) => ({ ...comment, author: safeUser(comment.author) })),
      events: issue.events.map((event) => ({ ...event, actor: safeUser(event.actor) })),
    },
  });
}));

router.patch("/issues/:id", validate(issueIdSchema, "params"), validate(patchSchema), asyncRoute(async (req, res) => {
  const issue = await updateIssue(req.validated.params.id, req.validated.body, req.user.id);
  res.json({ issue });
}));

router.patch("/issues/:id/status", validate(issueIdSchema, "params"), validate(statusSchema), asyncRoute(async (req, res) => {
  const issue = await changeStatus(req.validated.params.id, req.validated.body.status, req.user.id);
  res.json({ issue });
}));

router.post("/issues/:id/comments", validate(issueIdSchema, "params"), validate(commentSchema), asyncRoute(async (req, res) => {
  const exists = await prisma.issue.findUnique({ where: { id: req.validated.params.id }, select: { id: true } });
  if (!exists) throw new HttpError(404, "NOT_FOUND", "Issue not found.");
  const comment = await prisma.comment.create({
    data: { issueId: req.validated.params.id, authorId: req.user.id, body: req.validated.body.body },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  res.status(201).json({ comment: { ...comment, author: safeUser(comment.author) } });
}));

export default router;
