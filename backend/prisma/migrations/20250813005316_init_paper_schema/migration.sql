/*
  Warnings:

  - You are about to drop the column `authorsInstitutes` on the `Paper` table. All the data in the column will be lost.
  - You are about to drop the column `index` on the `Paper` table. All the data in the column will be lost.
  - You are about to drop the column `institutes` on the `Paper` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Paper" DROP COLUMN "authorsInstitutes",
DROP COLUMN "index",
DROP COLUMN "institutes",
ADD COLUMN     "affiliations" TEXT,
ADD COLUMN     "authorsAffiliations" TEXT,
ADD COLUMN     "datasetLinks" TEXT[] DEFAULT ARRAY[]::TEXT[];
