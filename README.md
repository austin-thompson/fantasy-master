# FantasyMaster

FantasyMaster is a self-hosted control plane for managing multiple NFL fantasy
football leagues across Sleeper, Yahoo, and ESPN. Its focus is cross-league
coordination: identifying what needs attention, showing player exposure and
availability, and reducing repeated checks across provider applications.

> **Current status:** Phase 0A (documentation organization). Application
> scaffolding and runnable development commands are planned for Phase 0B but do
> not exist yet.

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

## Planned Technology Stack

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
├── context/       Governing product and engineering specifications
├── .gitignore
├── LICENSE
└── README.md
```

The application structure described in the architecture document will be added
incrementally during approved implementation phases. See the
[context documentation index](context/README.md) for the governing documents
and their reading order.

## Local Development

### Prerequisites

Phase 0A only requires Git and a Markdown viewer. Phase 0B is planned to require:

- A supported Node.js LTS release
- pnpm
- Docker with Docker Compose

Exact supported versions will be recorded when the application is scaffolded.

### Initial Setup

At the current documentation-only stage:

1. Clone the repository.
2. Read the [context documentation index](context/README.md).
3. Review the governing specifications in the recommended order.

There are no dependencies to install and no application to start yet.

### Planned pnpm Commands

The following command interface is planned for Phase 0B. These commands are
**not available yet** and will be updated when backed by package scripts:

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm prisma:generate
pnpm prisma:migrate
```

### Planned Docker Compose Workflow

Docker Compose configuration does not exist during Phase 0A. Phase 0B is
planned to provide:

```bash
docker compose up --build
docker compose down
```

The Compose deployment will bind the application to localhost by default and
use a named volume for PostgreSQL data. Normal shutdown instructions will not
delete that volume.

### Planned Testing and Database Workflows

Linting, type checking, unit/component tests, Playwright smoke tests, and Prisma
migration workflows will be introduced in Phase 0B. Until their configuration
and package scripts exist, there are no executable test or database migration
commands in this repository.

### Environment Configuration

No environment variables are required during Phase 0A. Phase 0B will add a
checked-in `.env.example` containing non-secret placeholders and Zod-based
startup validation. Real secrets must remain in ignored local environment files
or deployment configuration and must never be committed. Provider credentials
and tokens must remain server-side and must not be exposed to browser code.

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

