# Technical Requirements Document

## Issue Tracking & Resolution Platform

**Document status:** Draft for review
**Companion document:** [PRD.md](PRD.md)
**Implementation status:** Requirements only; no application code is authorized until review and approval.

## 1. Technical objectives

- Deliver the PRD's MVP as a locally runnable full-stack application within the five-hour hackathon.
- Keep the frontend and backend as separate processes and deployable packages.
- Make the Express API the only authority for business rules, validation, authorization, and database access.
- Persist all product data in PostgreSQL.
- Use JavaScript throughout, reproducible database migrations, a seed script, and documented environment configuration.

## 2. Selected stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js App Router, React, JavaScript | Fast page and layout setup with reusable components and familiar React patterns. |
| Styling | Tailwind CSS | Rapid, consistent UI styling without a separate component framework. |
| Backend | Node.js, Express, JavaScript ES modules | Small, explicit REST service in a separate process; business rules remain server-owned. |
| Database | PostgreSQL | Relational issue, user, comment, and activity data with transactions and constraints. |
| Data access | Prisma ORM | Fast schema iteration, generated migrations, readable data access, and a seed workflow. Do not add `pg` or a second ORM. |
| Validation | Zod | Shared, explicit server-side request schemas and useful field-level error reporting. |
| Authentication | `bcryptjs` password hashing and signed JWT bearer tokens | Minimal local/demo authentication suitable for a separate frontend and API. |
| API verification | Postman or equivalent HTTP client; automated tests where time permits | Makes the REST contract easy to exercise independently of the UI. |

Use npm. Use JavaScript files only (`.js`/`.jsx`); do not introduce TypeScript, Python, or Python-based tooling.

## 3. System architecture

```text
Browser
  |
  | HTTP, Next.js frontend (e.g. localhost:3000)
  | Authorization: Bearer <token>
  v
Express REST API (e.g. localhost:4000/api/v1)
  |
  | Prisma Client
  v
PostgreSQL
```

- The frontend renders pages and handles presentation, form state, and API calls.
- The Express API owns authentication, authorization, validation, status-transition rules, activity creation, and persistence.
- The frontend must not connect directly to PostgreSQL or implement an alternate business-logic path.
- The backend validates every input even when the frontend also validates it.
- Configure the API CORS allowlist for the frontend origin through environment configuration.

## 4. Suggested repository layout

```text
project/
  apps/
    web/
      app/
        layout.js
        page.js
        login/page.js
        issues/page.js
        issues/new/page.js
        issues/[id]/page.js
      components/
      lib/api.js
      package.json
    api/
      prisma/
        schema.prisma
        migrations/
        seed.js
      src/
        app.js
        server.js
        middleware/
        routes/
        services/
        validators/
      package.json
  package.json
  .env.example
  README.md
```

The API must be independently startable, and the web app must be independently startable. A root npm script may provide convenient concurrent startup, but it must not hide the separate processes or package responsibilities.

## 5. Data model

Use PostgreSQL with Prisma migrations. Store timestamps as timezone-aware database timestamps (`timestamptz` via Prisma `DateTime` with PostgreSQL). Use database-generated integer IDs for internal identity and a formatted issue key in the API/UI.

### User

| Field | Type | Notes |
|---|---|---|
| id | Int, autoincrement | Primary key. |
| name | String | Required display name. |
| email | String | Required, unique, normalized to lowercase. |
| passwordHash | String | Required; never return through API responses. |
| active | Boolean | Defaults true; inactive users cannot be assigned. |
| createdAt, updatedAt | DateTime | Managed timestamps. |

### Issue

