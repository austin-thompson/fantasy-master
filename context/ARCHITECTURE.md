# FantasyMaster Architecture

## Architecture Summary

FantasyMaster begins as a **modular monolith**:

- One Next.js application.
- One PostgreSQL database.
- One Docker image for the application.
- One Docker Compose deployment.
- Server-side provider adapters and analytics modules.
- Responsive web UI served from the same application.

This is intentionally boring. The difficult part is normalizing unreliable fantasy-platform data and producing trustworthy cross-league decisions, not distributing HTTP calls across containers.

## Deployment Topology

```text
Browser
   |
   v
Next.js application container
   |-- UI and server rendering
   |-- Route handlers / server actions
   |-- Authentication
   |-- Provider adapters
   |-- Sync orchestration
   |-- Domain services
   |-- Recommendation logic
   |
   v
PostgreSQL container
   |-- Users and sessions
   |-- Provider connections
   |-- Canonical fantasy data
   |-- Raw snapshots and sync history
   |-- Action items and preferences
```

The default Compose configuration should expose the application only to localhost. Remote exposure requires the operator to configure TLS and a reverse proxy.

## Repository Shape

A single application repository is sufficient:

```text
fantasymaster/
  app/                       # Next.js routes and layouts
  components/                # Reusable UI components
  modules/
    auth/                    # Auth configuration and access helpers
    providers/               # Provider contracts and adapters
      sleeper/
      yahoo/
      espn/
    leagues/                 # Canonical league queries and services
    players/                 # Player identity and metadata
    sync/                    # Sync orchestration and run history
    actions/                 # Action detection and lifecycle
    exposure/                # Cross-league exposure calculations
    availability/            # Player availability calculations
    recommendations/         # Later deterministic recommendation logic
    statistics/              # Public-statistics ingestion and provenance
  lib/                       # Shared infrastructure utilities
  prisma/                    # Schema, migrations, seed/bootstrap
  tests/
    fixtures/                # Sanitized provider payloads
    integration/
    e2e/
  docker-compose.yml
  Dockerfile
```

Do not create separate packages until code is actually shared with another deployable client or service. Folder boundaries and exported interfaces are enough during MVP.

## Internal Module Rules

- UI modules call application/domain services, not provider clients.
- Provider adapters return normalized transfer objects or explicit unsupported fields.
- Domain services never import Sleeper-, Yahoo-, or ESPN-specific types.
- Database access should be owned by modules or a small repository layer, not scattered through components.
- Recommendation modules consume canonical data plus statistics snapshots.
- Authentication and authorization checks happen server-side for every user-scoped operation.

## Provider Adapter Contract

Each platform implements a common interface resembling:

```ts
interface FantasyProviderAdapter {
  readonly provider: Provider;
  readonly capabilities: ProviderCapabilities;

  validateConnection(input: ConnectionInput): Promise<ConnectionResult>;
  discoverLeagues(context: ProviderContext, season: number): Promise<ExternalLeague[]>;
  fetchLeague(context: ProviderContext, leagueId: string): Promise<LeagueSnapshot>;
  fetchRosters(context: ProviderContext, leagueId: string): Promise<RosterSnapshot[]>;
  fetchMatchups(context: ProviderContext, leagueId: string, week: number): Promise<MatchupSnapshot[]>;
  fetchTransactions?(context: ProviderContext, leagueId: string): Promise<TransactionSnapshot[]>;
  fetchAvailablePlayers?(context: ProviderContext, leagueId: string): Promise<PlayerAvailabilitySnapshot[]>;
}
```

Future write capabilities should use separate interfaces:

```ts
interface LineupWriteCapability {
  setLineup(...): Promise<WriteResult>;
}

interface WaiverWriteCapability {
  submitClaim(...): Promise<WriteResult>;
}
```

Do not add empty write methods to every read adapter. Capability discovery should be explicit.

## Canonical Domain Model

Core entities should include:

### User and Access

- `User`
- `Session`
- `Account` or auth-provider record
- `UserPreference`

### Provider Connectivity

- `ProviderConnection`
- `ProviderCredential` or encrypted token fields
- `SyncRun`
- `SyncError`
- `RawProviderSnapshot`

### Fantasy Domain

- `League`
- `LeagueSettings`
- `FantasyTeam`
- `Roster`
- `RosterSlot`
- `Matchup`
- `Transaction`
- `WaiverState`
- `LeagueDeadline`

### Player Domain

- `Player`
- `PlayerExternalId`
- `PlayerAlias`
- `PlayerStatusSnapshot`
- `PlayerStatisticSnapshot`
- `PlayerProjectionSnapshot` if projections are later imported or computed

### Product Workflow

- `ActionItem`
- `ActionEvidence`
- `Recommendation`
- `RecommendationInputSnapshot`
- `Notification`

Every canonical provider-owned entity should retain:

- Internal ID.
- User ownership.
- Provider.
- External ID.
- Source update time when available.
- Ingestion time.
- Last successful sync ID.

## Raw and Canonical Data

Store both selectively:

### Canonical Data

Used by product queries and normalized across platforms. It should be compact, indexed, and stable.

### Raw Snapshots

Used for:

- Debugging provider changes.
- Reproducing mapping failures.
- Building fixture tests.
- Reprocessing data after normalization fixes.

Raw retention should be bounded. Keep the latest successful snapshots and a limited failure/debug history rather than an infinite archive.

## Synchronization Model

### MVP

