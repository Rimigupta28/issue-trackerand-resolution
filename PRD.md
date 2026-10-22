# Product Requirements Document

## Issue Tracking & Resolution Platform

**Document status:** Draft for review
**Product type:** Full-stack web application
**Practice challenge:** NeoStats 5-hour Full Stack Engineering Hackathon

## 1. Challenge statement

Build a web-based issue tracking and resolution platform that lets a small team report, prioritize, assign, track, and resolve work items from a shared workspace. Users should be able to see what needs attention, update issue status, and follow the discussion and history of each issue. All issue data must persist in a relational database.

Deliver a functional, locally runnable application with a React/Next.js frontend and a separately running Node.js/Express backend. The backend is the authoritative owner of business rules, persistence, request validation, and authorization.

## 2. Problem and opportunity

Small teams often track defects and requests through scattered messages or spreadsheets. This makes ownership, priority, current status, and resolution context hard to find. The proposed application provides one shared, searchable issue list and a focused detail view where progress and discussion stay together.

## 3. Product goals

1. Let an authenticated team member report an issue with enough information for another person to act on it.
2. Make current ownership, priority, and status visible and easy to update.
3. Help users find issues using common filters and search.
4. Preserve comments and meaningful status/assignment changes with the issue.
5. Make the application straightforward to set up and demonstrate locally.

### Success criteria

- A user can sign in with a seeded account, create an issue, and see it after a page refresh.
- A user can find an issue by text or filter it by status, priority, or assignee.
- An authorized user can assign an issue, change its status, and add a comment.
- The issue detail displays its current information, comments, and chronological activity.
- A clean local setup using the README creates the schema, loads sample data, and starts frontend and backend as separate processes.

## 4. Target users

### Team member

Reports bugs or requests, reviews the shared queue, comments on issues, and follows their own or assigned work.

### Team administrator

Uses the same issue workflow as a team member. User administration is not part of the MVP; demo accounts are provisioned by the seed script.

## 5. MVP scope

### In scope

- Email/password sign-in using seeded demo users.
- A shared issue dashboard with summary counts and a recent/open-issues view.
- Paginated issue list with text search and filters for status, priority, assignee, and label.
- Issue creation with title, description, priority, optional assignee, and up to five labels.
- Issue detail view with reporter, assignee, status, priority, creation/update times, comments, and activity history.
- Issue editing for core fields and labels.
- Status changes through the defined workflow.
- Assignment and reassignment to an active user.
- Comments on an issue.
- An activity entry for issue creation and changes to status, assignee, priority, title, and labels.
- Seeded users and sample issues for a usable demo.
- Clear loading, empty, validation, and server-error states.

### Out of scope for the five-hour MVP

- File uploads and attachments.
- Email, push, or real-time notifications.
- External identity providers, password reset, and self-service registration.
- Multiple organizations/workspaces or organization-specific permissions.
- Custom statuses, priorities, workflows, or issue fields.
- Nested comments, mentions, reactions, and rich-text editing.
- SLA management, time tracking, advanced analytics, and exports.
- Production deployment, billing, and high-availability operations.

## 6. Functional requirements

### FR-1: Sign in

- A user can sign in using email and password.
- Invalid credentials produce a generic authentication error and do not reveal whether an email exists.
- An authenticated session is required for dashboard and issue operations.
- The UI provides a way to sign out.

### FR-2: Dashboard

- The dashboard shows total open issues, issues in progress, resolved issues, and issues assigned to the current user.
- The dashboard shows a useful list of recent or currently open issues.
- Counts and lists come from the backend, not hard-coded frontend data.

### FR-3: Browse and find issues

- The issue list displays issue key, title, status, priority, assignee, reporter, and last-updated time.
- Users can search title and description using a text query.
- Users can filter by status, priority, and assignee, and clear filters.
- Users can filter by one label; multiple selected labels on an issue are combined as an OR for that filter.
- The list has deterministic ordering and pagination.
- Selecting a row opens the issue detail.

### FR-4: Create an issue

- Required fields: title and description.
- Priority is selected from Low, Medium, High, or Urgent; default is Medium.
- Assignee is optional and must refer to an active user.
- Users can choose up to five labels from Bug, Feature, Documentation, Performance, and Accessibility; no label is required.
- The backend sets the reporter from the authenticated identity and initializes status to Open.
- On successful creation, the user receives a confirmation and can open the new issue.

### FR-5: View and edit an issue

