-- CreateEnum
CREATE TYPE "HectocDuelStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HectocChallengeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gamesWon" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 1200;

-- CreateTable
CREATE TABLE "hectoc_duels" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "status" "HectocDuelStatus" NOT NULL DEFAULT 'WAITING',
    "playerOneId" TEXT NOT NULL,
    "playerTwoId" TEXT,
    "digits" INTEGER[],
    "target" INTEGER NOT NULL DEFAULT 100,
    "difficulty" TEXT NOT NULL,
    "winnerId" TEXT,
    "playerOneFinishedAt" TIMESTAMP(3),
    "playerTwoFinishedAt" TIMESTAMP(3),

    CONSTRAINT "hectoc_duels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hectoc_solutions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "duelId" TEXT NOT NULL,
    "expression" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeToSolve" INTEGER NOT NULL,

    CONSTRAINT "hectoc_solutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hectoc_spectators" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "duelId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hectoc_spectators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hectoc_challenges" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "challengerId" TEXT NOT NULL,
    "difficulty" TEXT,
    "message" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "HectocChallengeStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "hectoc_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hectoc_duels_playerOneId_idx" ON "hectoc_duels"("playerOneId");

-- CreateIndex
CREATE INDEX "hectoc_duels_playerTwoId_idx" ON "hectoc_duels"("playerTwoId");

-- CreateIndex
CREATE INDEX "hectoc_duels_status_idx" ON "hectoc_duels"("status");

-- CreateIndex
CREATE INDEX "hectoc_solutions_userId_idx" ON "hectoc_solutions"("userId");

-- CreateIndex
CREATE INDEX "hectoc_solutions_duelId_idx" ON "hectoc_solutions"("duelId");

-- CreateIndex
CREATE UNIQUE INDEX "hectoc_spectators_duelId_userId_key" ON "hectoc_spectators"("duelId", "userId");

-- CreateIndex
CREATE INDEX "hectoc_challenges_challengerId_idx" ON "hectoc_challenges"("challengerId");

-- CreateIndex
CREATE INDEX "hectoc_challenges_status_idx" ON "hectoc_challenges"("status");

-- AddForeignKey
ALTER TABLE "hectoc_duels" ADD CONSTRAINT "hectoc_duels_playerOneId_fkey" FOREIGN KEY ("playerOneId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hectoc_duels" ADD CONSTRAINT "hectoc_duels_playerTwoId_fkey" FOREIGN KEY ("playerTwoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hectoc_solutions" ADD CONSTRAINT "hectoc_solutions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hectoc_solutions" ADD CONSTRAINT "hectoc_solutions_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "hectoc_duels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hectoc_spectators" ADD CONSTRAINT "hectoc_spectators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hectoc_spectators" ADD CONSTRAINT "hectoc_spectators_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "hectoc_duels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hectoc_challenges" ADD CONSTRAINT "hectoc_challenges_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
