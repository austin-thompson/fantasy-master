import {
  type FantasyProviderAdapter,
  type LeagueImportBundle,
  type NormalizedMatchup,
  type NormalizedPlayer,
  type ProviderCapabilities,
  type ProviderImport,
} from "@/modules/providers/contracts";
import { ProviderError } from "@/modules/providers/errors";
import {
  sleeperLeagueSchema,
  sleeperLeagueUsersSchema,
  sleeperLeaguesSchema,
  sleeperMatchupsSchema,
  sleeperPlayersSchema,
  sleeperRostersSchema,
  sleeperStateSchema,
  sleeperTransactionsSchema,
  sleeperUserSchema,
} from "@/modules/providers/sleeper/schemas";

const API_BASE_URL = "https://api.sleeper.app/v1";
const AVATAR_BASE_URL = "https://sleepercdn.com/avatars";

type FetchLike = typeof fetch;
type SleeperLeague = ReturnType<typeof sleeperLeagueSchema.parse>;

function avatarUrl(avatar: string | null | undefined) {
  return avatar ? `${AVATAR_BASE_URL}/${avatar}` : null;
}

function nullableNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function pointsFor(settings: {
  fpts?: number | null;
  fpts_decimal?: number | null;
}) {
  if (settings.fpts == null) return null;
  return settings.fpts + (settings.fpts_decimal ?? 0) / 100;
}

function scoringType(scoring: Readonly<Record<string, number>>) {
  const receptionPoints = scoring.rec ?? 0;
  if (receptionPoints >= 1) return "PPR";
  if (receptionPoints > 0) return "HALF_PPR";
  return "STANDARD";
}

