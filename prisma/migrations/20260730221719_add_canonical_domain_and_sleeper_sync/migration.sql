-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('SLEEPER', 'YAHOO', 'ESPN');

-- CreateEnum
CREATE TYPE "ProviderConnectionStatus" AS ENUM ('ACTIVE', 'ERROR', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "SyncRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "RawSnapshotKind" AS ENUM ('ACCOUNT', 'LEAGUES', 'LEAGUE', 'USERS', 'ROSTERS', 'MATCHUPS', 'TRANSACTIONS', 'PLAYERS');

-- CreateTable
CREATE TABLE "provider_connection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "ProviderConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "configuration" JSONB NOT NULL,
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "lastAttemptedSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerConnectionId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "seasonType" TEXT,
    "status" TEXT NOT NULL,
    "totalRosters" INTEGER,
    "avatarUrl" TEXT,
    "sourceUpdatedAt" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessfulSyncId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "league_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_settings" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "scoringType" TEXT NOT NULL,
    "rosterPositions" JSONB NOT NULL,
    "scoringSettings" JSONB NOT NULL,
    "providerSettings" JSONB NOT NULL,
    "waiverType" TEXT,
    "waiverBudget" INTEGER,
    "playoffWeekStart" INTEGER,
    "keeperOrDynasty" BOOLEAN,
    "unsupportedFields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "league_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fantasy_team" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalOwnerId" TEXT,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "isUserTeam" BOOLEAN NOT NULL DEFAULT false,
    "sourceUpdatedAt" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessfulSyncId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fantasy_team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roster" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "wins" INTEGER,
    "losses" INTEGER,
    "ties" INTEGER,
    "pointsFor" DOUBLE PRECISION,
    "waiverPosition" INTEGER,
    "waiverBudgetUsed" INTEGER,
    "sourceUpdatedAt" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessfulSyncId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roster_slot" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "slotType" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "isStarter" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roster_slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matchup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "sourceUpdatedAt" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessfulSyncId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matchup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matchup_entry" (
    "id" TEXT NOT NULL,
    "matchupId" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "points" DOUBLE PRECISION,
    "customPoints" DOUBLE PRECISION,
    "starters" JSONB NOT NULL,
    "players" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matchup_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player" (
    "id" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT NOT NULL,
    "position" TEXT,
    "team" TEXT,
    "status" TEXT,
    "injuryStatus" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_external_id" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_external_id_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fantasy_transaction" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3),
    "adds" JSONB NOT NULL,
    "drops" JSONB NOT NULL,
    "details" JSONB NOT NULL,
    "sourceUpdatedAt" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessfulSyncId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fantasy_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fantasy_transaction_roster" (
    "transactionId" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,

    CONSTRAINT "fantasy_transaction_roster_pkey" PRIMARY KEY ("transactionId","rosterId")
);

-- CreateTable
CREATE TABLE "sync_run" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerConnectionId" TEXT NOT NULL,
    "status" "SyncRunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "importedCounts" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,

    CONSTRAINT "sync_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_error" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "syncRunId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "retryable" BOOLEAN NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_error_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_provider_snapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerConnectionId" TEXT NOT NULL,
    "syncRunId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "kind" "RawSnapshotKind" NOT NULL,
    "externalResourceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_provider_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_connection_userId_provider_idx" ON "provider_connection"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "provider_connection_userId_provider_externalAccountId_key" ON "provider_connection"("userId", "provider", "externalAccountId");

-- CreateIndex
CREATE INDEX "league_userId_season_idx" ON "league"("userId", "season");

