import type { Metadata } from "next";
import Link from "next/link";

import { SyncButton } from "@/components/providers/sync-button";
import { requireSession } from "@/modules/auth/session";
import { getLeagueDetail } from "@/modules/leagues/queries";

export const metadata: Metadata = { title: "League detail" };
export const dynamic = "force-dynamic";

export default async function LeagueDetailPage({
  params,
}: {
  readonly params: Promise<{ leagueId: string }>;
}) {
  const session = await requireSession();
  const { leagueId } = await params;
  const league = await getLeagueDetail(session, leagueId);
  const latestMatchup = league.matchups[0];
  const userTeam = league.fantasyTeams.find((team) => team.isUserTeam);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <Link className="text-sm font-semibold text-primary" href="/dashboard">
        ← League portfolio
      </Link>
      <header className="mt-6 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">
            {league.provider} · {league.season}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {league.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {league.status.replaceAll("_", " ")} ·{" "}
            {league.settings?.scoringType ?? "Unknown scoring"} ·{" "}
            {league.totalRosters ?? league.fantasyTeams.length} teams
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Imported {league.ingestedAt.toLocaleString()} · Source remains
            authoritative
          </p>
        </div>
        <SyncButton connectionId={league.providerConnectionId} />
      </header>

      {userTeam?.roster ? (
        <section className="mt-10 rounded-xl border bg-card p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                Your team
              </p>
              <h2 className="mt-1 text-xl font-semibold">{userTeam.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {userTeam.roster.wins ?? 0}-{userTeam.roster.losses ?? 0}
              {(userTeam.roster.ties ?? 0) > 0
                ? `-${userTeam.roster.ties}`
                : ""}{" "}
              · {userTeam.roster.pointsFor?.toFixed(2) ?? "—"} PF
            </p>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {userTeam.roster.slots.map((slot) => (
              <div
                className={`rounded-lg border p-3 ${slot.isStarter ? "bg-primary/5" : "bg-muted/30"}`}
                key={slot.id}
              >
                <p className="text-xs font-semibold text-muted-foreground">
                  {slot.slotType}
                </p>
                <p className="mt-1 font-semibold">{slot.player.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {[slot.player.position, slot.player.team]
                    .filter(Boolean)
                    .join(" · ") || "Unknown player"}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-10 rounded-xl border border-dashed p-6 text-muted-foreground">
          The connected Sleeper account does not own a roster in this league.
        </section>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">
            {latestMatchup ? `Week ${latestMatchup.week} matchups` : "Matchups"}
          </h2>
          <div className="mt-4 grid gap-3">
            {latestMatchup?.entries.map((entry) => (
              <div
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  entry.roster.fantasyTeam.isUserTeam ? "bg-primary/5" : ""
                }`}
                key={entry.id}
              >
                <span className="font-medium">
                  {entry.roster.fantasyTeam.name}
                </span>
                <span className="font-mono text-sm">
                  {entry.customPoints ?? entry.points ?? "—"}
                </span>
              </div>
            )) ?? (
              <p className="text-sm text-muted-foreground">
                No matchup data is available for the imported week.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Recent transactions</h2>
          <div className="mt-4 grid gap-3">
            {league.transactions.map((transaction) => (
              <div className="rounded-lg border p-3" key={transaction.id}>
                <p className="font-medium capitalize">
                  {transaction.type.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Week {transaction.week} · {transaction.status}
                </p>
              </div>
            ))}
            {league.transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions were returned for the imported week.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
