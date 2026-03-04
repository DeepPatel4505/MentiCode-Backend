/*
  Warnings:

  - You are about to drop the `Analysis_Job` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Analysis_Result` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Playground` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Analysis_Job" DROP CONSTRAINT "Analysis_Job_file_id_fkey";

-- DropForeignKey
ALTER TABLE "Analysis_Result" DROP CONSTRAINT "Analysis_Result_job_id_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_playground_id_fkey";

-- DropTable
DROP TABLE "Analysis_Job";

-- DropTable
DROP TABLE "Analysis_Result";

-- DropTable
DROP TABLE "File";

-- DropTable
DROP TABLE "Playground";

-- CreateTable
CREATE TABLE "playgrounds" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "playgrounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "playground_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "language" VARCHAR(50) NOT NULL,
    "storage_path" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_jobs" (
    "id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "status" "JobStatus" NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "analysis_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_results" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "summary" JSONB NOT NULL,
    "findings" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_playgrounds_user_id" ON "playgrounds"("user_id");

-- CreateIndex
CREATE INDEX "idx_playgrounds_created_at" ON "playgrounds"("created_at");

-- CreateIndex
CREATE INDEX "idx_files_playground_id" ON "files"("playground_id");

-- CreateIndex
CREATE INDEX "idx_files_language" ON "files"("language");

-- CreateIndex
CREATE INDEX "idx_jobs_file_id" ON "analysis_jobs"("file_id");

-- CreateIndex
CREATE INDEX "idx_jobs_status" ON "analysis_jobs"("status");

-- CreateIndex
CREATE INDEX "idx_jobs_created_at" ON "analysis_jobs"("created_at");

-- CreateIndex
CREATE INDEX "idx_jobs_file_created" ON "analysis_jobs"("file_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "analysis_results_job_id_key" ON "analysis_results"("job_id");

-- CreateIndex
CREATE INDEX "idx_results_job_id" ON "analysis_results"("job_id");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_playground_id_fkey" FOREIGN KEY ("playground_id") REFERENCES "playgrounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_jobs" ADD CONSTRAINT "analysis_jobs_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "analysis_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
