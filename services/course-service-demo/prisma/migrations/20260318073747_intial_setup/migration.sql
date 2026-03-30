-- CreateEnum
CREATE TYPE "RoadmapStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "RoadmapEnrollmentStatus" AS ENUM ('active', 'paused', 'completed', 'dropped');

-- CreateEnum
CREATE TYPE "TrackNodeStatus" AS ENUM ('locked', 'unlocked', 'in_progress', 'skipped', 'completed');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('video_section', 'challenge_section');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('video', 'article', 'attachment');

-- CreateEnum
CREATE TYPE "GameLevelType" AS ENUM ('quiz', 'drag_drop', 'code_challenge', 'fill_blank');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('active', 'paused', 'completed', 'dropped');

-- CreateEnum
CREATE TYPE "SkipReason" AS ENUM ('manual', 'placement');

-- CreateTable
CREATE TABLE "Roadmap" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "thumbnail" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "RoadmapStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "freeUpToNode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackNode" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isSkippable" BOOLEAN NOT NULL DEFAULT true,
    "prerequisiteIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "status" "RoadmapEnrollmentStatus" NOT NULL DEFAULT 'active',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackNodeProgress" (
    "id" TEXT NOT NULL,
    "roadmapEnrollmentId" TEXT NOT NULL,
    "trackNodeId" TEXT NOT NULL,
    "status" "TrackNodeStatus" NOT NULL DEFAULT 'locked',
    "courseProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skippedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackNodeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "thumbnail" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" "CourseStatus" NOT NULL DEFAULT 'draft',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'beginner',
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "freeUpToLesson" INTEGER,
    "freeUpToLevel" INTEGER,
    "placementQuizId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementSkipRule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "minScore" INTEGER NOT NULL DEFAULT 80,

    CONSTRAINT "PlacementSkipRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "type" "SectionType" NOT NULL DEFAULT 'video_section',
    "isSkippable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "LessonType" NOT NULL DEFAULT 'video',
    "videoUrl" TEXT NOT NULL DEFAULT '',
    "duration" INTEGER NOT NULL DEFAULT 0,
    "body" TEXT NOT NULL DEFAULT '',
    "attachmentUrl" TEXT NOT NULL DEFAULT '',
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameLevel" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "GameLevelType" NOT NULL DEFAULT 'quiz',
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'active',
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "placementScore" INTEGER,
    "completedAt" TIMESTAMP(3),
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseProgress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "currentSectionId" TEXT,
    "currentLessonId" TEXT,
    "currentLevelId" TEXT,
    "overallProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkippedSection" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "reason" "SkipReason" NOT NULL DEFAULT 'manual',
    "skippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkippedSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "watchedUpTo" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelAttempt" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "answers" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "retryAvailableAt" TIMESTAMP(3),

    CONSTRAINT "LevelAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Roadmap_slug_key" ON "Roadmap"("slug");

-- CreateIndex
CREATE INDEX "idx_roadmap_author" ON "Roadmap"("authorId");

-- CreateIndex
CREATE INDEX "idx_roadmap_status" ON "Roadmap"("status");

-- CreateIndex
CREATE INDEX "idx_track_roadmap" ON "Track"("roadmapId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_track_order" ON "Track"("roadmapId", "order");

-- CreateIndex
CREATE INDEX "idx_node_track" ON "TrackNode"("trackId");

-- CreateIndex
CREATE INDEX "idx_node_course" ON "TrackNode"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_node_order" ON "TrackNode"("trackId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "uq_node_course" ON "TrackNode"("trackId", "courseId");

-- CreateIndex
CREATE INDEX "idx_re_user" ON "RoadmapEnrollment"("userId");

-- CreateIndex
CREATE INDEX "idx_re_roadmap" ON "RoadmapEnrollment"("roadmapId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_roadmap_enrollment" ON "RoadmapEnrollment"("userId", "roadmapId");

-- CreateIndex
CREATE INDEX "idx_np_enrollment" ON "TrackNodeProgress"("roadmapEnrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_node_progress" ON "TrackNodeProgress"("roadmapEnrollmentId", "trackNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_placementQuizId_key" ON "Course"("placementQuizId");

-- CreateIndex
CREATE INDEX "idx_course_author" ON "Course"("authorId");

-- CreateIndex
CREATE INDEX "idx_course_status" ON "Course"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_skip_rule" ON "PlacementSkipRule"("courseId", "sectionId");

-- CreateIndex
CREATE INDEX "idx_section_course" ON "Section"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_section_order" ON "Section"("courseId", "order");

-- CreateIndex
CREATE INDEX "idx_lesson_section" ON "Lesson"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_lesson_order" ON "Lesson"("sectionId", "order");

-- CreateIndex
CREATE INDEX "idx_level_section" ON "GameLevel"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_level_order" ON "GameLevel"("sectionId", "order");

-- CreateIndex
CREATE INDEX "idx_enrollment_user" ON "Enrollment"("userId");

-- CreateIndex
CREATE INDEX "idx_enrollment_course" ON "Enrollment"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_enrollment" ON "Enrollment"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseProgress_enrollmentId_key" ON "CourseProgress"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_skipped_section" ON "SkippedSection"("enrollmentId", "sectionId");

-- CreateIndex
CREATE INDEX "idx_lp_enrollment" ON "LessonProgress"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_lesson_progress" ON "LessonProgress"("enrollmentId", "lessonId");

-- CreateIndex
CREATE INDEX "idx_attempt_enrollment" ON "LevelAttempt"("enrollmentId");

-- CreateIndex
CREATE INDEX "idx_attempt_level" ON "LevelAttempt"("levelId");

-- CreateIndex
CREATE INDEX "idx_review_course" ON "Review"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_review" ON "Review"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackNode" ADD CONSTRAINT "TrackNode_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackNode" ADD CONSTRAINT "TrackNode_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapEnrollment" ADD CONSTRAINT "RoadmapEnrollment_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapEnrollment" ADD CONSTRAINT "RoadmapEnrollment_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackNodeProgress" ADD CONSTRAINT "TrackNodeProgress_roadmapEnrollmentId_fkey" FOREIGN KEY ("roadmapEnrollmentId") REFERENCES "RoadmapEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackNodeProgress" ADD CONSTRAINT "TrackNodeProgress_trackNodeId_fkey" FOREIGN KEY ("trackNodeId") REFERENCES "TrackNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementSkipRule" ADD CONSTRAINT "PlacementSkipRule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementSkipRule" ADD CONSTRAINT "PlacementSkipRule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameLevel" ADD CONSTRAINT "GameLevel_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkippedSection" ADD CONSTRAINT "SkippedSection_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelAttempt" ADD CONSTRAINT "LevelAttempt_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelAttempt" ADD CONSTRAINT "LevelAttempt_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "GameLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
