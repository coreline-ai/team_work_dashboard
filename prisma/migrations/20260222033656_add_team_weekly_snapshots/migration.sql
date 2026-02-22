-- CreateTable
CREATE TABLE "public"."TeamWeeklySnapshot" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "generatedById" TEXT NOT NULL,
    "summaryJson" JSONB NOT NULL,
    "memberMetricsJson" JSONB NOT NULL,
    "projectMetricsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamWeeklySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamWeeklySnapshot_createdAt_idx" ON "public"."TeamWeeklySnapshot"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamWeeklySnapshot_weekStart_key" ON "public"."TeamWeeklySnapshot"("weekStart");

-- AddForeignKey
ALTER TABLE "public"."TeamWeeklySnapshot" ADD CONSTRAINT "TeamWeeklySnapshot_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
