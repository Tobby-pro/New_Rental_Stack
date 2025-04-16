/*
  Warnings:

  - You are about to drop the `_UserChats` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[landlordId,tenantId,propertyId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `propertyId` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_UserChats" DROP CONSTRAINT "_UserChats_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserChats" DROP CONSTRAINT "_UserChats_B_fkey";

-- DropIndex
DROP INDEX "Conversation_landlordId_tenantId_key";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "propertyId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_UserChats";

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_landlordId_tenantId_propertyId_key" ON "Conversation"("landlordId", "tenantId", "propertyId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
