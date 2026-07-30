import "server-only";

import { Prisma, type Provider } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type {
  FantasyProviderAdapter,
  LeagueImportBundle,
  ProviderImport,
} from "@/modules/providers/contracts";
import { ProviderError } from "@/modules/providers/errors";
import { SleeperAdapter } from "@/modules/providers/sleeper/adapter";

const RAW_SNAPSHOT_RETENTION = 3;
const STALE_RUNNING_SYNC_MS = 10 * 60 * 1000;

type AuthorizedSession = { user: { id: string } };

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function errorDetails(error: unknown) {
  if (error instanceof ProviderError) {
    return {
      category: error.category,
      retryable: error.retryable,
      message: error.message,
    };
  }
  return {
    category: "INTERNAL",
    retryable: false,
    message:
      error instanceof Error ? error.message : "Unknown synchronization error",
  };
}

export async function connectSleeperAccount(
  session: AuthorizedSession,
  input: { username: string; season: number },
) {
  const adapter = new SleeperAdapter();
  const account = await adapter.lookupAccount(input.username);
  const connection = await prisma.providerConnection.upsert({
    where: {
      userId_provider_externalAccountId: {
        userId: session.user.id,
        provider: "SLEEPER",
        externalAccountId: account.externalId,
      },
    },
    create: {
      userId: session.user.id,
      provider: "SLEEPER",
      externalAccountId: account.externalId,
      displayName: account.displayName,
      configuration: json({
        username: account.username,
        season: input.season,
        avatarUrl: account.avatarUrl,
      }),
    },
    update: {
      displayName: account.displayName,
      status: "ACTIVE",
      configuration: json({
        username: account.username,
        season: input.season,
        avatarUrl: account.avatarUrl,
      }),
    },
  });

  await synchronizeConnection(session, connection.id);
  return connection;
}

export async function synchronizeConnection(
  session: AuthorizedSession,
  connectionId: string,
  adapterOverride?: FantasyProviderAdapter,
) {
  const connection = await prisma.providerConnection.findFirst({
    where: { id: connectionId, userId: session.user.id },
  });
  if (!connection) throw new Error("Provider connection was not found.");

  const activeRun = await prisma.syncRun.findFirst({
    where: {
      providerConnectionId: connection.id,
      status: "RUNNING",
      startedAt: { gt: new Date(Date.now() - STALE_RUNNING_SYNC_MS) },
    },
  });
  if (activeRun) throw new Error("A synchronization is already running.");

  const run = await prisma.syncRun.create({
    data: {
      userId: session.user.id,
      providerConnectionId: connection.id,
      status: "RUNNING",
      importedCounts: json({}),
      warnings: json([]),
    },
  });
  await prisma.providerConnection.update({
    where: { id: connection.id },
    data: { lastAttemptedSyncAt: new Date() },
  });

  try {
    if (connection.provider !== "SLEEPER") {
      throw new Error(`Provider ${connection.provider} is not implemented.`);
    }
    const configuration = connection.configuration as {
      username?: unknown;
      season?: unknown;
    };
    if (
      typeof configuration.username !== "string" ||
      typeof configuration.season !== "number"
    ) {
      throw new Error("Sleeper connection configuration is invalid.");
    }

    const adapter = adapterOverride ?? new SleeperAdapter();
    const imported = await adapter.importAccount(
      configuration.username,
      configuration.season,
    );
    const counts = await persistImport(
      session.user.id,
      connection.id,
      run.id,
      connection.provider,
      imported,
    );

    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCEEDED",
        finishedAt: new Date(),
        importedCounts: json(counts),
        warnings: json([
          ...imported.warnings,
          ...imported.leagues.flatMap((league) => league.warnings),
        ]),
      },
    });
    await prisma.providerConnection.update({
      where: { id: connection.id },
      data: {
        status: "ACTIVE",
        displayName: imported.account.displayName,
        lastSuccessfulSyncAt: new Date(),
      },
    });
    await pruneRawSnapshots(connection.id);
    return { runId: run.id, counts };
  } catch (error) {
    const details = errorDetails(error);
    await prisma.$transaction([
      prisma.syncRun.update({
        where: { id: run.id },
        data: { status: "FAILED", finishedAt: new Date() },
      }),
      prisma.syncError.create({
        data: {
          userId: session.user.id,
          syncRunId: run.id,
          category: details.category,
          message: details.message,
          retryable: details.retryable,
          details: json({ provider: connection.provider }),
        },
      }),
      prisma.providerConnection.update({
        where: { id: connection.id },
        data: { status: "ERROR" },
      }),
    ]);
    logger.error(
      {
        connectionId: connection.id,
        syncRunId: run.id,
        category: details.category,
      },
      "Provider synchronization failed",
    );
    throw error;
  }
}

