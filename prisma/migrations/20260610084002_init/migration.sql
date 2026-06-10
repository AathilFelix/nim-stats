-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('Meta', 'Google', 'Microsoft', 'Alibaba', 'Mistral', 'DeepSeek', 'NVIDIA', 'Other');

-- CreateEnum
CREATE TYPE "OperationalState" AS ENUM ('healthy', 'busy', 'jammed', 'unknown');

-- CreateEnum
CREATE TYPE "ErrorCode" AS ENUM ('none', 'RateLimit', 'Server', 'BadGateway', 'ServiceUnavailable', 'GatewayTimeout', 'Network', 'Unknown');

-- CreateTable
CREATE TABLE "NIModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NIModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelLatest" (
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

    CONSTRAINT "ModelLatest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ts" (
    "id" SERIAL NOT NULL,
    "modelId" TEXT NOT NULL,
    "ts" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

    CONSTRAINT "ts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "modelId" TEXT,
    "modelName" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NIModel_slug_key" ON "NIModel"("slug");

-- CreateIndex
CREATE INDEX "NIModel_provider_idx" ON "NIModel"("provider");

-- CreateIndex
CREATE INDEX "NIModel_isActive_idx" ON "NIModel"("isActive");

-- CreateIndex
CREATE INDEX "NIModel_slug_idx" ON "NIModel"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ModelLatest_modelId_key" ON "ModelLatest"("modelId");

-- CreateIndex
CREATE INDEX "ModelLatest_state_idx" ON "ModelLatest"("state");

-- CreateIndex
CREATE INDEX "ModelLatest_updatedAt_idx" ON "ModelLatest"("updatedAt");

-- CreateIndex
CREATE INDEX "idx_model_samples_model_ts" ON "ts"("modelId", "ts");

-- CreateIndex
CREATE INDEX "ts_ts_idx" ON "ts"("ts");

-- CreateIndex
CREATE INDEX "Incident_createdAt_idx" ON "Incident"("createdAt");

-- CreateIndex
CREATE INDEX "Incident_modelId_idx" ON "Incident"("modelId");

-- CreateIndex
CREATE INDEX "Incident_severity_idx" ON "Incident"("severity");

-- AddForeignKey
ALTER TABLE "ModelLatest" ADD CONSTRAINT "ModelLatest_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "NIModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ts" ADD CONSTRAINT "ts_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "NIModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