function integerSetting(
  settings: Readonly<Record<string, unknown>>,
  key: string,
) {
  const value = settings[key];
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function booleanSetting(
  settings: Readonly<Record<string, unknown>>,
  key: string,
) {
  const value = settings[key];
  return typeof value === "number" ? value > 0 : null;
}

export class SleeperAdapter implements FantasyProviderAdapter {
  readonly provider = "SLEEPER" as const;
  readonly capabilities: ProviderCapabilities = {
    accountLookup: true,
    leagueDiscovery: true,
    leagueSettings: true,
    rosters: true,
    matchups: true,
    transactions: true,
    playerMetadata: true,
    writes: false,
  };

  private playersPromise: Promise<
    ReturnType<typeof sleeperPlayersSchema.parse>
  > | null = null;

  constructor(private readonly fetchImplementation: FetchLike = fetch) {}

  async lookupAccount(identifier: string) {
    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) {
      throw new ProviderError(
        "Sleeper username is required.",
        "INVALID_INPUT",
        false,
      );
    }

    const payload = await this.request(
      `/user/${encodeURIComponent(normalizedIdentifier)}`,
    );
    if (payload === null) {
      throw new ProviderError(
        "Sleeper account was not found.",
        "NOT_FOUND",
        false,
      );
    }
    const user = this.parse(sleeperUserSchema, payload, "Sleeper account");

    return {
      externalId: user.user_id,
      displayName: user.display_name,
      username: user.username,
      avatarUrl: avatarUrl(user.avatar),
    };
  }

  async discoverLeagues(externalAccountId: string, season: number) {
    const payload = await this.request(
      `/user/${encodeURIComponent(externalAccountId)}/leagues/nfl/${season}`,
    );
    const leagues = this.parse(
      sleeperLeaguesSchema,
      payload,
      "Sleeper league list",
    );

    return leagues.map((league) => ({
      externalId: league.league_id,
      name: league.name,
      sport: league.sport,
      season: Number(league.season),
      status: league.status,
    }));
  }

  async importAccount(
    identifier: string,
    season: number,
  ): Promise<ProviderImport> {
    const account = await this.lookupAccount(identifier);
    const leaguesPayload = await this.request(
      `/user/${encodeURIComponent(account.externalId)}/leagues/nfl/${season}`,
    );
    const leagues = this.parse(
      sleeperLeaguesSchema,
      leaguesPayload,
      "Sleeper league list",
    );
    const statePayload = await this.request("/state/nfl");
    const state = this.parse(
      sleeperStateSchema,
      statePayload,
      "Sleeper NFL state",
    );
    const requestedWeek =
      Number(state.season) === season ? Math.max(state.week, state.leg, 1) : 1;
    const playerIds = new Set<string>();

    const baseBundles = await Promise.all(
      leagues.map((league) =>
        this.importLeagueBase(
          account.externalId,
          league,
          requestedWeek,
          playerIds,
        ),
      ),
    );
    const players = await this.fetchPlayers(playerIds);

    return {
      account,
      leagues: baseBundles.map((bundle) => ({ ...bundle, players })),
      rawSnapshots: [
        {
          kind: "ACCOUNT",
          externalResourceId: account.externalId,
          payload: account,
        },
        {
          kind: "LEAGUES",
          externalResourceId: `${account.externalId}:${season}`,
          payload: leaguesPayload,
        },
      ],
      warnings: [],
    };
  }

  private async importLeagueBase(
    accountId: string,
    league: SleeperLeague,
    week: number,
    playerIds: Set<string>,
  ): Promise<Omit<LeagueImportBundle, "players">> {
    const [
      leaguePayload,
      usersPayload,
      rostersPayload,
      matchupsPayload,
      transactionsPayload,
    ] = await Promise.all([
      this.request(`/league/${league.league_id}`),
      this.request(`/league/${league.league_id}/users`),
      this.request(`/league/${league.league_id}/rosters`),
      this.request(`/league/${league.league_id}/matchups/${week}`),
      this.request(`/league/${league.league_id}/transactions/${week}`),
    ]);
    const currentLeague = this.parse(
      sleeperLeagueSchema,
      leaguePayload,
      "Sleeper league",
    );
    const users = this.parse(
      sleeperLeagueUsersSchema,
      usersPayload,
      "Sleeper league users",
    );
    const rosters = this.parse(
      sleeperRostersSchema,
      rostersPayload,
      "Sleeper rosters",
    );
    const matchupEntries = this.parse(
      sleeperMatchupsSchema,
      matchupsPayload,
      "Sleeper matchups",
    );
    const transactions = this.parse(
      sleeperTransactionsSchema,
      transactionsPayload,
      "Sleeper transactions",
    );
    const usersById = new Map(users.map((user) => [user.user_id, user]));

    for (const roster of rosters) {
      for (const playerId of roster.players ?? []) playerIds.add(playerId);
    }

    const matchups = new Map<string, NormalizedMatchup["entries"][number][]>();
    for (const entry of matchupEntries) {
      if (entry.matchup_id === null) continue;
      const key = String(entry.matchup_id);
      const entries = matchups.get(key) ?? [];
      entries.push({
        rosterExternalId: String(entry.roster_id),
        points: entry.points ?? null,
        customPoints: entry.custom_points ?? null,
        starterExternalIds: entry.starters ?? [],
        playerExternalIds: entry.players ?? [],
      });
      matchups.set(key, entries);
    }

    return {
      league: {
        externalId: currentLeague.league_id,
        name: currentLeague.name,
        sport: currentLeague.sport,
        season: Number(currentLeague.season),
        seasonType: currentLeague.season_type ?? null,
        status: currentLeague.status,
        totalRosters: currentLeague.total_rosters ?? null,
        avatarUrl: avatarUrl(currentLeague.avatar),
        settings: {
          scoringType: scoringType(currentLeague.scoring_settings),
          rosterPositions: currentLeague.roster_positions,
          scoringSettings: currentLeague.scoring_settings,
          providerSettings: currentLeague.settings,
          waiverType:
            typeof currentLeague.settings.waiver_type === "number"
              ? String(currentLeague.settings.waiver_type)
              : null,
          waiverBudget: integerSetting(currentLeague.settings, "waiver_budget"),
          playoffWeekStart: integerSetting(
            currentLeague.settings,
            "playoff_week_start",
          ),
          keeperOrDynasty: booleanSetting(currentLeague.settings, "type"),
          unsupportedFields: {},
        },
      },
      teams: rosters.map((roster) => {
        const owner = roster.owner_id
          ? usersById.get(roster.owner_id)
          : undefined;
        const metadata = owner?.metadata;
        const teamName =
          metadata && typeof metadata.team_name === "string"
            ? metadata.team_name
            : (owner?.display_name ??
              owner?.username ??
              `Roster ${roster.roster_id}`);
        return {
          externalId: String(roster.roster_id),
          externalOwnerId: roster.owner_id ?? null,
          name: teamName,
          avatarUrl: avatarUrl(owner?.avatar),
          isUserTeam: roster.owner_id === accountId,
        };
      }),
      rosters: rosters.map((roster) => ({
        externalId: String(roster.roster_id),
        teamExternalId: String(roster.roster_id),
        wins: nullableNumber(roster.settings.wins),
        losses: nullableNumber(roster.settings.losses),
        ties: nullableNumber(roster.settings.ties),
        pointsFor: pointsFor(roster.settings),
        waiverPosition: nullableNumber(roster.settings.waiver_position),
        waiverBudgetUsed: nullableNumber(roster.settings.waiver_budget_used),
        playerExternalIds: roster.players ?? [],
        starterExternalIds: roster.starters ?? [],
      })),
      matchups: [...matchups.entries()].map(([externalId, entries]) => ({
        externalId,
        week,
        status: "UNKNOWN",
        entries,
      })),
      transactions: transactions.map((transaction) => ({
        externalId: transaction.transaction_id,
        week: transaction.leg ?? week,
        type: transaction.type,
        status: transaction.status,
        occurredAt: transaction.created ? new Date(transaction.created) : null,
        rosterExternalIds: transaction.roster_ids.map(String),
        adds: transaction.adds ?? {},
        drops: transaction.drops ?? {},
        details: {
          settings: transaction.settings ?? null,
          metadata: transaction.metadata ?? null,
          draftPicks: transaction.draft_picks,
          waiverBudget: transaction.waiver_budget,
        },
      })),
      rawSnapshots: [
        {
          kind: "LEAGUE",
          externalResourceId: league.league_id,
          payload: leaguePayload,
        },
        {
          kind: "USERS",
          externalResourceId: league.league_id,
          payload: usersPayload,
        },
        {
          kind: "ROSTERS",
          externalResourceId: league.league_id,
          payload: rostersPayload,
        },
        {
          kind: "MATCHUPS",
          externalResourceId: `${league.league_id}:${week}`,
          payload: matchupsPayload,
        },
        {
          kind: "TRANSACTIONS",
          externalResourceId: `${league.league_id}:${week}`,
          payload: transactionsPayload,
        },
      ],
      warnings: [],
    };
  }

  private async fetchPlayers(playerIds: ReadonlySet<string>) {
    if (playerIds.size === 0) return [];
    this.playersPromise ??= this.request("/players/nfl").then((payload) =>
      this.parse(sleeperPlayersSchema, payload, "Sleeper players"),
    );
    const playerMap = await this.playersPromise;

    return [...playerIds].map((externalId): NormalizedPlayer => {
      const player = playerMap[externalId];
      const firstName = player?.first_name ?? null;
      const lastName = player?.last_name ?? null;
      const fullName =
        player?.full_name ??
        [firstName, lastName].filter(Boolean).join(" ") ??
        externalId;
      const externalIds: Record<string, string> = {};
      for (const [provider, value] of [
        ["ESPN", player?.espn_id],
        ["YAHOO", player?.yahoo_id],
      ] as const) {
        if (value !== null && value !== undefined && String(value)) {
          externalIds[provider] = String(value);
        }
      }

      return {
        externalId,
        firstName,
        lastName,
        fullName: fullName || externalId,
        position: player?.position ?? null,
        team: player?.team ?? null,
        status: player?.status ?? null,
        injuryStatus: player?.injury_status ?? null,
        externalIds,
        metadata: player ?? { unresolved: true },
      };
    });
  }

  private async request(path: string): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchImplementation(`${API_BASE_URL}${path}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      throw new ProviderError(
        "Sleeper could not be reached.",
        "TRANSIENT_NETWORK",
        true,
        { cause: error },
      );
    }

    if (response.status === 404) return null;
    if (response.status === 429) {
      throw new ProviderError(
        "Sleeper rate limit reached. Try again later.",
        "RATE_LIMIT",
        true,
      );
    }
    if (!response.ok) {
      throw new ProviderError(
        `Sleeper returned HTTP ${response.status}.`,
        response.status >= 500 ? "PROVIDER_UNAVAILABLE" : "INVALID_INPUT",
        response.status >= 500,
      );
    }
    return response.json();
  }

  private parse<T>(
    schema: {
      safeParse: (
        value: unknown,
      ) => { success: true; data: T } | { success: false; error: unknown };
    },
    payload: unknown,
    label: string,
  ): T {
    const result = schema.safeParse(payload);
    if (!result.success) {
      throw new ProviderError(
        `${label} response no longer matches the supported schema.`,
        "SCHEMA_CHANGED",
        false,
        { cause: result.error },
      );
    }
    return result.data;
  }
}
