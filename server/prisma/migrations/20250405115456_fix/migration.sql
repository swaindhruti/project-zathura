/*
  Warnings:

  - You are about to drop the `hectoc_challenges` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "hectoc_challenges" DROP CONSTRAINT "hectoc_challenges_challengerId_fkey";

-- DropTable
DROP TABLE "hectoc_challenges";