- User-triggered synchronization.
- One active sync per provider connection.
- Sync state persisted in PostgreSQL.
- Provider requests performed server-side.
- Each sync writes a run record with timestamps, counts, warnings, and errors.
- Upserts occur within bounded transactions.
- Failed syncs do not erase the last valid canonical state.

### Later

- Scheduled syncs.
- A separate worker process built from the same repository and image.
- Database-backed job claims before adding Redis.
- External queue only when multiple workers or throughput make it necessary.

## Sync Pipeline

```text
Acquire sync lock
  -> validate provider connection
  -> fetch provider payloads
  -> validate payload schemas
  -> store selected raw snapshot
  -> resolve external player identities
  -> normalize entities
  -> upsert canonical state
  -> recompute derived actions/exposure
  -> record success, warnings, and freshness
  -> release lock
```

A failure before canonical commit should leave the previous state intact. Partial provider data should be recorded as partial, not silently treated as complete.

## Derived Data Strategy

Start with query-time or post-sync calculations.

Good candidates for persisted derived records:

- Open action items, because they have lifecycle state.
- Recommendation snapshots, because later evaluation needs the original inputs.
- Notifications, because delivery/read state matters.

Good candidates for calculated queries initially:

- Exposure percentages.
- League summary counts.
- Availability matrices.

Materialize only after profiling shows a need.

## Action Engine

Action detectors should be small deterministic rules:

```ts
interface ActionDetector {
  readonly type: ActionType;
  detect(context: LeagueAnalysisContext): Promise<DetectedAction[]>;
}
```

Each result includes evidence, severity, deadline, and a stable fingerprint. The fingerprint allows syncs to update an existing action rather than creating duplicates.

Resolution behavior:

- Automatically resolve when the underlying condition disappears.
- Preserve user-ignored state unless the condition materially changes.
- Snoozed actions return when their deadline or wake time is reached.
- Record why an action was opened and resolved.

## Statistics and Recommendation Data

Public NFL data should be ingested through a statistics-provider boundary, not fetched ad hoc inside recommendation code.

```ts
interface StatisticsProvider {
  importSchedule(season: number): Promise<ScheduleImport>;
  importWeeklyPlayerStats(season: number, week?: number): Promise<PlayerStatsImport>;
  importPlayerMetadata(): Promise<PlayerMetadataImport>;
}
```

Store:

- Dataset name and version/release.
- Source URL or identifier.
- Download/import time.
- Coverage period.
- Transformation version.

Recommendations should be reproducible from stored source data and rules. LLM output, if added later, may explain a recommendation but should not mutate its underlying score.

## Authentication and Authorization

### MVP Controls

- Username/password authentication through Better Auth.
- Database-backed sessions.
- Secure, HTTP-only, same-site cookies.
- Open sign-up disabled after local bootstrap.
- Rate-limit login attempts.
- Require authorization checks in server-side data access functions.
- Scope all provider connections and fantasy records to a user.

### Local Deployment Caveat

Authentication does not make plain HTTP safe over an untrusted network. The default deployment should remain localhost-only. Remote access requires TLS, a reverse proxy, and secure secret management.

## Provider Secret Storage

- Sleeper may require only a user identifier for public read access.
- Yahoo OAuth tokens and any ESPN session material are sensitive.
- Use application-level encryption for long-lived provider secrets before database storage.
- Store the encryption key outside the database through environment configuration.
- Never expose raw tokens to the browser after connection.
- Log token metadata and expiration, never token values.

## Error Handling

Errors should be classified:

- Authentication/authorization failure.
- Provider authorization expired.
- Provider rate limit.
- Provider schema changed.
- Transient network failure.
- Unsupported league setting.
- Player identity unresolved.
- Database or internal invariant failure.

The UI should present the action the user can take: retry, reconnect, inspect unsupported fields, or wait. Generic “something went wrong” is acceptable only as a final fallback.

## Observability

MVP needs disciplined local observability, not a cloud platform:

- Structured JSON logs in production mode.
- Human-readable development logs.
- Request correlation IDs.
- Sync run IDs propagated through provider logs.
- Health and readiness endpoints.
- Admin-visible sync history and errors.
- No sensitive credentials or full cookies in logs.

Later, OpenTelemetry can be added without changing domain code if logs and boundaries are already clean.

## Testing Strategy

### Unit Tests

- Scoring-rule normalization.
- Roster-slot eligibility.
- Player identity resolution.
- Action detectors.
- Exposure calculations.
- Recommendation formulas.

### Provider Contract Tests

Use sanitized recorded fixtures to verify each adapter produces canonical snapshots. Fixtures should include normal leagues, unusual scoring, missing fields, private access failures, and schema drift cases.

### Integration Tests

- Database migrations.
- Sync idempotency.
- Action lifecycle across repeated syncs.
- Authorization boundaries.
- Token encryption/decryption.

### End-to-End Tests

Keep the suite narrow:

- Bootstrap and sign in.
- Connect/import a fixture-backed provider.
- View dashboard.
- Refresh data.
- Inspect and resolve an action.
- Search player availability.

## Scaling Path

Scale only after the single-user system works:

1. Run the same container on a small server.
2. Add TLS and reverse proxy.
3. Enable scheduled jobs through a separate worker process.
4. Add multi-user account flows and isolation tests.
5. Add database connection pooling and caching where measured.
6. Add queue infrastructure only when job concurrency requires it.
7. Split services only when deployment cadence, ownership, or load differs materially.

The normalized provider boundary and user ownership model provide future-proofing. Microservices do not.