async function persistImport(
  userId: string,
  connectionId: string,
  syncRunId: string,
  provider: Provider,
  imported: ProviderImport,
) {
  const counts = {
    leagues: imported.leagues.length,
    teams: imported.leagues.reduce((sum, item) => sum + item.teams.length, 0),
    rosters: imported.leagues.reduce(
      (sum, item) => sum + item.rosters.length,
      0,
    ),
    players: new Set(
      imported.leagues.flatMap((item) =>
        item.players.map((player) => player.externalId),
      ),
    ).size,
    matchups: imported.leagues.reduce(
      (sum, item) => sum + item.matchups.length,
      0,
    ),
    transactions: imported.leagues.reduce(
      (sum, item) => sum + item.transactions.length,
      0,
    ),
  };

  await prisma.$transaction(async (transaction) => {
    for (const bundle of imported.leagues) {
      await persistLeague(
        transaction,
        userId,
        connectionId,
        syncRunId,
        provider,
        bundle,
      );
    }
    for (const snapshot of [
      ...imported.rawSnapshots,
      ...imported.leagues.flatMap((league) => league.rawSnapshots),
    ]) {
      await transaction.rawProviderSnapshot.create({
        data: {
          userId,
          providerConnectionId: connectionId,
          syncRunId,
          provider,
          kind: snapshot.kind,
          externalResourceId: snapshot.externalResourceId,
          payload: json(snapshot.payload),
        },
      });
    }
  });

  return counts;
}

