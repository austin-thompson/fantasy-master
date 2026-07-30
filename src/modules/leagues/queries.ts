import "server-only";

import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";

type AuthorizedSession = { user: { id: string } };

export function listLeaguePortfolio(session: AuthorizedSession) {
  return prisma.providerConnection.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      leagues: {
        orderBy: [{ season: "desc" }, { name: "asc" }],
        include: {
          fantasyTeams: {
            where: { isUserTeam: true },
            include: { roster: true },
          },
        },
      },
      syncRuns: {
        orderBy: { startedAt: "desc" },
        take: 5,
        include: { errors: true },
      },
    },
  });
}

export async function getLeagueDetail(
  session: AuthorizedSession,
  leagueId: string,
) {
  const league = await prisma.league.findFirst({
    where: { id: leagueId, userId: session.user.id },
    include: {
      settings: true,
      providerConnection: true,
      fantasyTeams: {
        orderBy: [{ isUserTeam: "desc" }, { name: "asc" }],
        include: {
          roster: {
            include: {
              slots: {
                orderBy: [{ isStarter: "desc" }, { slotIndex: "asc" }],
                include: { player: true },
              },
            },
          },
        },
      },
      matchups: {
        orderBy: { week: "desc" },
        take: 1,
        include: {
          entries: {
            include: {
              roster: {
                include: { fantasyTeam: true },
              },
            },
          },
        },
      },
      transactions: {
        orderBy: [{ week: "desc" }, { occurredAt: "desc" }],
        take: 10,
      },
    },
  });
  if (!league) notFound();
  return league;
}
