/*
  Warnings:

  - You are about to drop the column `viewCount` on the `Paper` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Paper" DROP COLUMN "viewCount",
ADD COLUMN     "authors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "authorsInstitutes" TEXT,
ADD COLUMN     "institutes" TEXT,
ADD COLUMN     "reasoning" TEXT;
