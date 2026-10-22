# IssueDesk — Issue Tracking & Resolution Platform

A full-stack practice project for a five-hour NeoStats hackathon. IssueDesk provides a shared dashboard and workflow for reporting, assigning, tracking, commenting on, and resolving team issues.

The project follows the approved PRD/TRD: a Next.js App Router frontend and a separately running Express REST API, with PostgreSQL persistence owned by the backend.

## Technology

- Frontend: Next.js App Router, React, JavaScript, Tailwind CSS
- Backend: Node.js, Express, JavaScript ES modules, Zod validation
- Database: PostgreSQL with Prisma ORM and checked-in migrations
- Authentication: bcrypt password hashes and JWT bearer tokens
- Package manager: npm workspaces

## Requirements

- Node.js 20 or later and npm
- PostgreSQL 14 or later running locally

## Local setup

1. Create a local PostgreSQL database named `issue_tracker` (or choose a different name and update the connection string).
2. From the project root, install dependencies:

   ```powershell
   npm install
   ```

3. Copy `.env.example` to `.env` and set `DATABASE_URL`. Set `JWT_SECRET` to a random secret of at least 32 characters. The other values work for the default local ports.
4. Apply the committed schema migration and insert demo data:

   ```powershell
   npm run db:deploy
   npm run db:seed
   ```

   To create or edit migrations during development, use `npm run db:migrate`.

5. Start each process in a separate terminal from the project root:

   **API**
   ```powershell
   npm run dev:api
   ```

   **Web app**
   ```powershell
   npm run dev:web
   ```

6. Open [http://localhost:3000](http://localhost:3000). The API health endpoint is [http://localhost:4000/health](http://localhost:4000/health).

The API and web app may also be run directly from `apps/api` and `apps/web` using their respective npm scripts.

## Demo accounts

The seed script provisions these local-only team members:

| Email | Password |
|---|---|
| alex@example.com | Practice123! |
| sam@example.com | Practice123! |
| jamie@example.com | Practice123! |

Seeded credentials and JWT/session handling are for local practice only. Do not reuse these credentials or treat this setup as production authentication.

## API overview

Base URL: `http://localhost:4000/api/v1`

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/auth/login` | Sign in | No |
| GET | `/auth/me` | Current user | Yes |
| GET | `/dashboard` | Counts and recent active issues | Yes |
| GET | `/users` | Active assignees | Yes |
| GET | `/issues` | Search, filter by status/priority/assignee/label, paginate | Yes |
| POST | `/issues` | Create issue | Yes |
| GET | `/issues/:id` | Issue detail, comments, activity | Yes |
| PATCH | `/issues/:id` | Edit issue fields | Yes |
| PATCH | `/issues/:id/status` | Change status using workflow rules | Yes |
| POST | `/issues/:id/comments` | Add a comment | Yes |

For protected requests, send `Authorization: Bearer <token>`. Issue list query parameters include `q`, `status`, `priority`, `label`, `assigneeId` (including `unassigned`), `page`, and `pageSize`.

Example PowerShell login and list requests:

```powershell
$login = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:4000/api/v1/auth/login `
  -ContentType "application/json" `
  -Body '{"email":"alex@example.com","password":"Practice123!"}'

$headers = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod -Uri "http://localhost:4000/api/v1/issues?status=OPEN&page=1&pageSize=20" -Headers $headers
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev:api` | Start the API with Node watch mode |
| `npm run dev:web` | Start Next.js in development mode |
| `npm run start:api` | Start the API |
| `npm run start:web` | Start the production Next.js server after building |
| `npm run db:migrate` | Create/apply a development Prisma migration |
| `npm run db:deploy` | Apply committed migrations |
| `npm run db:seed` | Seed demo users and issues (safe to rerun) |
| `npm run build:web` | Build the frontend |
| `npm run check` | Run API transition/key tests and JavaScript syntax checks |

## MVP behavior

- Statuses: Open → In Progress → Resolved → Closed; any non-Closed status can return to Open. Closed is terminal.
- Priorities: Low, Medium, High, Urgent.
- Every authenticated teammate can create, view, edit, assign, label, transition, and comment on shared issues.
- The backend sets reporter, comment author, activity actor, and timestamps from the authenticated session/server.
- Search covers issue title and description. Results use bounded pagination and stable update-time ordering; filters can be combined with labels.
- Choose up to five unique labels per issue from Bug, Feature, Documentation, Performance, and Accessibility.
- Activity is recorded for creation and changes to title, priority, assignment, labels, and status.

## Security and operational notes

- Store real configuration only in an untracked `.env`; `.env.example` contains placeholders.
- Passwords are stored as bcrypt hashes. API responses never include password hashes.
- The web client stores its short-lived demo JWT in `sessionStorage`. For production, use an appropriately reviewed authentication/session design, HTTPS, secure cookie settings, stronger operational controls, and a dedicated secret manager.
- CORS is limited to `WEB_ORIGIN`; set it to the deployed frontend origin outside local development.
- File uploads, notifications, registration, password recovery, custom workflows, and multi-tenant workspaces are intentionally out of scope.
