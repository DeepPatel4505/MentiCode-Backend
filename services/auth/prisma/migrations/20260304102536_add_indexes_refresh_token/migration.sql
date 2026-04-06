/*
  Warnings:

  - A unique constraint covering the columns `[tokenHash]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "idx_refresh_token_hash" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "idx_refresh_expires_at" ON "RefreshToken"("expiresAt");

-- RenameIndex
ALTER INDEX "RefreshToken_userId_idx" RENAME TO "idx_refresh_user_id";