-- CreateIndex
CREATE INDEX "league_providerConnectionId_idx" ON "league"("providerConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "league_userId_provider_externalId_key" ON "league"("userId", "provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "league_settings_leagueId_key" ON "league_settings"("leagueId");

-- CreateIndex
CREATE INDEX "fantasy_team_userId_idx" ON "fantasy_team"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fantasy_team_leagueId_externalId_key" ON "fantasy_team"("leagueId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "roster_fantasyTeamId_key" ON "roster"("fantasyTeamId");

-- CreateIndex
CREATE INDEX "roster_userId_idx" ON "roster"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "roster_leagueId_externalId_key" ON "roster"("leagueId", "externalId");

-- CreateIndex
CREATE INDEX "roster_slot_playerId_idx" ON "roster_slot"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "roster_slot_rosterId_playerId_key" ON "roster_slot"("rosterId", "playerId");

-- CreateIndex
CREATE INDEX "matchup_userId_week_idx" ON "matchup"("userId", "week");

-- CreateIndex
CREATE UNIQUE INDEX "matchup_leagueId_week_externalId_key" ON "matchup"("leagueId", "week", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "matchup_entry_matchupId_rosterId_key" ON "matchup_entry"("matchupId", "rosterId");

-- CreateIndex
CREATE INDEX "player_sport_fullName_idx" ON "player"("sport", "fullName");

-- CreateIndex
CREATE INDEX "player_external_id_playerId_idx" ON "player_external_id"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "player_external_id_provider_externalId_key" ON "player_external_id"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "fantasy_transaction_leagueId_externalId_key" ON "fantasy_transaction"("leagueId", "externalId");

-- CreateIndex
CREATE INDEX "sync_run_userId_startedAt_idx" ON "sync_run"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "sync_run_providerConnectionId_startedAt_idx" ON "sync_run"("providerConnectionId", "startedAt");

-- CreateIndex
CREATE INDEX "sync_error_userId_createdAt_idx" ON "sync_error"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "raw_provider_snapshot_providerConnectionId_kind_capturedAt_idx" ON "raw_provider_snapshot"("providerConnectionId", "kind", "capturedAt");

-- CreateIndex
CREATE INDEX "raw_provider_snapshot_syncRunId_idx" ON "raw_provider_snapshot"("syncRunId");

-- AddForeignKey
ALTER TABLE "provider_connection" ADD CONSTRAINT "provider_connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league" ADD CONSTRAINT "league_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league" ADD CONSTRAINT "league_providerConnectionId_fkey" FOREIGN KEY ("providerConnectionId") REFERENCES "provider_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_settings" ADD CONSTRAINT "league_settings_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fantasy_team" ADD CONSTRAINT "fantasy_team_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fantasy_team" ADD CONSTRAINT "fantasy_team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster" ADD CONSTRAINT "roster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster" ADD CONSTRAINT "roster_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster" ADD CONSTRAINT "roster_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "fantasy_team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_slot" ADD CONSTRAINT "roster_slot_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "roster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_slot" ADD CONSTRAINT "roster_slot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchup" ADD CONSTRAINT "matchup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchup" ADD CONSTRAINT "matchup_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchup_entry" ADD CONSTRAINT "matchup_entry_matchupId_fkey" FOREIGN KEY ("matchupId") REFERENCES "matchup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchup_entry" ADD CONSTRAINT "matchup_entry_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "roster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_external_id" ADD CONSTRAINT "player_external_id_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fantasy_transaction" ADD CONSTRAINT "fantasy_transaction_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fantasy_transaction_roster" ADD CONSTRAINT "fantasy_transaction_roster_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "fantasy_transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fantasy_transaction_roster" ADD CONSTRAINT "fantasy_transaction_roster_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "roster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_run" ADD CONSTRAINT "sync_run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_run" ADD CONSTRAINT "sync_run_providerConnectionId_fkey" FOREIGN KEY ("providerConnectionId") REFERENCES "provider_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_error" ADD CONSTRAINT "sync_error_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_error" ADD CONSTRAINT "sync_error_syncRunId_fkey" FOREIGN KEY ("syncRunId") REFERENCES "sync_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_provider_snapshot" ADD CONSTRAINT "raw_provider_snapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_provider_snapshot" ADD CONSTRAINT "raw_provider_snapshot_providerConnectionId_fkey" FOREIGN KEY ("providerConnectionId") REFERENCES "provider_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
