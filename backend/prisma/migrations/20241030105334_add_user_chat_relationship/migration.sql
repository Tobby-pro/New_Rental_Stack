/*
  Warnings:

  - The `sortOrder` column on the `Search` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `conversationId` on table `Chat` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SortOrder" AS ENUM ('ASC', 'DESC');

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_conversationId_fkey";

-- AlterTable
ALTER TABLE "Chat" ALTER COLUMN "conversationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Search" DROP COLUMN "sortOrder",
ADD COLUMN     "sortOrder" "SortOrder" NOT NULL DEFAULT 'ASC';

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
