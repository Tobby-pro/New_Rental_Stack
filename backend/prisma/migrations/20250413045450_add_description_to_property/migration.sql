-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "description" TEXT,
ADD COLUMN     "liveDate" TIMESTAMP(3),
ADD COLUMN     "liveDuration" INTEGER,
ADD COLUMN     "liveEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "liveTitle" TEXT;
