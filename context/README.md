# FantasyMaster Governing Context

This directory contains the authoritative product and engineering
specifications for FantasyMaster. They define what the project is building, the
order in which it should be built, and the boundaries implementations must
preserve.

## Implementation Status

Phase 0B implementation was completed on 2026-07-28. The project now has pnpm,
Next.js, Prisma, PostgreSQL, Docker Compose, health-check, test, and CI
workflows. Docker startup and persistent-volume verification remain pending on
a Docker-capable host. Phase 1 authentication and user ownership have not
started.

See the [root README](../README.md) for prerequisites, setup, commands,
environment configuration, migrations, Docker Compose, and testing.

## Recommended Reading Order

1. [CONTEXT.md](CONTEXT.md) — product thesis, chosen technology stack, MVP
   scope, product principles, and explicit non-goals.
2. [FEATURES.md](FEATURES.md) — feature definitions, priorities, acceptance
   boundaries, and deferred capabilities.
3. [ROADMAP.md](ROADMAP.md) — implementation phases, sequencing, exit criteria,
   release gates, and technical-debt guardrails.
4. [ARCHITECTURE.md](ARCHITECTURE.md) — repository organization, domain model,
   module boundaries, data ownership, synchronization, security, testing, and
   scaling strategy.
5. [INTEGRATIONS.md](INTEGRATIONS.md) — provider behavior and constraints,
   normalization rules, public NFL statistics, and future write-integration
   boundaries.

## Document Precedence

If documents appear to conflict:

1. `CONTEXT.md` controls product scope and technology choices.
2. `FEATURES.md` controls feature priority.
3. `ROADMAP.md` controls implementation order.
4. `ARCHITECTURE.md` controls internal design.
5. `INTEGRATIONS.md` controls provider-specific behavior.

Material contradictions should be documented rather than silently resolved. Use
the least complex interpretation consistent with the product thesis until an
intentional decision is made.

## Maintaining These Documents

Documentation is part of implementation. When a phase changes behavior,
constraints, setup, commands, or provider support, update the relevant
specification and the root README without rewriting historical intent. Record
material architectural deviations as decision records under `decisions/`, and
add new documents to this index.

Implementation shortcuts must not rewrite governing product decisions merely to
match the code. Deferred features must not enter the MVP through scope creep;
moving one into active scope requires an explicit, documented decision.

## Unresolved Questions

The governing documents identify several questions to resolve through focused
spikes or real usage:

- Which cross-league view should be the habitual home screen: the action inbox,
  league grid, or player exposure?
- How useful can transparent recommendation logic be without proprietary
  projections?
- Should synchronization remain deliberate and manual or become scheduled after
  provider behavior is understood?
- Which ESPN access or import method is sufficiently secure, reliable, and
  maintainable for a supported release?
- Should light dynasty support remain part of the general product or become a
  distinct mode?
- Which events justify external notifications rather than in-app alerts?
- Which public injury/status sources have acceptable licensing and reliability?
- What backup and restore procedure should be adopted before the first stable
  release?
