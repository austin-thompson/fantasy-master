import { randomUUID } from "node:crypto";

import type {
  FantasyProviderAdapter,
  ProviderImport,
} from "@/modules/providers/contracts";
import { ProviderError } from "@/modules/providers/errors";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const userId = randomUUID();
const connectionId = randomUUID();
const session = { user: { id: userId } };

const imported: ProviderImport = {
  account: {
    externalId: "fixture-account",
    displayName: "Fixture Manager",
    username: "fixture_manager",
    avatarUrl: null,
  },
  rawSnapshots: [
    {
      kind: "LEAGUES",
      externalResourceId: "fixture-account:2026",
      payload: [{ league_id: "fixture-league" }],
    },
  ],
  warnings: [],
  leagues: [
    {
      league: {
        externalId: "fixture-league",
        name: "Integration League",
        sport: "nfl",
        season: 2026,
        seasonType: "regular",
        status: "in_season",
        totalRosters: 1,
        avatarUrl: null,
        settings: {
          scoringType: "PPR",
          rosterPositions: ["QB", "BN"],
          scoringSettings: { rec: 1 },
          providerSettings: {},
          waiverType: null,
          waiverBudget: null,
          playoffWeekStart: null,
          keeperOrDynasty: null,
          unsupportedFields: {},
        },
      },
      teams: [
        {
          externalId: "1",
          externalOwnerId: "fixture-account",
          name: "Integration Team",
          avatarUrl: null,
          isUserTeam: true,
        },
      ],
      rosters: [
        {
          externalId: "1",
          teamExternalId: "1",
          wins: 1,
          losses: 0,
          ties: 0,
          pointsFor: 101.5,
          waiverPosition: 2,
          waiverBudgetUsed: 0,
          playerExternalIds: ["fixture-player"],
          starterExternalIds: ["fixture-player"],
        },
      ],
      players: [
        {
          externalId: "fixture-player",
          firstName: "Fixture",
          lastName: "Player",
          fullName: "Fixture Player",
          position: "QB",
          team: "TST",
          status: "Active",
          injuryStatus: null,
          externalIds: {},
          metadata: {},
        },
      ],
      matchups: [
        {
          externalId: "1",
          week: 1,
          status: "UNKNOWN",
          entries: [
            {
              rosterExternalId: "1",
              points: 20,
              customPoints: null,
              starterExternalIds: ["fixture-player"],
              playerExternalIds: ["fixture-player"],
            },
          ],
        },
      ],
      transactions: [],
      rawSnapshots: [
        {
          kind: "ROSTERS",
          externalResourceId: "fixture-league",
          payload: [{ roster_id: 1 }],
        },
      ],
      warnings: [],
    },
  ],
};

const successfulAdapter: FantasyProviderAdapter = {
  provider: "SLEEPER",
  capabilities: {
    accountLookup: true,
    leagueDiscovery: true,
    leagueSettings: true,
    rosters: true,
    matchups: true,
    transactions: true,
    playerMetadata: true,
    writes: false,
  },
  lookupAccount: async () => imported.account,
  discoverLeagues: async () => [
    {
      externalId: "fixture-league",
      name: "Integration League",
      sport: "nfl",
      season: 2026,
      status: "in_season",
    },
  ],
  importAccount: async () => imported,
};

describe.sequential("Sleeper canonical synchronization", () => {
  let prisma: typeof import("@/lib/db").prisma;
  let synchronizeConnection: typeof import("@/modules/sync/service").synchronizeConnection;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL?.includes("_test")) {
      throw new Error(
        "Integration tests require a dedicated database whose name contains '_test'.",
      );
    }
    ({ prisma } = await import("@/lib/db"));
    ({ synchronizeConnection } = await import("@/modules/sync/service"));

    await prisma.user.create({
      data: {
        id: userId,
        name: "sync-owner",
        email: `${userId}@local.fantasymaster.invalid`,
      },
    });
    await prisma.providerConnection.create({
      data: {
        id: connectionId,
        userId,
        provider: "SLEEPER",
        externalAccountId: "fixture-account",
        displayName: "Fixture Manager",
        configuration: { username: "fixture_manager", season: 2026 },
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user
        .delete({ where: { id: userId } })
        .catch(() => undefined);
      await prisma.$disconnect();
    }
  });

  it("upserts repeated imports idempotently and bounds raw snapshots", async () => {
    for (let index = 0; index < 4; index += 1) {
      await synchronizeConnection(session, connectionId, successfulAdapter);
    }

    expect(await prisma.league.count({ where: { userId } })).toBe(1);
    expect(await prisma.fantasyTeam.count({ where: { userId } })).toBe(1);
    expect(await prisma.roster.count({ where: { userId } })).toBe(1);
    expect(await prisma.matchup.count({ where: { userId } })).toBe(1);
    expect(
      await prisma.rawProviderSnapshot.count({
        where: { providerConnectionId: connectionId },
      }),
    ).toBe(6);
  });

  it("records a failed run without erasing the last valid canonical state", async () => {
    const failingAdapter: FantasyProviderAdapter = {
      ...successfulAdapter,
      importAccount: async () => {
        throw new ProviderError(
          "Fixture provider unavailable.",
          "PROVIDER_UNAVAILABLE",
          true,
        );
      },
    };

    await expect(
      synchronizeConnection(session, connectionId, failingAdapter),
    ).rejects.toThrow("Fixture provider unavailable.");

    expect(await prisma.league.count({ where: { userId } })).toBe(1);
    expect(
      await prisma.syncRun.count({
        where: { providerConnectionId: connectionId, status: "FAILED" },
      }),
    ).toBe(1);
    expect(
      await prisma.syncError.findFirst({
        where: { userId, category: "PROVIDER_UNAVAILABLE" },
      }),
    ).toMatchObject({ retryable: true });
  });
});