| Field | Type | Notes |
|---|---|---|
| id | Int, autoincrement | Primary key; format as `ISS-` plus zero-padded ID for display. |
| title | String | Required, 5–120 characters. |
| description | String | Required, 10–5,000 characters. |
| status | Enum | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`; defaults `OPEN`. |
| priority | Enum | `LOW`, `MEDIUM`, `HIGH`, `URGENT`; defaults `MEDIUM`. |
| labels | String array | Defaults empty; supported values are `bug`, `feature`, `documentation`, `performance`, and `accessibility`; at most five unique labels. |
| reporterId | Int | Required FK to User. |
| assigneeId | Int nullable | Optional FK to User; must target an active user. |
| createdAt, updatedAt | DateTime | `updatedAt` changes on successful edits and status changes. |

Indexes: `(status, updatedAt)`, `(priority, updatedAt)`, `assigneeId`, `reporterId`, and `createdAt`. Search title/description with PostgreSQL `ILIKE` for the MVP; full-text search is not required.

### Comment

| Field | Type | Notes |
|---|---|---|
| id | Int, autoincrement | Primary key. |
| issueId | Int | Required FK to Issue; cascade delete is acceptable for referential cleanup though issue deletion is not exposed. |
| authorId | Int | Required FK to User. |
| body | String | Required, trimmed, 1–2,000 characters. |
| createdAt | DateTime | Set by server. |

Index `(issueId, createdAt)`.

### IssueEvent

| Field | Type | Notes |
|---|---|---|
| id | Int, autoincrement | Primary key. |
| issueId | Int | Required FK to Issue. |
| actorId | Int | Required FK to User. |
| type | Enum or constrained string | `CREATED`, `STATUS_CHANGED`, `ASSIGNEE_CHANGED`, `PRIORITY_CHANGED`, `TITLE_CHANGED`, `LABELS_CHANGED`. |
| fromValue | String nullable | Previous display value where applicable. |
| toValue | String nullable | New display value where applicable. |
| createdAt | DateTime | Set by server. |

Index `(issueId, createdAt)`. Store concise scalar values rather than duplicating full issue snapshots.

### Relationship and transaction rules

- One User can report or be assigned many Issues.
- One Issue has zero or more Comments and IssueEvents.
- Create an issue and its `CREATED` event in one transaction.
- Update an issue and all corresponding change events in one transaction.
- Comment creation does not create an IssueEvent; comments are shown in their own chronological thread.
- Do not accept `reporterId`, `authorId`, `actorId`, or timestamps from client payloads.

## 6. REST API contract

Base path: `/api/v1`. Responses use JSON. Protected routes require `Authorization: Bearer <token>`.

### Authentication

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Validate credentials and return a signed token plus safe user profile. |
| GET | `/auth/me` | Return the current authenticated user's safe profile. |

Login request: `{ "email": "demo@example.com", "password": "..." }`.
Login response: `{ "token": "...", "user": { "id": 1, "name": "...", "email": "..." } }`.

### Dashboard and reference data

| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard` | Return aggregate counts and recent/open issues for the current team. |
| GET | `/users` | Return active users' safe fields for assignee selection. |

Dashboard response shape:

```json
{
  "counts": {
    "open": 0,
    "inProgress": 0,
    "resolved": 0,
    "assignedToMe": 0
  },
  "recentIssues": []
}
```

### Issues

| Method | Path | Purpose |
|---|---|---|
| GET | `/issues` | Search, filter, sort, and paginate. |
| POST | `/issues` | Create an issue and initial activity event. |
| GET | `/issues/:id` | Get issue detail with reporter, assignee, comments, and events. |
| PATCH | `/issues/:id` | Update title, description, priority, assignee, and/or labels. |
| PATCH | `/issues/:id/status` | Apply and record one allowed status transition. |

List query parameters:

- `q`: optional title/description substring.
- `status`: optional one of `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`.
- `priority`: optional one of `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- `label`: optional supported label; matches issues containing that label.
- `assigneeId`: optional positive integer; the literal `unassigned` may select null assignees.
- `page`: positive integer, default 1.
- `pageSize`: integer, default 20, maximum 100.
- Fixed sort order: `updatedAt` descending, then `id` descending.

List response:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

Create request: `{ "title": "...", "description": "...", "priority": "MEDIUM", "assigneeId": 2, "labels": ["bug", "performance"] }`. `priority` and `labels` may be omitted to use their defaults; `assigneeId` may be null or omitted. Labels must be unique values from the supported set, with a maximum of five. The server supplies reporter, initial status, timestamps, and initial event.

General update accepts only supplied mutable fields: `title`, `description`, `priority`, `assigneeId`, and `labels`. Reject empty patches, unsupported/duplicate labels, and unknown fields. A label change adds a `LABELS_CHANGED` event with comma-separated prior and new labels (null for an empty set). Status changes use a separate endpoint and request body `{ "status": "IN_PROGRESS" }`, preventing an edit from bypassing transition validation.

Issue detail should return nested safe user summaries, comments ordered oldest-first, and events ordered oldest-first. Never expose password hashes or token secrets.

### Comments

| Method | Path | Purpose |
|---|---|---|
| POST | `/issues/:id/comments` | Add a comment using the authenticated user as author. |

Request: `{ "body": "Investigating the issue." }`. Response includes the safe author summary and server timestamp.

## 7. Validation, authorization, and error handling

- Validate route parameters, query parameters, and JSON request bodies with Zod schemas.
- Normalize login email to lowercase and trim user-provided title, description, and comment boundaries.
- Enforce length limits and enum membership on the server.
- Validate labels against the fixed supported set, reject duplicates, and cap the count at five.
- Verify an assignee exists and is active before create/update.
- Verify issue existence before nested operations; return `404` for an unknown issue.
- Validate status transition against the current database status. Use a transaction and update conditionally to avoid recording an event for a failed transition.
- Authentication middleware verifies signature and expiration and loads the current active user; reject missing/invalid auth with `401`.
- MVP authorization is any authenticated user for the single team. Keep identity derivation server-side and avoid trusting client-supplied actor IDs.

Consistent error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      { "field": "title", "message": "Title must be at least 5 characters." }
    ]
  }
}
```

Use appropriate HTTP statuses: `400` malformed/invalid request or unsupported transition, `401` unauthenticated, `404` missing resource, `409` uniqueness or concurrent conflict, and `500` unexpected server failure. Do not return stack traces or database internals to clients. Log unexpected errors server-side with enough context to diagnose them, without logging passwords or JWT secrets.

