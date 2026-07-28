# FantasyMaster

> A self-hosted control plane for managing multiple NFL fantasy football leagues across Sleeper, ESPN, and Yahoo.

## Chosen Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript, strict mode | One language across UI, server, integrations, tests, and shared domain types. |
| Application | Next.js App Router on Node.js | A single deployable web application with server-rendered UI, route handlers, and server-side integration code. Avoids a separate frontend/backend split during MVP. |
| UI | React, Tailwind CSS, shadcn/ui | Responsive, clean UI without inventing a design system. Components remain local and customizable. |
| Database | PostgreSQL | Slightly heavier than SQLite, but avoids a likely database migration when the app moves beyond one user or one machine. |
| ORM | Prisma ORM | Type-safe queries, explicit schema migrations, and a straightforward TypeScript developer experience. |
| Authentication | Better Auth with username/password support | Provides real session and account plumbing now while leaving room for passkeys, OAuth, multi-user access, and stronger account policies later. |
| Validation | Zod | Shared validation for environment variables, forms, API payloads, provider responses, and normalized domain objects. |
| Testing | Vitest, React Testing Library, Playwright | Fast unit tests, component behavior tests, and a small number of critical end-to-end flows. |
| Deployment | Docker Compose | Initially runs the application and PostgreSQL locally with persistent named volumes. The same container can later run on a server or container platform. |
| Package manager | pnpm | Fast, deterministic package management with workspace support if the repository later gains additional packages. |
| Statistics | Public NFL datasets, initially nflverse-compatible data | No paid feed or LLM dependency. Store source provenance and timestamps so providers can be replaced later. |
| Architecture style | Modular monolith | One application and database, with strict internal module boundaries. Extract services only when operational pressure proves the need. |

### Explicit Non-Choices for MVP

- No microservices.
- No Kubernetes.
- No Redis or message queue.
- No GraphQL.
- No native mobile application.
- No LLM or paid AI API dependency.
- No direct transaction execution on fantasy platforms.
- No attempt to host leagues or replace Sleeper, ESPN, or Yahoo.

## Product Thesis

FantasyMaster should not be another fantasy scoreboard or a prettier wrapper around existing platforms. Its value is cross-league coordination.

The application must answer:

1. What changed across my leagues?
2. What decisions require attention?
3. Where can I gain an edge with the least wasted effort?

The primary abstraction is an **actionable portfolio of fantasy teams**, not a collection of isolated league pages.

## Initial User

A serious NFL fantasy football manager who:

- Manages roughly 3–10 leagues.
- Uses more than one fantasy platform.
- Loses time checking the same players and deadlines repeatedly.
- Wants better organization and decision support without surrendering control.
- Is comfortable self-hosting a Dockerized application.

The initial installation is single-user, but the data model and authentication plumbing must not assume that only one user can ever exist.

## Scope Decisions

### Sport

- NFL fantasy football only.
- The first domain model may use generic names where inexpensive, but the implementation must not contort itself to support hypothetical sports.
- Multi-sport support is a later product decision, not an MVP requirement.

### Platforms

The initial product targets:

1. Sleeper
2. Yahoo Fantasy Sports
3. ESPN Fantasy Football

All platform data must pass through provider adapters and be normalized before reaching product features.

Planned later additions:

- Fantrax and other fantasy platforms.
- Manual league and roster entry.
- File import/export where API access is unavailable.

### Integration Direction

- MVP integrations are read-only.
- The application may calculate and recommend actions, but the user executes them on the source platform.
- Provider interfaces should distinguish read capabilities from future write capabilities.
- Direct lineup, waiver, trade, and roster execution may be added only where platform APIs, user consent, reliability, and terms permit it.

### Deployment

- Initial deployment: one local user through Docker Compose.
- Default access should bind to localhost unless the operator deliberately exposes it.
- Data must persist through container restarts and upgrades.
- Backup and restore must be documented before the first stable release.

### Authentication

- Bootstrap a single local administrator during setup.
- Use username and password authentication with secure hashed credentials and database-backed sessions.
- Disable open registration by default after bootstrap.
- Keep account ownership on every user-scoped record even though MVP has one user.
- Defer password reset email, OAuth, passkeys, 2FA, organizations, and role-based access control.

### Intelligence

- MVP uses deterministic logic and public statistics.
- Recommendations must expose their inputs, confidence, and freshness where practical.
- No LLM is required to operate the product.
- Future LLM features may summarize, explain, or converse over already-computed results; they should not be the sole source of rankings or decisions.

## Product Principles

### 1. Action over information

Every dashboard element should help the user decide, prioritize, or verify something. Passive data belongs behind an action-oriented summary.

### 2. Cross-league first

A feature that works only inside one league should justify why the existing platform does not already solve it adequately.

### 3. Explain recommendations

A recommendation should include the relevant league settings, alternatives, expected effect, and data freshness. Black-box certainty will destroy trust quickly.

### 4. Preserve source truth

FantasyMaster is an analytical mirror, not the system of record. The source platform remains authoritative for rosters, lineups, transactions, and scoring.

### 5. Degrade gracefully

One broken provider must not make unrelated leagues unusable. The UI must show stale data and sync failures explicitly rather than silently displaying old information.

### 6. K.I.S.S.

Prefer the smallest design that supports the next credible stage. Build interfaces at volatility boundaries—platform adapters, statistics providers, and notification channels—not around every function.

## MVP Success Criteria

The MVP succeeds when a user can:

- Install the application through Docker Compose.
- Create the local administrator account and sign in.
- Connect or identify accounts on Sleeper, Yahoo, and ESPN.
- Import all supported NFL leagues and rosters.
- See one normalized dashboard across platforms.
- Identify invalid, incomplete, injured, or deadline-sensitive lineup situations.
- See cross-league player exposure and player availability.
- Review a prioritized action inbox.
- Refresh data manually and understand when each data source was last synchronized.
- Receive useful recommendations without an LLM or paid data provider.

A technically successful import is not enough. The product must save repeated checking and reduce missed actions.

## Documentation Map

- [FEATURES.md](./FEATURES.md): detailed feature inventory, priorities, and acceptance boundaries.
- [ROADMAP.md](./ROADMAP.md): phased implementation plan and deferred work.
- [ARCHITECTURE.md](./ARCHITECTURE.md): application structure, domain boundaries, storage, sync, security, and deployment.
- [INTEGRATIONS.md](./INTEGRATIONS.md): provider strategy, capability matrix, risks, and normalization rules.

## Open Product Questions

These should be answered through implementation spikes or user testing rather than speculative architecture:

- Which cross-league view becomes the habitual home screen: action inbox, league grid, or player exposure?
- How much recommendation logic can be useful without proprietary projections?
- Does the target user prefer scheduled refreshes or deliberate manual synchronization?
- Which ESPN access method is sufficiently reliable and compliant for a stable release?
- Should dynasty support remain light or become a distinct product mode?
- What information is valuable enough to justify external notifications rather than in-app alerts?

## References

- Next.js self-hosting: https://nextjs.org/docs/app/guides/self-hosting
- Prisma with Docker: https://www.prisma.io/docs/guides/deployment/docker
- Better Auth: https://better-auth.com/docs
- Sleeper API: https://docs.sleeper.com/
- Yahoo Fantasy Sports API: https://sports.yahoo.com/developer/
- nflverse: https://github.com/nflverse
