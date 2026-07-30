import { z } from "zod";

const nullableString = z.string().nullable().optional();
const numberMap = z.record(z.string(), z.number());
const unknownMap = z.record(z.string(), z.unknown());

export const sleeperUserSchema = z.object({
  user_id: z.string(),
  username: z.string(),
  display_name: z.string(),
  avatar: nullableString,
});

export const sleeperStateSchema = z.object({
  week: z.number().int().nonnegative(),
  leg: z.number().int().nonnegative(),
  season: z.string(),
  league_season: z.string(),
});

export const sleeperLeagueSchema = z.object({
  league_id: z.string(),
  name: z.string(),
  sport: z.literal("nfl"),
  season: z.string(),
  season_type: nullableString,
  status: z.string(),
  total_rosters: z.number().int().nullable().optional(),
  avatar: nullableString,
  roster_positions: z.array(z.string()).default([]),
  scoring_settings: numberMap.default({}),
  settings: unknownMap.default({}),
});

export const sleeperLeaguesSchema = z.array(sleeperLeagueSchema);

export const sleeperLeagueUserSchema = z.object({
  user_id: z.string(),
  username: nullableString,
  display_name: nullableString,
  avatar: nullableString,
  metadata: unknownMap.nullable().optional(),
});

export const sleeperLeagueUsersSchema = z.array(sleeperLeagueUserSchema);

export const sleeperRosterSchema = z.object({
  roster_id: z.number().int(),
  owner_id: nullableString,
  players: z.array(z.string()).nullable().default([]),
  starters: z.array(z.string()).nullable().default([]),
  reserve: z.array(z.string()).nullable().optional(),
  settings: z
    .object({
      wins: z.number().int().nullable().optional(),
      losses: z.number().int().nullable().optional(),
      ties: z.number().int().nullable().optional(),
      fpts: z.number().nullable().optional(),
      fpts_decimal: z.number().nullable().optional(),
      waiver_position: z.number().int().nullable().optional(),
      waiver_budget_used: z.number().int().nullable().optional(),
    })
    .passthrough()
    .default({}),
});

export const sleeperRostersSchema = z.array(sleeperRosterSchema);

export const sleeperMatchupEntrySchema = z.object({
  roster_id: z.number().int(),
  matchup_id: z.number().int().nullable(),
  points: z.number().nullable().optional(),
  custom_points: z.number().nullable().optional(),
  players: z.array(z.string()).nullable().default([]),
  starters: z.array(z.string()).nullable().default([]),
});

export const sleeperMatchupsSchema = z.array(sleeperMatchupEntrySchema);

export const sleeperTransactionSchema = z.object({
  transaction_id: z.string(),
  type: z.string(),
  status: z.string(),
  leg: z.number().int().nullable().optional(),
  roster_ids: z.array(z.number().int()).default([]),
  adds: z.record(z.string(), z.number().int()).nullable().default({}),
  drops: z.record(z.string(), z.number().int()).nullable().default({}),
  created: z.number().nullable().optional(),
  status_updated: z.number().nullable().optional(),
  settings: unknownMap.nullable().optional(),
  metadata: unknownMap.nullable().optional(),
  draft_picks: z.array(z.unknown()).default([]),
  waiver_budget: z.array(z.unknown()).default([]),
});

export const sleeperTransactionsSchema = z.array(sleeperTransactionSchema);

export const sleeperPlayerSchema = z
  .object({
    player_id: z.string().optional(),
    first_name: nullableString,
    last_name: nullableString,
    full_name: nullableString,
    position: nullableString,
    team: nullableString,
    status: nullableString,
    injury_status: nullableString,
    fantasy_positions: z.array(z.string()).nullable().optional(),
    espn_id: z.union([z.string(), z.number()]).nullable().optional(),
    yahoo_id: z.union([z.string(), z.number()]).nullable().optional(),
    fantasy_data_id: z.union([z.string(), z.number()]).nullable().optional(),
    sportradar_id: nullableString,
    stats_id: nullableString,
  })
  .passthrough();

export const sleeperPlayersSchema = z.record(z.string(), sleeperPlayerSchema);
