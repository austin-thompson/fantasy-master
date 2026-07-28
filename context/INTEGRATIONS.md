# FantasyMaster Integrations

## Integration Principles

- Source platforms remain authoritative.
- MVP access is read-only.
- Every provider is isolated behind an adapter.
- Provider capabilities are explicit rather than assumed.
- Imported data includes freshness and provenance.
- One provider failure must not block others.
- Undocumented or fragile access paths must be labeled and tested accordingly.

## Implementation Order

1. Sleeper — reference adapter and first complete vertical slice.
2. Yahoo — official API with OAuth complexity.
3. ESPN — targeted for MVP, but gated by an early reliability and access spike.

The MVP target includes all three. The sequence reflects implementation risk, not product importance.

## Capability Matrix

| Capability | Sleeper | Yahoo | ESPN | FantasyMaster MVP Behavior |
|---|---|---|---|---|
| User/account lookup | Public identifier lookup | OAuth identity and fantasy resources | Depends on available access path | Provider-specific connection flow |
| League discovery | Supported by read-only API | Supported by official Fantasy Sports API | Requires adapter spike | Normalize into `League` |
| League settings | Supported | Supported | Expected through fantasy endpoints | Preserve unsupported fields as unknown |
| Rosters | Supported | Supported | Expected | Normalize roster slots and players |
| Matchups | Supported | Supported | Expected | Normalize current week and scoring |
| Transactions | Available for relevant endpoints | API-dependent resource support | Endpoint-dependent | Import only where reliable |
| Free agents/availability | Derivable with league and roster data | API-dependent | Endpoint-dependent | Show unknown when not reliable |
| Write transactions | Not supported by official Sleeper API | Potential API capabilities require separate investigation | Not part of initial access model | Deferred across all providers |
| Authentication | No API token for official read API | OAuth | Potentially cookies/session data for private leagues | Keep secrets server-side |
| Stability risk | Lowest | Moderate | Highest | Independent adapter health and warnings |

## Sleeper

### Current Position

Sleeper provides a documented, free, read-only HTTP API. It does not require an API token for supported reads. This makes it the cleanest provider for establishing the canonical model and sync pipeline.

### Connection Model

- User enters Sleeper username.
- Adapter resolves the Sleeper user ID.
- Application discovers NFL leagues for the selected season.
- No password or Sleeper session cookie should be requested for MVP.

### Initial Data

- User profile and external ID.
- NFL leagues by season.
- League settings and roster configuration.
- League users and teams.
- Rosters.
- Matchups.
- Transactions needed by product features.
- Player metadata as a supporting identity source.

### Risks

- Rate limits and undocumented behavioral changes.
- Large player metadata payloads.
- Platform terminology that does not map one-to-one with Yahoo or ESPN.

### Required Controls

- Cache stable metadata.
- Stay below published request guidance.
- Record adapter fixture versions.
- Never treat Sleeper’s schema as the canonical domain schema.

## Yahoo Fantasy Sports

### Current Position

Yahoo offers an official Fantasy Sports API exposing fantasy games, leagues, teams, players, and matchups. Access requires Yahoo developer registration and OAuth.

### Connection Model

- Operator configures Yahoo client ID and secret.
- User authorizes FantasyMaster through Yahoo OAuth.
- Access and refresh tokens remain server-side.
- Adapter refreshes tokens and exposes reconnect state when authorization fails.

### Initial Data

- Authenticated user fantasy games and NFL leagues.
- League settings and scoring.
- Teams and rosters.
- Matchups and standings.
- Players and status data available through the API.
- Waiver/transaction information where reliable and needed.

### Risks

- OAuth setup is more operationally complex for a self-hosted app.
- Yahoo’s resource model and response formatting may be verbose.
- Rate limits and permissions must be verified during implementation.
- Self-hosted redirect URL configuration may confuse operators.

### Required Controls

- Provide exact local redirect URI instructions.
- Encrypt refresh tokens at rest.
- Test token refresh and revocation paths.
- Hide Yahoo response formatting inside the adapter.
- Maintain sanitized XML/JSON fixtures as appropriate.

## ESPN Fantasy Football

### Current Position

ESPN does not provide a comparably documented public fantasy API for third-party applications. Community clients use ESPN’s fantasy endpoints, and private league access commonly depends on ESPN session information. This is the largest integration risk in the initial plan.

### Required Discovery Spike

Before committing to the final adapter flow, verify:

- Public league access behavior.
- Private league requirements.
- Required cookies or session identifiers.
- Endpoint stability and response versioning.
- Whether browser-assisted local import is feasible.
- Whether manual export/import is a safer fallback.
- Terms and security implications of storing ESPN session material.

