import { z } from "zod";

export const ISSUE_LABELS = ["bug", "feature", "documentation", "performance", "accessibility"];

export const issueLabelsSchema = z.array(z.enum(ISSUE_LABELS))
  .max(5)
  .refine((labels) => new Set(labels).size === labels.length, "Labels must be unique.");
