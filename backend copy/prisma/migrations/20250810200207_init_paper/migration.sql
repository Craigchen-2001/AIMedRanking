-- CreateTable
CREATE TABLE "public"."Paper" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "keywords" TEXT,
    "pdfUrl" TEXT,
    "conference" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isHealthcare" BOOLEAN NOT NULL DEFAULT false,
    "topic" TEXT,
    "method" TEXT,
    "application" TEXT,
    "codeLink" TEXT,
    "datasetNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paper_pkey" PRIMARY KEY ("id")
);
