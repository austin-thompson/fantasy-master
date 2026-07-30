# FantasyMaster

FantasyMaster is a self-hosted control plane for managing multiple NFL fantasy
football leagues across Sleeper, Yahoo, and ESPN. Its focus is cross-league
coordination: identifying what needs attention, showing player exposure and
availability, and reducing repeated checks across provider applications.

> **Current status:** Phase 2's canonical domain and Sleeper vertical slice are
> complete. The application supports local authentication, read-only Sleeper
> account lookup, NFL league import, normalized teams and rosters, matchup and
> transaction import, manual synchronization, freshness, and sync history.
> Phase 3 has not started.

## MVP Scope

The planned MVP will:

- Run locally as one web application and one PostgreSQL database.
- Provide local username/password authentication with a safe first-user
  bootstrap flow.
- Import supported NFL leagues through read-only provider adapters.
- Normalize leagues, teams, rosters, matchups, players, and synchronization
  state.
- Present a unified command center, action inbox, lineup validation, player
  exposure, and player availability.
- Make provider failures, unsupported data, and stale data explicit.
- Use deterministic rules and public NFL data for transparent decision support.

FantasyMaster is **read-only with respect to fantasy-platform transactions**.
Users will continue to make lineup, waiver, trade, add, and drop changes on the
source platform.

ESPN support may remain experimental because ESPN does not offer a comparably
documented public fantasy API. Its implementation is gated by a dedicated
security and reliability spike.

## Excluded Scope

The MVP does not include live-scoring replacement, social or community
features, league hosting, a draft room, automated transactions, an LLM-first
interface, proprietary projections, native mobile applications, multi-sport
support, a commissioner suite, public multi-tenant SaaS, microservices,
Kubernetes, Redis, or GraphQL.

## Technology Stack

- TypeScript in strict mode
- Next.js App Router on Node.js
- React, Tailwind CSS, and a minimal set of shadcn/ui components
- PostgreSQL and Prisma
- Better Auth with username/password authentication
- Zod validation
- pnpm
- Docker Compose
- Vitest, React Testing Library, and Playwright

## Repository Structure

```text
fantasy-master/
├── .github/workflows/  Continuous integration
├── context/            Governing product and engineering specifications
├── prisma/             Schema, migrations, and seed workflow
├── public/             Static assets
├── src/app/            Next.js App Router pages and route handlers
├── src/lib/            Shared server infrastructure
├── tests/              Unit and end-to-end tests
├── docker-compose.yml
├── Dockerfile
└── package.json
```

Domain modules described in the architecture document will be added
incrementally during their approved phases. See the
[context documentation index](context/README.md) for governing documents and
their reading order.

## Local Development

### Prerequisites

- Git
- Node.js 22.13 or later in the 22.x or 24.x lines
- pnpm 11.17.0 (the repository pins this through `packageManager`)
- Docker Engine with Docker Compose v2 for the container workflow

### Initial Setup

1. Clone the repository.
2. Copy `.env.example` to `.env`.
3. Replace the example database password in both `POSTGRES_PASSWORD` and
   `DATABASE_URL`. Keep it URL-safe or percent-encode it in `DATABASE_URL`.
   Replace `BETTER_AUTH_SECRET` with at least 32 random characters.
4. Install dependencies and generate the Prisma client:

```bash
pnpm install
pnpm prisma:generate
```

5. Start PostgreSQL (through Docker Compose or a local installation), apply the
   migration, seed foundation metadata, and start the app:

```bash
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

The application is available at `http://localhost:3000`. Liveness is reported
at `/api/health`; database-backed readiness is reported at `/api/ready`.
On an empty database, the application redirects to `/setup` to create the sole
local administrator. Public registration closes after that account is created.
The internal non-routable email attached to the credential account is derived
from the username and is not used for email delivery.

### Common Commands

```bash
pnpm dev              # Start the development server
pnpm build
pnpm start
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
```

Install the Chromium test runtime once before the first local end-to-end run:

```bash
pnpm exec playwright install chromium
```

### Docker Compose

```bash
docker compose up --build
docker compose down
```

Compose reads `.env`, builds the production image, runs migrations and the
idempotent seed, and waits for PostgreSQL readiness. Both ports bind to
localhost by default. PostgreSQL uses the named volume
`fantasy_master_postgres_data`, so `docker compose down` and normal container
restarts preserve data.

Do not add `--volumes` to the shutdown command unless permanent database
deletion is intentional.

### Sleeper Import

After signing in, enter a public Sleeper username and NFL season on the
dashboard. FantasyMaster discovers leagues and imports their current canonical
state. No Sleeper password or API token is required. Use **Sync now** to refresh
the connection; recent runs and failures remain visible while the last valid
league state is retained.

Pre-draft leagues can legitimately have empty rosters, matchups, and
transactions. Synchronize again after the league drafts.

### Testing

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm test:e2e
```

Integration tests delete authentication records and therefore refuse to run
unless `DATABASE_URL` names a dedicated database containing `_test`. The
end-to-end command starts its own development server and verifies anonymous
route protection and the health endpoint. CI provisions a dedicated PostgreSQL
service and runs migrations, unit tests, integration tests, and the production
build.

### Database Migrations

```bash
pnpm prisma:validate        # Validate schema and configuration
pnpm prisma:generate        # Generate the typed client
pnpm prisma:migrate         # Create/apply migrations during development
pnpm prisma:migrate:deploy  # Apply committed migrations non-interactively
pnpm prisma:seed            # Apply idempotent foundation seed data
```

Commit migration directories with their schema changes. Containers run
`prisma:migrate:deploy` rather than creating migrations at startup.

### Environment Configuration

`.env.example` documents all current settings. `DATABASE_URL`,
`BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` are required and validated with Zod
when server infrastructure loads; `LOG_LEVEL` defaults to `info`. The auth URL
must match the origin used to access the application. Compose also uses
`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, and
`APP_PORT`.

Real secrets must remain in ignored `.env` files or deployment configuration
and must never be committed. Provider credentials and tokens introduced in
later phases must remain server-side and must not be exposed to browser code.

## Contributing

FantasyMaster is an early-stage private project. Keep changes aligned with the
current roadmap phase and make the smallest complete vertical slice. Before
submitting a change:

- Read the governing specifications and follow their precedence rules.
- Do not pull deferred features into the MVP without an intentional
  documentation decision.
- Update documentation when behavior, constraints, or commands change.
- Add focused tests with implementation changes and report only checks that
  were actually run.
- Preserve provider boundaries, user ownership, and the read-only integration
  policy.
