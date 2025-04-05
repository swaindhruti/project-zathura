/*
  Warnings:

  - You are about to drop the `hectoc_duels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hectoc_solutions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hectoc_spectators` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('PLAYER');

-- DropForeignKey
ALTER TABLE "hectoc_duels" DROP CONSTRAINT "hectoc_duels_playerOneId_fkey";

-- DropForeignKey
ALTER TABLE "hectoc_duels" DROP CONSTRAINT "hectoc_duels_playerTwoId_fkey";

-- DropForeignKey
ALTER TABLE "hectoc_solutions" DROP CONSTRAINT "hectoc_solutions_duelId_fkey";

-- DropForeignKey
ALTER TABLE "hectoc_solutions" DROP CONSTRAINT "hectoc_solutions_userId_fkey";

-- DropForeignKey
ALTER TABLE "hectoc_spectators" DROP CONSTRAINT "hectoc_spectators_duelId_fkey";

-- DropForeignKey
ALTER TABLE "hectoc_spectators" DROP CONSTRAINT "hectoc_spectators_userId_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "rating" SET DEFAULT 100;

-- DropTable
DROP TABLE "hectoc_duels";

-- DropTable
DROP TABLE "hectoc_solutions";

-- DropTable
DROP TABLE "hectoc_spectators";

-- DropEnum
DROP TYPE "HectocDuelStatus";

-- CreateTable
CREATE TABLE "hectoc_games" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "status" "GameStatus" NOT NULL DEFAULT 'WAITING',
    "target" INTEGER NOT NULL DEFAULT 100,
    "difficulty" TEXT NOT NULL,
    "isDuel" BOOLEAN NOT NULL DEFAULT false,
    "questions" JSONB,

    CONSTRAINT "hectoc_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "participantId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "results" JSONB,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "totalTime" INTEGER NOT NULL DEFAULT 0,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_participants" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'PLAYER',
    "isCreator" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hectoc_games_status_idx" ON "hectoc_games"("status");

-- CreateIndex
CREATE UNIQUE INDEX "results_participantId_gameId_key" ON "results"("participantId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "game_participants_gameId_userId_key" ON "game_participants"("gameId", "userId");

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "game_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "hectoc_games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "hectoc_games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
