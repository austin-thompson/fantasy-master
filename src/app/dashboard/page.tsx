import type { Metadata } from "next";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { SleeperConnectForm } from "@/components/providers/sleeper-connect-form";
import { SyncButton } from "@/components/providers/sync-button";
import { requireSession } from "@/modules/auth/session";
import { listLeaguePortfolio } from "@/modules/leagues/queries";

export const metadata: Metadata = {
  title: "League portfolio",
};

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function freshnessLabel(value: Date | null) {
  if (!value) return "Not synchronized";
  const ageMinutes = Math.round((Date.now() - value.getTime()) / 60_000);
  if (ageMinutes < 2) return "Fresh";
  if (ageMinutes < 60) return `${ageMinutes}m old`;
  return `${Math.round(ageMinutes / 60)}h old`;
}

export default async function DashboardPage() {
  const session = await requireSession();
  const connections = await listLeaguePortfolio(session);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">
            Fantasy portfolio
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Welcome, {session.user.displayUsername ?? session.user.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your normalized, read-only league data in one place.
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="mt-10 rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Connect Sleeper</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Public account lookup only. FantasyMaster never asks for your
              Sleeper password.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
            Read-only
          </span>
        </div>
        <SleeperConnectForm defaultSeason={new Date().getFullYear()} />
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">Imported leagues</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {connections.reduce(
                (total, connection) => total + connection.leagues.length,
                0,
              )}{" "}
              league
              {connections.reduce(
                (total, connection) => total + connection.leagues.length,
                0,
              ) === 1
                ? ""
                : "s"}
            </p>
          </div>
        </div>

        {connections.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            Connect a Sleeper username to import its NFL leagues.
          </div>
        ) : (
          <div className="mt-4 grid gap-5">
            {connections.map((connection) => {
              const latestRun = connection.syncRuns[0];
              return (
                <article
                  className="overflow-hidden rounded-xl border bg-card"
                  key={connection.id}
                >
                  <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-muted/40 px-5 py-4">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                        {connection.provider}
                      </p>
                      <h3 className="font-semibold">
                        {connection.displayName}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last successful sync:{" "}
                        {formatDate(connection.lastSuccessfulSyncAt)} ·{" "}
                        {freshnessLabel(connection.lastSuccessfulSyncAt)}
                      </p>
                    </div>
                    <SyncButton connectionId={connection.id} />
                  </header>

                  {connection.status === "ERROR" ? (
                    <div className="border-b bg-red-50 px-5 py-3 text-sm text-red-800">
                      Last sync failed
                      {latestRun?.errors[0]
                        ? `: ${latestRun.errors[0].message}`
                        : "."}{" "}
                      Previously imported league data remains available.
                    </div>
                  ) : null}

                  <div className="divide-y">
                    {connection.leagues.map((league) => {
                      const userTeam = league.fantasyTeams[0];
                      return (
                        <Link
                          className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/40"
                          href={`/leagues/${league.id}`}
                          key={league.id}
                        >
                          <div>
                            <h4 className="font-semibold">{league.name}</h4>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {league.season} ·{" "}
                              {league.status.replaceAll("_", " ")}
                              {userTeam ? ` · ${userTeam.name}` : ""}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            View league →
                          </span>
                        </Link>
                      );
                    })}
                    {connection.leagues.length === 0 ? (
                      <p className="px-5 py-5 text-sm text-muted-foreground">
                        No NFL leagues were found for the selected season.
                      </p>
                    ) : null}
                  </div>
                  <details className="border-t px-5 py-4">
                    <summary className="cursor-pointer text-sm font-semibold">
                      Recent sync history
                    </summary>
                    <div className="mt-3 grid gap-2">
                      {connection.syncRuns.map((run) => {
                        const counts = run.importedCounts as Record<
                          string,
                          unknown
                        >;
                        return (
                          <div
                            className="rounded-lg border p-3 text-sm"
                            key={run.id}
                          >
                            <div className="flex flex-wrap justify-between gap-2">
                              <span className="font-semibold">
                                {run.status.replaceAll("_", " ")}
                              </span>
                              <span className="text-muted-foreground">
                                {formatDate(run.startedAt)}
                              </span>
                            </div>
                            {run.status === "SUCCEEDED" ? (
                              <p className="mt-1 text-muted-foreground">
                                {String(counts.leagues ?? 0)} leagues ·{" "}
                                {String(counts.rosters ?? 0)} rosters ·{" "}
                                {String(counts.players ?? 0)} players
                              </p>
                            ) : null}
                            {run.errors[0] ? (
                              <p className="mt-1 text-red-700">
                                {run.errors[0].message}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
