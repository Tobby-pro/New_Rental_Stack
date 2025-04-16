/*
  Warnings:

  - A unique constraint covering the columns `[landlordId,tenantId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Conversation_landlordId_tenantId_key" ON "Conversation"("landlordId", "tenantId");
