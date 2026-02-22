-- CreateTable
CREATE TABLE "public"."SearchSynonym" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "keyword" TEXT NOT NULL,
    "synonyms" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchSynonym_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchSynonym_projectId_isActive_idx" ON "public"."SearchSynonym"("projectId", "isActive");

-- CreateIndex
CREATE INDEX "SearchSynonym_keyword_isActive_idx" ON "public"."SearchSynonym"("keyword", "isActive");

-- AddForeignKey
ALTER TABLE "public"."SearchSynonym" ADD CONSTRAINT "SearchSynonym_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SearchSynonym" ADD CONSTRAINT "SearchSynonym_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SearchSynonym" ADD CONSTRAINT "SearchSynonym_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
