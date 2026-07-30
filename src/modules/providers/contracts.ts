export const providerNames = ["SLEEPER", "YAHOO", "ESPN"] as const;

export type ProviderName = (typeof providerNames)[number];

export interface ProviderCapabilities {
  readonly accountLookup: boolean;
  readonly leagueDiscovery: boolean;
  readonly leagueSettings: boolean;
  readonly rosters: boolean;
  readonly matchups: boolean;
  readonly transactions: boolean;
  readonly playerMetadata: boolean;
  readonly writes: false;
}

export interface ProviderAccount {
  readonly externalId: string;
  readonly displayName: string;
  readonly username: string;
  readonly avatarUrl: string | null;
}

export interface ExternalLeagueSummary {
  readonly externalId: string;
  readonly name: string;
  readonly sport: "nfl";
  readonly season: number;
  readonly status: string;
}

export interface NormalizedLeague {
  readonly externalId: string;
  readonly name: string;
  readonly sport: "nfl";
  readonly season: number;
  readonly seasonType: string | null;
  readonly status: string;
  readonly totalRosters: number | null;
  readonly avatarUrl: string | null;
  readonly settings: {
    readonly scoringType: string;
    readonly rosterPositions: readonly string[];
    readonly scoringSettings: Readonly<Record<string, number>>;
    readonly providerSettings: Readonly<Record<string, unknown>>;
    readonly waiverType: string | null;
    readonly waiverBudget: number | null;
    readonly playoffWeekStart: number | null;
    readonly keeperOrDynasty: boolean | null;
    readonly unsupportedFields: Readonly<Record<string, unknown>>;
  };
}

export interface NormalizedTeam {
  readonly externalId: string;
  readonly externalOwnerId: string | null;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly isUserTeam: boolean;
}

export interface NormalizedRoster {
  readonly externalId: string;
  readonly teamExternalId: string;
  readonly wins: number | null;
  readonly losses: number | null;
  readonly ties: number | null;
  readonly pointsFor: number | null;
  readonly waiverPosition: number | null;
  readonly waiverBudgetUsed: number | null;
  readonly playerExternalIds: readonly string[];
  readonly starterExternalIds: readonly string[];
}

export interface NormalizedMatchupEntry {
  readonly rosterExternalId: string;
  readonly points: number | null;
  readonly customPoints: number | null;
  readonly starterExternalIds: readonly string[];
  readonly playerExternalIds: readonly string[];
}

export interface NormalizedMatchup {
  readonly externalId: string;
  readonly week: number;
  readonly status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETE" | "UNKNOWN";
  readonly entries: readonly NormalizedMatchupEntry[];
}

export interface NormalizedTransaction {
  readonly externalId: string;
  readonly week: number;
  readonly type: string;
  readonly status: string;
  readonly occurredAt: Date | null;
  readonly rosterExternalIds: readonly string[];
  readonly adds: Readonly<Record<string, number>>;
  readonly drops: Readonly<Record<string, number>>;
  readonly details: Readonly<Record<string, unknown>>;
}

export interface NormalizedPlayer {
  readonly externalId: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly fullName: string;
  readonly position: string | null;
  readonly team: string | null;
  readonly status: string | null;
  readonly injuryStatus: string | null;
  readonly externalIds: Readonly<Record<string, string>>;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface RawProviderSnapshotInput {
  readonly kind:
    | "ACCOUNT"
    | "LEAGUES"
    | "LEAGUE"
    | "USERS"
    | "ROSTERS"
    | "MATCHUPS"
    | "TRANSACTIONS"
    | "PLAYERS";
  readonly externalResourceId: string;
  readonly payload: unknown;
}

export interface LeagueImportBundle {
  readonly league: NormalizedLeague;
  readonly teams: readonly NormalizedTeam[];
  readonly rosters: readonly NormalizedRoster[];
  readonly matchups: readonly NormalizedMatchup[];
  readonly transactions: readonly NormalizedTransaction[];
  readonly players: readonly NormalizedPlayer[];
  readonly rawSnapshots: readonly RawProviderSnapshotInput[];
  readonly warnings: readonly string[];
}

export interface ProviderImport {
  readonly account: ProviderAccount;
  readonly leagues: readonly LeagueImportBundle[];
  readonly rawSnapshots: readonly RawProviderSnapshotInput[];
  readonly warnings: readonly string[];
}

export interface FantasyProviderAdapter {
  readonly provider: ProviderName;
  readonly capabilities: ProviderCapabilities;

  lookupAccount(identifier: string): Promise<ProviderAccount>;
  discoverLeagues(
    externalAccountId: string,
    season: number,
  ): Promise<readonly ExternalLeagueSummary[]>;
  importAccount(identifier: string, season: number): Promise<ProviderImport>;
}
