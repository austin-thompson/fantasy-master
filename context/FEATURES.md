# FantasyMaster Feature Plan

## Priority Scale

| Priority | Meaning |
|---|---|
| P0 | Required for the first usable MVP. The product is incomplete without it. |
| P1 | High-value follow-up after the core import and action loop is stable. |
| P2 | Differentiating capability that should follow real usage and data validation. |
| P3 | Expansion area; useful, but outside the initial product wedge. |
| Deferred | Explicitly excluded until the core product proves demand. |

## P0 — MVP Foundation

### Local Installation and Bootstrap

**Goal:** Make the application reproducible and safe enough to run locally without hand-editing the database.

**Requirements:**

- Docker Compose starts the web application and PostgreSQL.
- First-run bootstrap creates one administrator account.
- Open registration is disabled after bootstrap.
- Persistent volumes retain database state.
- Health endpoints report application and database readiness.
- Environment variables are validated at startup.
- A documented backup and restore path exists.

**Acceptance boundary:** A clean machine with Docker can launch the app, create an account, restart containers, and retain data.

### Platform Account Connections

**Goal:** Establish read-only access or identifiers for Sleeper, Yahoo, and ESPN.

**Requirements:**

- Provider-specific connection flow.
- Connection status, last successful sync, and last error.
- Credentials or tokens encrypted or otherwise protected at rest where applicable.
- Disconnect and reauthorize behavior.
- No provider details leak into generic UI components.

**Notes:** Sleeper is the reference implementation. Yahoo requires an OAuth flow. ESPN is the highest-risk adapter and may initially require session data or an experimental import path.

### League and Roster Import

**Goal:** Import the user’s NFL leagues into a normalized internal model.

**Requirements:**

- Discover leagues for the current NFL season.
- Import league settings, scoring rules, roster slots, teams, rosters, matchups, and relevant transactions when available.
- Preserve provider IDs and raw payload snapshots for debugging.
- Upsert without duplicating leagues or players.
- Mark removed or unavailable leagues rather than silently deleting history.
- Show unsupported settings explicitly.

**Acceptance boundary:** The same dashboard components can display leagues from all supported providers without provider-specific branching.

### Player Identity Resolution

**Goal:** Recognize the same NFL player across multiple platform-specific identifiers.

**Requirements:**

- Canonical internal player record.
- Mapping table for Sleeper, ESPN, Yahoo, and statistics-provider IDs.
- Alias and name normalization support.
- Confidence/status for unresolved mappings.
- Administrative repair path for mismatches.
- Never merge players solely because their display names match.

**Why P0:** Cross-league exposure and availability are invalid without reliable identity resolution.

### Unified League Command Center

**Goal:** Provide one concise view of all leagues and current risk.

**Per-league summary:**

- Platform and league name.
- Team name, record, rank, and current matchup.
- League type and scoring summary.
- Data freshness.
- Number of unresolved action items.
- High-level roster health and lineup completeness.
- Next known deadline or lock time.

**Cross-league summary:**

- Total leagues.
- Leagues requiring attention.
- Injured or unavailable starters.
- Incomplete lineups.
- Pending provider failures or stale data.

**Acceptance boundary:** A user can identify the leagues requiring attention without opening every league.

### Action Inbox

**Goal:** Turn imported data into a prioritized work queue.

**Initial action types:**

- Empty required lineup slot.
- Starter marked out, suspended, inactive, or on bye.
- Player in an ineligible IR slot.
- Questionable player approaching lock time.
- Stale league data requiring refresh.
- Provider connection failure.
- Conflicting or incomplete player identity mapping that affects analysis.

**Action fields:**

- Severity and urgency.
- League and affected player.
- Deadline.
- Explanation and evidence.
- Recommended next step when deterministic.
- Status: open, resolved, snoozed, ignored.
- Creation and resolution timestamps.

**Prioritization:** Deadline first, then potential competitive impact, then league importance.

### Roster and Lineup Validation

**Goal:** Detect avoidable management errors before player lock.

**Requirements:**

- Interpret provider roster-slot rules.
- Validate required starters and eligible positions.
- Detect bye weeks and known availability statuses.
- Distinguish platform data from statistical inference.
- Recalculate after every sync.
- Avoid claiming a lineup is legal when a provider-specific rule is unsupported.

### Cross-League Player Exposure

**Goal:** Treat repeated player ownership as portfolio concentration.

**Metrics:**

- Rostered league count and percentage.
- Started league count and percentage.
- Exposure by position, platform, league type, and league importance.
- Bye-week concentration.
- Injury/status concentration.
- Opponent exposure where matchup data permits.

**Views:**

- Highest-owned players.
- Highest-started players.
- Concentrated bye weeks.
- Players simultaneously rostered and opposed.
- Unresolved identity mappings excluded from totals with a visible warning.

### Cross-League Player Availability

**Goal:** Answer where a player is available without opening each platform.

**Requirements:**

- Search canonical players.
- Show rostered, available, waiver-locked, or unknown by league.
- Include league roster need and current depth.
- Show data freshness and provider limitations.
- Do not imply a claim can be executed from FantasyMaster.

### Manual Synchronization and Freshness

**Goal:** Make data age and provider reliability visible.

**Requirements:**

- Refresh all providers or one provider/league.
- Prevent duplicate concurrent syncs.
- Track sync runs, duration, imported counts, warnings, and errors.
- Apply rate limiting and backoff.
- Keep the last valid snapshot if a sync fails.
- Display stale-data badges based on configurable thresholds.

