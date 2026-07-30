import fixture from "@/../tests/fixtures/sleeper/account-import.json";
import { SleeperAdapter } from "@/modules/providers/sleeper/adapter";
import { describe, expect, it } from "vitest";

function fixtureFetch(input: string | URL | Request) {
  const path = new URL(String(input)).pathname;
  let payload: unknown;
  if (path === "/v1/user/fixture_manager") payload = fixture.user;
  else if (path === "/v1/user/user-100/leagues/nfl/2026")
    payload = fixture.leagues;
  else if (path === "/v1/state/nfl") payload = fixture.state;
  else if (path === "/v1/league/league-200") payload = fixture.leagues[0];
  else if (path === "/v1/league/league-200/users") payload = fixture.users;
  else if (path === "/v1/league/league-200/rosters") payload = fixture.rosters;
  else if (path === "/v1/league/league-200/matchups/3")
    payload = fixture.matchups;
  else if (path === "/v1/league/league-200/transactions/3")
    payload = fixture.transactions;
  else if (path === "/v1/players/nfl") payload = fixture.players;
  else return Promise.resolve(new Response(null, { status: 404 }));

  return Promise.resolve(Response.json(payload));
}

describe("Sleeper provider contract", () => {
  it("normalizes a sanitized account fixture without leaking Sleeper types", async () => {
    const adapter = new SleeperAdapter(fixtureFetch);
    const result = await adapter.importAccount("fixture_manager", 2026);

    expect(adapter.capabilities.writes).toBe(false);
    expect(result.account.externalId).toBe("user-100");
    expect(result.leagues).toHaveLength(1);
    expect(result.leagues[0]?.league.settings.scoringType).toBe("PPR");
    expect(result.leagues[0]?.teams[0]).toMatchObject({
      name: "Test Comets",
      isUserTeam: true,
    });
    expect(result.leagues[0]?.rosters[0]).toMatchObject({
      pointsFor: 321.45,
      starterExternalIds: ["player-qb", "player-rb"],
    });
    expect(result.leagues[0]?.matchups[0]?.entries).toHaveLength(2);
    expect(result.leagues[0]?.transactions[0]?.externalId).toBe(
      "transaction-300",
    );
    expect(result.leagues[0]?.players[0]?.externalIds).toMatchObject({
      ESPN: "espn-qb",
      YAHOO: "yahoo-qb",
    });
  });

  it("classifies provider schema drift at the adapter boundary", async () => {
    const adapter = new SleeperAdapter(() =>
      Promise.resolve(Response.json({ unexpected: true })),
    );

    await expect(
      adapter.lookupAccount("fixture_manager"),
    ).rejects.toMatchObject({
      category: "SCHEMA_CHANGED",
      retryable: false,
    });
  });
});