async function persistLeague(
  transaction: Prisma.TransactionClient,
  userId: string,
  connectionId: string,
  syncRunId: string,
  provider: Provider,
  bundle: LeagueImportBundle,
) {
  const ingestedAt = new Date();
  const league = await transaction.league.upsert({
    where: {
      userId_provider_externalId: {
        userId,
        provider,
        externalId: bundle.league.externalId,
      },
    },
    create: {
      userId,
      providerConnectionId: connectionId,
      provider,
      externalId: bundle.league.externalId,
      name: bundle.league.name,
      sport: bundle.league.sport,
      season: bundle.league.season,
      seasonType: bundle.league.seasonType,
      status: bundle.league.status,
      totalRosters: bundle.league.totalRosters,
      avatarUrl: bundle.league.avatarUrl,
      ingestedAt,
      lastSuccessfulSyncId: syncRunId,
    },
    update: {
      providerConnectionId: connectionId,
      name: bundle.league.name,
      season: bundle.league.season,
      seasonType: bundle.league.seasonType,
      status: bundle.league.status,
      totalRosters: bundle.league.totalRosters,
      avatarUrl: bundle.league.avatarUrl,
      ingestedAt,
      lastSuccessfulSyncId: syncRunId,
    },
  });
  await transaction.leagueSettings.upsert({
    where: { leagueId: league.id },
    create: {
      leagueId: league.id,
      scoringType: bundle.league.settings.scoringType,
      rosterPositions: json(bundle.league.settings.rosterPositions),
      scoringSettings: json(bundle.league.settings.scoringSettings),
      providerSettings: json(bundle.league.settings.providerSettings),
      waiverType: bundle.league.settings.waiverType,
      waiverBudget: bundle.league.settings.waiverBudget,
      playoffWeekStart: bundle.league.settings.playoffWeekStart,
      keeperOrDynasty: bundle.league.settings.keeperOrDynasty,
      unsupportedFields: json(bundle.league.settings.unsupportedFields),
    },
    update: {
      scoringType: bundle.league.settings.scoringType,
      rosterPositions: json(bundle.league.settings.rosterPositions),
      scoringSettings: json(bundle.league.settings.scoringSettings),
      providerSettings: json(bundle.league.settings.providerSettings),
      waiverType: bundle.league.settings.waiverType,
      waiverBudget: bundle.league.settings.waiverBudget,
      playoffWeekStart: bundle.league.settings.playoffWeekStart,
      keeperOrDynasty: bundle.league.settings.keeperOrDynasty,
      unsupportedFields: json(bundle.league.settings.unsupportedFields),
    },
  });

  const playersByExternalId = new Map<string, string>();
  for (const player of bundle.players) {
    const existing = await transaction.playerExternalId.findUnique({
      where: {
        provider_externalId: { provider, externalId: player.externalId },
      },
    });
    const canonicalPlayer = existing
      ? await transaction.player.update({
          where: { id: existing.playerId },
          data: {
            firstName: player.firstName,
            lastName: player.lastName,
            fullName: player.fullName,
            position: player.position,
            team: player.team,
            status: player.status,
            injuryStatus: player.injuryStatus,
            metadata: json(player.metadata),
          },
        })
      : await transaction.player.create({
          data: {
            sport: "nfl",
            firstName: player.firstName,
            lastName: player.lastName,
            fullName: player.fullName,
            position: player.position,
            team: player.team,
            status: player.status,
            injuryStatus: player.injuryStatus,
            metadata: json(player.metadata),
            externalIds: {
              create: {
                provider,
                externalId: player.externalId,
              },
            },
          },
        });
    playersByExternalId.set(player.externalId, canonicalPlayer.id);
    for (const [externalProvider, externalId] of Object.entries(
      player.externalIds,
    )) {
      if (!["SLEEPER", "YAHOO", "ESPN"].includes(externalProvider)) continue;
      await transaction.playerExternalId.upsert({
        where: {
          provider_externalId: {
            provider: externalProvider as Provider,
            externalId,
          },
        },
        create: {
          playerId: canonicalPlayer.id,
          provider: externalProvider as Provider,
          externalId,
        },
        update: {},
      });
    }
  }

  const teamsByExternalId = new Map<string, string>();
  for (const team of bundle.teams) {
    const canonicalTeam = await transaction.fantasyTeam.upsert({
      where: {
        leagueId_externalId: {
          leagueId: league.id,
          externalId: team.externalId,
        },
      },
      create: {
        userId,
        leagueId: league.id,
        provider,
        externalId: team.externalId,
        externalOwnerId: team.externalOwnerId,
        name: team.name,
        avatarUrl: team.avatarUrl,
        isUserTeam: team.isUserTeam,
        ingestedAt,
        lastSuccessfulSyncId: syncRunId,
      },
      update: {
        externalOwnerId: team.externalOwnerId,
        name: team.name,
        avatarUrl: team.avatarUrl,
        isUserTeam: team.isUserTeam,
        ingestedAt,
        lastSuccessfulSyncId: syncRunId,
      },
    });
    teamsByExternalId.set(team.externalId, canonicalTeam.id);
  }

  const rostersByExternalId = new Map<string, string>();
  for (const roster of bundle.rosters) {
    const fantasyTeamId = teamsByExternalId.get(roster.teamExternalId);
    if (!fantasyTeamId) throw new Error("Roster references an unknown team.");
    const canonicalRoster = await transaction.roster.upsert({
      where: {
        leagueId_externalId: {
          leagueId: league.id,
          externalId: roster.externalId,
        },
      },
      create: {
        userId,
        leagueId: league.id,
        fantasyTeamId,
        provider,
        externalId: roster.externalId,
        wins: roster.wins,
        losses: roster.losses,
        ties: roster.ties,
        pointsFor: roster.pointsFor,
        waiverPosition: roster.waiverPosition,
        waiverBudgetUsed: roster.waiverBudgetUsed,
        ingestedAt,
        lastSuccessfulSyncId: syncRunId,
      },
      update: {
        fantasyTeamId,
        wins: roster.wins,
        losses: roster.losses,
        ties: roster.ties,
        pointsFor: roster.pointsFor,
        waiverPosition: roster.waiverPosition,
        waiverBudgetUsed: roster.waiverBudgetUsed,
        ingestedAt,
        lastSuccessfulSyncId: syncRunId,
      },
    });
    rostersByExternalId.set(roster.externalId, canonicalRoster.id);
    await transaction.rosterSlot.deleteMany({
      where: { rosterId: canonicalRoster.id },
    });
    const starters = new Set(roster.starterExternalIds);
    const rosterPositions = bundle.league.settings.rosterPositions;
    const slotRows = roster.playerExternalIds.flatMap((externalId, index) => {
      const playerId = playersByExternalId.get(externalId);
      if (!playerId) return [];
      const starterIndex = roster.starterExternalIds.indexOf(externalId);
      return [
        {
          rosterId: canonicalRoster.id,
          playerId,
          slotType:
            starterIndex >= 0
              ? (rosterPositions[starterIndex] ?? "STARTER")
              : "BENCH",
          slotIndex: starterIndex >= 0 ? starterIndex : index,
          isStarter: starters.has(externalId),
        },
      ];
    });
    if (slotRows.length) {
      await transaction.rosterSlot.createMany({ data: slotRows });
    }
  }

  for (const matchup of bundle.matchups) {
    const canonicalMatchup = await transaction.matchup.upsert({
      where: {
        leagueId_week_externalId: {
          leagueId: league.id,
          week: matchup.week,
          externalId: matchup.externalId,
        },
      },
      create: {
        userId,
        leagueId: league.id,
        provider,
        externalId: matchup.externalId,
        week: matchup.week,
        status: matchup.status,
        ingestedAt,
        lastSuccessfulSyncId: syncRunId,
      },
      update: {
        status: matchup.status,
        ingestedAt,
        lastSuccessfulSyncId: syncRunId,
      },
    });
    await transaction.matchupEntry.deleteMany({
      where: { matchupId: canonicalMatchup.id },
    });
    for (const entry of matchup.entries) {
      const rosterId = rostersByExternalId.get(entry.rosterExternalId);
      if (!rosterId) continue;
      await transaction.matchupEntry.create({
        data: {
          matchupId: canonicalMatchup.id,
          rosterId,
          points: entry.points,
          customPoints: entry.customPoints,
          starters: json(entry.starterExternalIds),
          players: json(entry.playerExternalIds),
        },
      });
    }
  }

  for (const item of bundle.transactions) {
    const canonicalTransaction = await transaction.fantasyTransaction.upsert({
      where: {
        leagueId_externalId: {
          leagueId: league.id,
          externalId: item.externalId,
        },
      },
      create: {
        leagueId: league.id,
        provider,
        externalId: item.externalId,
        week: item.week,
        type: item.type,
        status: item.status,
        occurredAt: item.occurredAt,
        adds: json(item.adds),
        drops: json(item.drops),
        details: json(item.details),
        ingestedAt,
        lastSuccessfulSyncId: syncRunId,
      },
      update: {
        week: item.week,
        type: item.type,
        status: item.status,
        occurredAt: item.occurredAt,
        adds: json(item.adds),
        drops: json(item.drops),
        details: json(item.details),
        ingestedAt,
        lastSuccessfulSyncId: syncRunId,
      },
    });
    await transaction.fantasyTransactionRoster.deleteMany({
      where: { transactionId: canonicalTransaction.id },
    });
    const rosterIds = item.rosterExternalIds.flatMap((externalId) => {
      const rosterId = rostersByExternalId.get(externalId);
      return rosterId ? [rosterId] : [];
    });
    if (rosterIds.length) {
      await transaction.fantasyTransactionRoster.createMany({
        data: rosterIds.map((rosterId) => ({
          transactionId: canonicalTransaction.id,
          rosterId,
        })),
      });
    }
  }
}

async function pruneRawSnapshots(connectionId: string) {
  const groups = await prisma.rawProviderSnapshot.groupBy({
    by: ["kind", "externalResourceId"],
    where: { providerConnectionId: connectionId },
  });
  for (const group of groups) {
    const retained = await prisma.rawProviderSnapshot.findMany({
      where: {
        providerConnectionId: connectionId,
        kind: group.kind,
        externalResourceId: group.externalResourceId,
      },
      orderBy: { capturedAt: "desc" },
      take: RAW_SNAPSHOT_RETENTION,
      select: { id: true },
    });
    await prisma.rawProviderSnapshot.deleteMany({
      where: {
        providerConnectionId: connectionId,
        kind: group.kind,
        externalResourceId: group.externalResourceId,
        id: { notIn: retained.map((snapshot) => snapshot.id) },
      },
    });
  }
}
