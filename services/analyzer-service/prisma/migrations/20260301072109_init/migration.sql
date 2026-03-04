-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('upload', 'github');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateTable
CREATE TABLE "Playground" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source_type" "SourceType" NOT NULL DEFAULT 'upload',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playground_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "playground_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis_Job" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Analysis_Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis_Result" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "findings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analysis_Result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Playground_user_id_idx" ON "Playground"("user_id");

-- CreateIndex
CREATE INDEX "Playground_createdAt_idx" ON "Playground"("createdAt");

-- CreateIndex
CREATE INDEX "File_playground_id_idx" ON "File"("playground_id");

-- CreateIndex
CREATE INDEX "File_language_idx" ON "File"("language");

-- CreateIndex
CREATE INDEX "Analysis_Job_file_id_idx" ON "Analysis_Job"("file_id");

-- CreateIndex
CREATE INDEX "Analysis_Job_status_idx" ON "Analysis_Job"("status");

-- CreateIndex
CREATE INDEX "Analysis_Job_createdAt_idx" ON "Analysis_Job"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_Result_job_id_key" ON "Analysis_Result"("job_id");

-- CreateIndex
CREATE INDEX "Analysis_Result_job_id_idx" ON "Analysis_Result"("job_id");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_playground_id_fkey" FOREIGN KEY ("playground_id") REFERENCES "Playground"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis_Job" ADD CONSTRAINT "Analysis_Job_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis_Result" ADD CONSTRAINT "Analysis_Result_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Analysis_Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
