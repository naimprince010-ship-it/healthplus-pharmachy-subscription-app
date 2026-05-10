CREATE TABLE "OtpSession" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "otpHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OtpSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OtpSession_phone_createdAt_idx" ON "OtpSession"("phone", "createdAt");
CREATE INDEX "OtpSession_expiresAt_idx" ON "OtpSession"("expiresAt");