### Candidate Connection Modes

Ordered from preferable to least preferable:

1. Read-only access using stable public league identifiers.
2. User-supplied locally stored session values for private leagues, with explicit warnings.
3. Browser-assisted import that transfers only required session material to the local server.
4. User-provided file export/manual import.

### Risks

- Undocumented endpoint changes.
- Session-cookie expiration.
- Higher security sensitivity.
- Potential mismatch between supported public and private leagues.
- No guarantee that future write integration will be available or appropriate.

### Required Controls

- Mark the adapter experimental until proven stable across a season.
- Store any session material encrypted and server-side only.
- Never request the user’s ESPN password directly.
- Version parsing logic and fixtures.
- Fail independently and retain the last valid import.
- Provide a fallback import path if live access becomes unreliable.

## Manual Entry and Import — Later

Manual support should not imitate every provider field. It should target the canonical minimum needed for useful analysis:

- League name and scoring type.
- Roster positions and lineup slots.
- User team and roster.
- Opponent roster when matchup analysis is desired.
- Current week and deadlines.

Potential formats:

- Guided form entry.
- CSV templates.
- JSON import using a published schema.
- Browser extension or bookmarklet only if direct exports are impossible and the maintenance cost is justified.

## Public NFL Statistics

### Initial Source Strategy

Use publicly available NFL datasets through a statistics-provider module. nflverse is a strong initial candidate because its project publishes NFL data in common formats usable outside R, including CSV and Parquet releases.

Potential data classes:

- Player identity mappings.
- Schedules and game times.
- Weekly and seasonal player statistics.
- Rosters and teams.
- Play-by-play-derived metrics.
- Injuries or depth charts only when licensing and reliability are acceptable.

### Rules

- Review dataset licenses before distribution or hosted commercialization.
- Persist source name, release/version, and import timestamp.
- Do not scrape paid projection sites.
- Do not claim public historical statistics are equivalent to high-quality forward projections.
- Begin with transparent heuristics and simple models.
- Permit optional user-imported rankings later.

## Normalization Rules

### IDs

- Preserve every provider external ID.
- Map to a canonical `Player` through `PlayerExternalId` records.
- Use trusted ID mapping datasets where possible.
- Names are supporting evidence, never the sole identity key.

### League Settings

Normalize common concepts:

- Scoring type.
- Passing/rushing/receiving scoring.
- Bonuses and penalties.
- Roster slots.
- Bench and injured-reserve slots.
- Waiver type and budget.
- Playoff weeks.
- Keeper/dynasty indicators.

Retain provider-specific settings in a namespaced field when no canonical equivalent exists.

### Status and Availability

Use explicit states:

- `AVAILABLE`
- `ROSTERED`
- `WAIVERS`
- `LOCKED`
- `UNSUPPORTED`
- `UNKNOWN`

Do not collapse unavailable API data into `AVAILABLE`.

### Freshness

Every provider-derived view must have enough metadata to answer:

- When did FantasyMaster fetch this?
- When did the provider say it changed, if known?
- Did the last sync succeed fully or partially?
- Is this result safe to use for a deadline-sensitive action?

## Future Write Integrations

Read and write capabilities must remain separate.

A future write integration requires:

- Official or sufficiently stable platform support.
- Explicit user authorization.
- Preview of the exact transaction.
- Idempotency protection.
- Audit log.
- Confirmation of provider response.
- Reconciliation on the next read sync.
- Clear partial-failure behavior.
- A kill switch per provider.

Potential write actions:

- Set lineup.
- Move player to or from IR.
- Add/drop player.
- Submit and reorder waiver claims.
- Accept, reject, or counter trades.

These are not MVP commitments. Read-only reliability earns the right to consider them.

## Integration Definition of Done

A provider adapter is complete only when:

- Connection and reauthorization flows are documented.
- League discovery works for supported league types.
- Core data normalizes without UI-specific provider branches.
- Sync is idempotent.
- Stale and partial states are visible.
- Sensitive tokens are protected.
- Recorded fixtures cover normal and failure cases.
- Provider failure cannot damage another provider’s data.
- Unsupported capabilities return explicit states.
- The adapter has survived representative real-league testing.

## References

- Sleeper API: https://docs.sleeper.com/
- Yahoo Fantasy Sports developer portal: https://sports.yahoo.com/developer/
- Yahoo API overview: https://developer.yahoo.com/api/
- nflverse data organization: https://github.com/nflverse
