import "server-only";

import type { AuthSession } from "@/modules/auth/auth";
import { prisma } from "@/lib/db";

export async function listPreferencesForSession(session: AuthSession) {
  return prisma.userPreference.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      key: "asc",
    },
  });
}
