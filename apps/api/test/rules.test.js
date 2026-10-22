import test from "node:test";
import assert from "node:assert/strict";
import { canTransition } from "../src/services.js";
import { issueKey } from "../src/utils.js";
import { ISSUE_LABELS, issueLabelsSchema } from "../src/labels.js";

test("allows the defined workflow transitions", () => {
  assert.equal(canTransition("OPEN", "IN_PROGRESS"), true);
  assert.equal(canTransition("IN_PROGRESS", "RESOLVED"), true);
  assert.equal(canTransition("RESOLVED", "CLOSED"), true);
  assert.equal(canTransition("IN_PROGRESS", "OPEN"), true);
  assert.equal(canTransition("RESOLVED", "OPEN"), true);
});

test("rejects invalid and terminal transitions", () => {
  assert.equal(canTransition("OPEN", "RESOLVED"), false);
  assert.equal(canTransition("OPEN", "CLOSED"), false);
  assert.equal(canTransition("CLOSED", "OPEN"), false);
  assert.equal(canTransition("CLOSED", "IN_PROGRESS"), false);
  assert.equal(canTransition("UNKNOWN", "OPEN"), false);
});

test("formats stable human-readable issue keys", () => {
  assert.equal(issueKey(42), "ISS-00042");
  assert.equal(issueKey(123456), "ISS-123456");
});

test("accepts supported unique issue labels", () => {
  assert.deepEqual(issueLabelsSchema.parse(["bug", "accessibility"]), ["bug", "accessibility"]);
  assert.deepEqual(issueLabelsSchema.parse([]), []);
  assert.equal(ISSUE_LABELS.length, 5);
});

test("rejects unknown, duplicate, or excessive issue labels", () => {
  assert.equal(issueLabelsSchema.safeParse(["unknown"]).success, false);
  assert.equal(issueLabelsSchema.safeParse(["bug", "bug"]).success, false);
  assert.equal(issueLabelsSchema.safeParse([...ISSUE_LABELS, "bug"]).success, false);
});
