# FantasyMaster Roadmap

## Delivery Strategy

Build vertical slices that prove the weekly management loop. Do not complete every database table before exposing usable behavior.

The implementation order is:

1. Establish a secure, reproducible local application.
2. Make one provider work end to end.
3. Normalize additional providers behind the same contracts.
4. Convert imported data into actionable cross-league features.
5. Add recommendations only after source data and identity mapping are trustworthy.

## Phase 0 — Repository and Runtime Foundation

**Outcome:** A developer can run, test, migrate, and reset the application consistently.

### Scope

- Create Next.js TypeScript application with strict compiler settings.
- Configure Tailwind CSS and a minimal component library.
- Configure PostgreSQL and Prisma.
- Add Dockerfile and Docker Compose.
- Add environment validation.
- Add database migrations and seed/bootstrap workflow.
- Add structured logging and health endpoints.
- Add Vitest and Playwright scaffolding.
- Establish formatting, linting, and CI checks.

### Exit Criteria

- `docker compose up` starts a healthy application and database.
- Database migrations run deterministically.
- A smoke test reaches the login page and health endpoint.
- Data survives restart.

## Phase 1 — Authentication and User Ownership

**Outcome:** The application has real account/session plumbing without pretending to be production SaaS.

### Scope

- Integrate Better Auth.
- Enable username/password sign-in.
- Bootstrap the first administrator from a setup page or one-time command.
- Disable public sign-up after initialization.
- Protect application routes and server actions.
- Add logout and session revocation.
- Add `userId` ownership to provider connections, leagues, preferences, actions, and sync records.

### Deferred Within Auth

- Password-reset email.
- Email verification.
- OAuth login.
- Passkeys and 2FA.
- Roles beyond local administrator.

### Exit Criteria

- Anonymous users cannot access fantasy data.
- A valid administrator session persists and can be revoked.
- No fantasy data record is globally owned by accident.

## Phase 2 — Canonical Domain and Sleeper Vertical Slice

**Outcome:** One Sleeper account produces a useful league dashboard through the complete normalized pipeline.

### Scope

- Define provider interfaces and capability model.
- Implement canonical league, team, roster, matchup, player, and sync entities.
- Implement Sleeper account lookup and league discovery.
- Import league settings, users, rosters, matchups, and transactions needed by MVP features.
- Store provider IDs and selected raw snapshots.
- Build player identity mapping using Sleeper and public ID data.
- Build league list and league detail views.
- Add manual sync and sync history.

### Exit Criteria

- Sleeper data is not read directly by UI components.
- Repeated syncs are idempotent.
- Failures retain the last valid snapshot and surface an error.
- At least one real league can be inspected end to end.

## Phase 3 — Cross-League MVP Features

**Outcome:** Multiple Sleeper leagues become materially easier to manage than using Sleeper alone.

### Scope

- Unified command center.
- Action inbox.
- Lineup and roster validation.
- Cross-league player exposure.
- Player availability search.
- Data freshness and stale-data warnings.
- User-defined league importance.

### Exit Criteria

- The application identifies at least the initial P0 action types.
- A player’s exposure and availability can be computed across imported leagues.
- A user can resolve, snooze, and ignore action items.
- The dashboard prioritizes leagues requiring attention.

## Phase 4 — Yahoo Adapter

**Outcome:** Yahoo leagues appear through the same product surfaces.

### Scope

- Register and configure Yahoo application credentials.
- Implement OAuth authorization and token refresh.
- Implement league discovery and normalized import.
- Map Yahoo player IDs to canonical players.
- Represent unsupported provider fields as explicit unknowns.
- Add provider contract tests using sanitized fixtures.

### Exit Criteria

- Yahoo leagues use the existing dashboard, exposure, availability, and action logic.
- Expired authorization produces a clear reconnect action.
- Provider-specific XML or REST quirks remain inside the Yahoo adapter.

## Phase 5 — ESPN Adapter Spike and Initial Support

**Outcome:** Determine and implement the safest reliable read-only ESPN import supported by current access constraints.

### Spike Questions

- Can public leagues be imported without authenticated session data?
- What is required for private leagues?
- What credentials or cookies would need local storage?
- Are endpoints stable enough for a supported adapter?
- What terms, operational, and security risks exist?
- Is a user-provided export or browser-assisted import a better first release?

### Implementation Scope

- Implement the chosen ESPN connection path.
- Isolate undocumented endpoint assumptions.
- Add versioned fixtures and adapter health checks.
- Add prominent experimental labeling if reliability remains uncertain.
- Fail independently from Sleeper and Yahoo.

### Exit Criteria

- Supported ESPN leagues import into the canonical model.
- Breakage cannot corrupt other provider data.
- The UI states the adapter’s support and freshness limitations honestly.

## Phase 6 — Three-Platform MVP Hardening

**Outcome:** Sleeper, Yahoo, and ESPN are usable together in a stable local release.

### Scope

- Cross-provider player identity audits.
- Sync retry and backoff.
- Provider-specific rate limits.
- Backup and restore documentation.
- Database migration upgrade path.
- Security review of stored provider secrets.
- Responsive UI pass.
- Accessibility pass for core flows.
- Error-state and empty-state polish.
- Representative end-to-end tests for all three providers.

### MVP Release Gate

- Install and upgrade are documented.
- Each provider can fail independently.
- Cross-league calculations exclude stale or unresolved data explicitly.
- No severe action is generated from an unsupported assumption without warning.
- Core features work without external AI or paid statistics.

## Phase 7 — Recommendations and Weekly Workflow

**Outcome:** The product moves from error prevention to transparent decision support.

### Scope

- Ingest public weekly statistics and schedules.
- Implement basic lineup comparison logic.
- Implement waiver-orchestration board.
- Add weekly deterministic summary.
- Add deadline timeline.
- Add in-app notifications and notification interface.
- Record recommendation inputs for later evaluation.

### Exit Criteria

- Recommendations can be reproduced from stored inputs.
- Every recommendation identifies its source data and freshness.
- The user can distinguish validation facts from model/heuristic suggestions.

## Phase 8 — Evidence-Driven Expansion

Choose only after observing actual usage.

Candidate directions:

- Trade workspace.
- News impact mapping.
- Decision analytics.
- Season strategy planning.
- Advanced exposure management.
- Dynasty mode.
- Additional platforms.
- Scheduled synchronization.
- External notifications.
- Multi-user deployment.
- Limited write integrations.

## Technical Debt Guardrails

### Allowed Early Compromises

- Manual synchronization.
- One deployable application.
- One database.
- In-process calculations.
- Limited historical retention.
- Provider fixture tests rather than full live integration tests.

### Not Allowed

- Provider payloads passed directly into UI components.
- Player joins based only on names.
- Silent stale-data reuse.
- Unencrypted long-lived OAuth secrets when encryption is practical.
- Business rules buried in React components.
- Provider-specific conditionals scattered through the domain layer.
- Recommendation results without source timestamps.

## Deferred Work Register

These items should remain visible but must not quietly enter an MVP sprint:

- Live scoring replacement.
- Social and chat features.
- League hosting.
- Draft room.
- Automated transactions.
- Native mobile apps.
- Multi-sport support.
- Commissioner suite.
- Proprietary projections.
- LLM-first interaction model.
- Kubernetes or microservice decomposition.

Any deferred item requires a written reason to enter the roadmap: demonstrated user demand, provider capability, measurable operational need, or revenue justification.