## 8. Frontend requirements

### Routes

- `/login`: sign-in form.
- `/`: dashboard (protected).
- `/issues`: searchable, filterable, paginated issue list with label filtering (protected).
- `/issues/new`: create form (protected).
- `/issues/[id]`: issue detail, label display/edit controls, status action, comments, and activity (protected).

### Reusable components

- `AppShell`, `Sidebar` or `TopNav`, `PageHeader`.
- `IssueTable`/`IssueCard`, `IssueStatusBadge`, `PriorityBadge`, `IssueFilters`.
- `IssueForm`, `AssigneeSelect`, `StatusControl`.
- `CommentList`, `CommentForm`, `ActivityTimeline`.
- Shared `LoadingState`, `EmptyState`, and `ErrorMessage`.

### Client/API behavior

- Centralize API base URL and fetch behavior in `lib/api.js`.
- Attach the bearer token to protected requests and handle `401` by clearing the session and returning to login.
- For the hackathon MVP, store the token in `sessionStorage`; do not place tokens in URLs or logs. Document that this is a demo-grade choice, not an ideal production token-storage strategy.
- Use server responses as source of truth; refresh or update displayed data only after successful API responses.
- Render server validation details next to the relevant fields where practical.

## 9. Configuration and local setup

Provide `.env.example` with placeholders and no secrets:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/issue_tracker?schema=public"
API_PORT=4000
WEB_ORIGIN="http://localhost:3000"
JWT_SECRET="replace-with-a-long-random-local-secret"
JWT_EXPIRES_IN="8h"
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api/v1"
```

- Read database URL, JWT secret, ports, and allowed origin from environment variables.
- Fail API startup with a clear message when required configuration is missing.
- Never commit real secrets.
- The README must explain PostgreSQL prerequisites/database creation, npm installation, environment setup, Prisma migration, seed command, starting API and frontend in separate terminals, demo credentials, and basic API testing.

## 10. Migrations and seed data

- Commit Prisma migration files; do not rely on `prisma db push` as the reproducible setup path.
- Provide npm scripts for migration deployment/development, seed, API dev/start, and web dev/build/start.
- Seed deterministically and idempotently using upserts.
- Include at least three demo users and enough issues to demonstrate every status and priority, assigned and unassigned issues, comments, and activity history.
- Document demo email/password credentials in the README; use non-production-only sample credentials and hash passwords in the seed script.

## 11. Testing and verification

Prioritize a few high-value checks over broad test scaffolding:

### API tests

- Login success and invalid-credential rejection.
- Unauthenticated protected-route rejection.
- Issue creation defaults, reporter identity, and initial event.
- Issue list filter/pagination behavior, including label matching.
- Label validation, persistence, and label-change activity.
- Valid and invalid status transitions.
- Comment validation and persistence.
- Assignment validation for missing/inactive users.

### Manual end-to-end smoke test

1. Run migrations and seed against local PostgreSQL.
2. Start the API and web app independently.
3. Sign in with a seeded account.
4. Create an issue, assign it, change status, add a comment, refresh, and confirm persistence/history.
5. Search/filter for the issue and verify dashboard counts change.

Use the repository's chosen test runner if one already exists; otherwise a small Node test setup or API-client collection is sufficient for the timebox.

## 12. Non-functional requirements

- All database queries are parameterized through Prisma; do not construct SQL from untrusted strings.
- Keep list endpoints bounded and paginated.
- Keep response payloads limited to fields the UI needs.
- Use HTTPS in deployed environments; local development may use HTTP.
- Avoid logging credentials, password hashes, authorization headers, or signing secrets.
- Use responsive layouts and accessible labels, keyboard-operable controls, and visible focus states.
- Provide useful error messages without exposing internals.

## 13. Implementation order for the approved build

1. Scaffold the API and web packages; add environment validation and health check.
2. Define Prisma schema, create migration, seed demo data, and verify PostgreSQL connectivity.
3. Implement login/auth middleware, users endpoint, and issue CRUD/list/detail/status/comment routes with validation.
4. Verify core REST workflows independently with an API client or focused tests.
5. Implement login, dashboard, issue list/create/detail experiences and connect them to the API.
6. Run the complete smoke test, address integration defects, and finish README setup instructions.

Keep the core user journey functional before adding visual polish. This order is a recommendation, not authorization to implement before PRD/TRD approval.

## 14. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Scope exceeds the timebox | Exclude integrations, uploads, notifications, custom workflows, and full admin tools. Prioritize the core issue lifecycle. |
| Frontend and API diverge | Keep a documented REST contract and exercise endpoints before UI integration. |
| Status or activity records become inconsistent | Perform issue updates and corresponding event inserts in one Prisma transaction. |
| Seed/setup consumes demo time | Keep migrations and seed idempotent, document exact commands, and verify clean setup early. |
| Demo authentication is mistaken for production-ready security | Clearly label the token storage and seeded-account approach as hackathon/demo-only. |