- The detail page shows the issue's current fields, reporter, assignee, comments, and activity history.
- An authorized user can update the title, description, priority, and assignee.
- An authorized user can update the issue's labels.
- The UI shows validation feedback and does not silently discard failed updates.
- The issue key is stable and human-readable (for example, `ISS-00042`).

### FR-6: Track status

- Supported statuses are Open, In Progress, Resolved, and Closed.
- Allowed transitions are Open → In Progress, In Progress → Resolved, Resolved → Closed, and any non-Closed status → Open.
- Closed is terminal in the MVP; reopening a closed issue is not supported.
- Each successful status change updates the issue timestamp and adds an activity entry.
- The backend rejects unsupported transitions with a client error.

### FR-7: Comment and activity

- An authenticated user can add a non-empty plain-text comment to an issue.
- Comments display author and creation time in chronological order.
- The activity history records issue creation and changes to status, assignee, priority, and title, including actor, timestamp, and a concise before/after description.
- Label changes are recorded with the issue's activity history.
- Comments and activity are persisted and remain available after refresh.

## 7. Business rules and permissions

- All issue, comment, and activity endpoints require authentication.
- Any authenticated team member may view issues, create issues, comment, and update issue fields/status in the single-team MVP.
- The backend derives the reporter and activity actor from the authenticated user; clients cannot impersonate another user by submitting an ID.
- Only active users may be assigned.
- A comment must contain non-whitespace text.
- Title length: 5–120 characters. Description length: 10–5,000 characters. Comment length: 1–2,000 characters.
- List page size defaults to 20 and is capped at 100.
- Status, priority, sort, and pagination values are validated by the backend.
- Deleting issues is not supported in the MVP; use Closed for completed work.

## 8. User journeys

### Report and assign work

1. A team member signs in and selects “New issue”.
2. They enter a title and description, choose a priority, and optionally select an assignee.
3. The system creates an Open issue with the signed-in user as reporter.
4. The user lands on its detail page and can see the initial activity event.

### Triage and resolve work

1. A team member searches or filters the shared issue list.
2. They open an issue, review its description and history, and assign it to an active user.
3. The assignee moves it to In Progress, adds a comment, then marks it Resolved.
4. Once accepted, a team member closes it; the activity history shows the changes.

## 9. UX requirements

- Use a consistent application shell with navigation to Dashboard and Issues, plus the signed-in user and sign-out action.
- Prioritize desktop usability while remaining usable on narrow screens.
- Use clear, text-labeled status and priority indicators; color must not be the only differentiator.
- Keep create/edit forms concise and validate at the point of entry.
- Provide explicit loading, empty, not-found, unauthorized, and recoverable error states.
- Avoid destructive actions in the MVP; do not include a delete control.

## 10. Acceptance criteria

1. A seeded account can sign in; invalid credentials are rejected.
2. Dashboard metrics and issue list reflect persisted database records.
3. Creating an issue persists it, sets the reporter from the session, assigns the default status and priority, saves selected labels, and creates an activity event.
4. Search and each supported filter, including label, can be combined and return matching paginated issues.
5. Assignment to an unknown or inactive user is rejected.
6. Valid status transitions persist and appear in activity; an invalid transition is rejected without changing the issue.
7. A comment persists, displays its authenticated author, and rejects blank content.
8. Core field edits persist and relevant changes create activity records.
9. Labels are limited to the supported set and a maximum of five unique values; edits persist and appear in issue activity.
10. Requests without valid authentication cannot access protected data.
11. Following the README on a clean local setup starts the separate frontend and backend and produces a seeded, usable application.

## 11. Assumptions and open questions

For this practice challenge, the following assumptions resolve unspecified challenge details:

- The product serves one small team in one shared workspace.
- Every authenticated user has the same issue permissions; the “administrator” persona does not imply a separate authorization tier in the MVP.
- Seeded demo accounts are sufficient; registration and account recovery are excluded.
- Comments and descriptions are plain text.
- A fixed linear status workflow is sufficient, with reopening allowed only before Closed.
- Issue keys use a stable, sequential display format backed by the database-generated issue ID.
- No challenge-specific visual branding or deployment target is required.

These assumptions should be revisited if an official challenge statement adds constraints.

## 12. Hackathon prioritization

**Must have:** authentication, persisted issue creation/list/detail, search and filters, assignment, labels, status transitions, comments, activity, seed data, and reliable local setup.
**Should have if time allows:** dashboard polish, responsive refinements, and stronger automated coverage.
**Will not have in the MVP:** integrations, attachments, notifications, custom workflows, or advanced reporting.
