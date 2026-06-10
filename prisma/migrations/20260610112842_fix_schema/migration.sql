/*
  Warnings:

  - You are about to drop the `ModelLatest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ModelLatest" DROP CONSTRAINT "ModelLatest_modelId_fkey";

-- DropForeignKey
ALTER TABLE "ts" DROP CONSTRAINT "ts_modelId_fkey";

-- DropTable
DROP TABLE "ModelLatest";

-- DropTable
DROP TABLE "ts";

-- CreateTable
CREATE TABLE "ModelSampleLatest" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "lastProbeAt" TIMESTAMP(3) NOT NULL,
    "state" "OperationalState" NOT NULL DEFAULT 'unknown',
    "ttftMs" DOUBLE PRECISION,
    "latencyMs" DOUBLE PRECISION,
    "throughput" DOUBLE PRECISION,
    "congestion" DOUBLE PRECISION,
    "errorRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelSampleLatest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelSample" (
    "id" SERIAL NOT NULL,
    "modelId" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ttftMs" DOUBLE PRECISION,
    "latencyMs" DOUBLE PRECISION NOT NULL,
    "tokensIn" INTEGER NOT NULL,
    "tokensOut" INTEGER NOT NULL,
    "throughput" DOUBLE PRECISION,
    "success" BOOLEAN NOT NULL,
    "errorCode" "ErrorCode" NOT NULL DEFAULT 'none',
    "errorMessage" TEXT,
    "timeout" BOOLEAN NOT NULL DEFAULT false,
    "congestion" DOUBLE PRECISION,
    "operationalState" "OperationalState" NOT NULL DEFAULT 'unknown',

    CONSTRAINT "ModelSample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelSampleLatest_modelId_key" ON "ModelSampleLatest"("modelId");

-- CreateIndex
CREATE INDEX "ModelSampleLatest_state_idx" ON "ModelSampleLatest"("state");

-- CreateIndex
CREATE INDEX "ModelSampleLatest_updatedAt_idx" ON "ModelSampleLatest"("updatedAt");

-- CreateIndex
CREATE INDEX "idx_model_samples_model_ts" ON "ModelSample"("modelId", "timestamp");

-- CreateIndex
CREATE INDEX "ModelSample_timestamp_idx" ON "ModelSample"("timestamp");

-- AddForeignKey
ALTER TABLE "ModelSampleLatest" ADD CONSTRAINT "ModelSampleLatest_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "NIModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelSample" ADD CONSTRAINT "ModelSample_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "NIModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
