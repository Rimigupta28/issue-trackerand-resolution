import dotenv from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: resolve(fileURLToPath(new URL("../../..", import.meta.url)), ".env") });
const prisma = new PrismaClient();

const demoPassword = "Practice123!";

async function main() {
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const people = [
    { name: "Alex Morgan", email: "alex@example.com" },
    { name: "Sam Rivera", email: "sam@example.com" },
    { name: "Jamie Chen", email: "jamie@example.com" },
  ];
  const users = [];
  for (const person of people) {
    users.push(await prisma.user.upsert({
      where: { email: person.email },
      update: { name: person.name, passwordHash, active: true },
      create: { ...person, passwordHash },
    }));
  }

  const examples = [
    { title: "Dashboard count is incorrect", description: "The open issue count does not match the issues shown in the list.", status: "OPEN", priority: "HIGH", labels: ["bug", "performance"], reporterId: users[0].id, assigneeId: users[1].id },
    { title: "Add keyboard navigation to filters", description: "Users should be able to move through issue filters without a mouse.", status: "IN_PROGRESS", priority: "MEDIUM", labels: ["feature", "accessibility"], reporterId: users[1].id, assigneeId: users[2].id },
    { title: "Issue details page layout breaks", description: "The issue detail page overflows on narrow laptop screens.", status: "RESOLVED", priority: "URGENT", labels: ["bug", "accessibility"], reporterId: users[2].id, assigneeId: users[0].id },
    { title: "Clarify empty search results", description: "Show a helpful message when a search query returns no matching issues.", status: "CLOSED", priority: "LOW", labels: ["documentation"], reporterId: users[0].id, assigneeId: null },
    { title: "Unassigned release checklist item", description: "Document the remaining launch checklist tasks for the practice project.", status: "OPEN", priority: "MEDIUM", labels: ["documentation"], reporterId: users[2].id, assigneeId: null },
  ];

  for (const data of examples) {
    const existing = await prisma.issue.findFirst({ where: { title: data.title } });
    const issue = existing
      ? await prisma.issue.update({ where: { id: existing.id }, data })
      : await prisma.issue.create({ data });
    if (!existing) {
      await prisma.issueEvent.create({
        data: { issueId: issue.id, actorId: issue.reporterId, type: "CREATED", toValue: issue.title },
      });
    }
  }

  const seededIssue = await prisma.issue.findFirst({
    where: { title: examples[0].title },
    orderBy: { id: "asc" },
  });
  if (seededIssue && !(await prisma.comment.findFirst({ where: { issueId: seededIssue.id } }))) {
    await prisma.comment.create({
      data: { issueId: seededIssue.id, authorId: users[1].id, body: "I can reproduce this and will investigate the count query." },
    });
  }

  console.log("Seed completed. Demo accounts use password: Practice123!");
}

main()
  .catch((error) => {
    console.error("Seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
