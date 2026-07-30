import "server-only";

import { prisma } from "@/lib/db";

export async function isBootstrapAvailable() {
  return (await prisma.user.count()) === 0;
}
