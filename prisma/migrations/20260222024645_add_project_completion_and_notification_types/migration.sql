-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'TASK_CREATED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TASK_UPDATED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'TASK_DELETED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ASSIGNEE_CHANGED';

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedById" TEXT,
ADD COLUMN     "completionNote" TEXT;

-- CreateIndex
CREATE INDEX "Project_completedAt_isArchived_idx" ON "public"."Project"("completedAt", "isArchived");

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