**MVP simplification:** Manual refresh is sufficient initially. Scheduled refresh can follow after provider behavior is understood.

## P1 — Strong Product Loop

### League Importance and Management Policy

Allow the user to classify leagues as primary, competitive, casual, experimental, dynasty contender, dynasty rebuild, or best ball.

Policies influence:

- Action priority.
- Risk tolerance.
- Recommendation style.
- Notification eligibility.
- Whether lineup warnings apply.

### Basic Lineup Recommendations

**Goal:** Compare legal starting alternatives using transparent, public data.

**Capabilities:**

- Rank eligible players for each slot.
- Show projected range or simple confidence band when defensible.
- Offer floor, balanced, and upside views.
- Adjust explanation for favored versus underdog matchup context.
- Show data source and update time.

**Boundary:** Recommendations remain suggestions. No automatic lineup changes and no false precision.

### Waiver-Orchestration Board

**Goal:** Coordinate waiver decisions across leagues.

**Capabilities:**

- Show player availability across all leagues.
- Identify positional need and likely drop candidates.
- Classify adds as immediate starter, depth, injury hedge, or speculative hold.
- Display waiver priority or FAAB state where providers expose it.
- Allow the user to record an intended claim plan.

**Boundary:** No claim submission in P1.

### Weekly Summary

A generated, deterministic report containing:

- Open actions before the week’s earliest lock.
- Major exposure risks.
- Waiver opportunities.
- Lineup decisions with the smallest margins.
- Provider failures or stale data.

The report should be usable without an LLM. A future LLM may rewrite it, but the underlying facts must be computed first.

### In-App Deadline Timeline

Consolidate:

- Waiver processing.
- Early NFL games.
- Player lock times.
- Trade deadlines.
- Playoff start dates.
- Keeper deadlines when provider data supports them.

The timeline feeds the action inbox rather than existing as a passive calendar alone.

### Notification Plumbing

Create a channel-neutral notification interface and an in-app notification center.

Deferred channel implementations may include email, browser push, Slack, Discord, or mobile push. MVP should avoid requiring external infrastructure.

## P2 — Differentiating Intelligence

### Trade Workspace

- Incoming and outgoing trade tracking.
- Roster-contextual value comparison.
- Starter replacement cost.
- Rest-of-season and playoff schedule considerations.
- Exposure before and after a proposed trade.
- Suggested counteroffer construction.
- User notes and negotiation history.

### News-to-Roster Impact Mapping

Transform news into affected leagues, players, opponents, available replacements, and deadlines. A generic news feed is explicitly not the goal.

This requires a reliable and legally usable news/status source and should not be built on brittle scraping by default.

### Performance and Decision Analytics

- Points left on bench.
- Start/sit decision quality using pre-lock information.
- Waiver value generated.
- Expected record versus actual record.
- Projection error and calibration.
- League-level management trends.

Avoid hindsight theater. Evaluate whether a decision was reasonable at the time, not merely whether the outcome was good.

### Season Strategy Planning

- Bye-week preparation.
- Playoff schedule strength.
- Positional scarcity.
- Handcuff and stack coverage.
- Roster aging and future picks for dynasty.
- Contender versus rebuild signals.

### Advanced Exposure Management

- Correlated player outcomes.
- Team-stack concentration.
- Injury cluster scenarios.
- Exposure targets and warnings.
- Portfolio-level floor and ceiling views.

## P3 — Expansion Areas

### Commissioner Toolkit

- Dues tracking.
- Rule and constitution storage.
- Polls and votes.
- Keeper submission tracking.
- Draft scheduling.
- Commissioner announcements.
- League history and awards.

This is a separate buyer and workflow. It should not dilute the manager-focused product until demand is proven.

### Light Dynasty Mode

- Draft-pick inventory.
- Taxi squad visibility.
- Contract or salary-cap fields where applicable.
- Age curves and roster timeline.
- Contender/rebuild policies.

Full dynasty analytics may eventually merit its own roadmap.

### Additional Platforms and Manual Entry

- Fantrax and other providers.
- Manual league creation.
- CSV/JSON import.
- Generic read-only adapter SDK.

### Multi-User Hosting

- Invitations.
- Per-user provider connections.
- Account isolation.
- Roles and administration.
- Shared leagues or household views.

## Explicitly Deferred Features

The following are intentionally outside the initial roadmap:

### Full Live-Scoring Replacement

Existing platforms already solve this well. Live scoring also increases polling, caching, and provider-reliability demands without proving the cross-league wedge.

### Social Feed, Chat, and Community

These require network effects and moderation. They do not improve the initial single-user workflow.

### Custom League Hosting

Hosting drafts, scoring, waivers, and transactions would transform FantasyMaster into a platform competitor and multiply scope dramatically.

### Draft Room

A draft assistant may be valuable later, but it is seasonal and does not prove the weekly management loop.

### Fully Automated Transactions

No automatic lineup, waiver, trade, add, or drop execution. Revisit only after read-only reliability, platform permissions, auditability, and user trust are established.

### AI Chatbot as Primary Interface

An LLM may later explain or summarize computed results. It must not replace structured workflows, deterministic validations, or visible source data.

### Proprietary Projection Pipeline

Do not begin by competing with mature projection vendors. Start with public statistics, transparent heuristics, and optional imported rankings.

### Native Mobile Applications

Build a responsive web application first. Consider a PWA or native client only after mobile usage patterns justify the maintenance burden.

### Multi-Sport Support

NFL only until the product loop works. “Sport agnostic” should not become an excuse for abstracting away useful football concepts.
