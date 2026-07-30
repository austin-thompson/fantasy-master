import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  try {
    await prisma.systemMetadata.upsert({
      where: { key: "foundation-version" },
      update: { value: "phase-0b" },
      create: {
        key: "foundation-version",
        value: "phase-0b",
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

void main();
