import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";
import { recordActivity } from "../utils/gamification.utils.js";

// ─── GET /courses/:courseId/progress ─────────────────────────
export const getMyCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    include: {
      courseProgress: true,
      lessonProgress: { include: { lesson: { select: { id: true, title: true, order: true } } } },
      levelAttempts: {
        orderBy: { startedAt: "desc" },
        include: { level: { select: { id: true, title: true, order: true, xpReward: true } } },
      },
      skippedSections: true,
    },
  });

  if (!enrollment) throw new ApiError(404, "You are not enrolled in this course");

  return res.status(200).json(
    new ApiResponse(200, { enrollment }, "Course progress fetched successfully")
  );
});

// ─── PATCH /lessons/:lessonId/progress ───────────────────────
// Updates watchedUpTo and marks complete if isCompleted = true
export const updateLessonProgress = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user.id;
  const { watchedUpTo, isCompleted } = req.body;

  // Find the lesson and its course via section
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { section: true },
  });
  if (!lesson) throw new ApiError(404, "Lesson not found");

  // Find enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: lesson.section.courseId } },
  });
  if (!enrollment) throw new ApiError(400, "You are not enrolled in this course");

  const now = new Date();
  const data = {};
  if (watchedUpTo != null) data.watchedUpTo = watchedUpTo;
  if (isCompleted) {
    data.isCompleted = true;
    data.completedAt = now;
  }

  let progress;
  if (isCompleted) {
    // Run inside a transaction so UserStats stays in sync
    progress = await prisma.$transaction(async (tx) => {
      const p = await tx.lessonProgress.upsert({
        where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
        create: { enrollmentId: enrollment.id, lessonId, ...data },
        update: data,
      });
      await recordActivity(tx, enrollment.userId, 0, now);
      return p;
    });
    await advanceProgressAfterLesson(enrollment, lesson);
    await recalculateOverallProgress(enrollment.id, lesson.section.courseId);
  } else {
    progress = await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
      create: { enrollmentId: enrollment.id, lessonId, ...data },
      update: data,
    });
  }

  return res.status(200).json(
    new ApiResponse(200, { progress }, "Lesson progress updated successfully")
  );
});

// ─── POST /levels/:levelId/attempt ───────────────────────────
// Student submits a game level attempt
export const submitLevelAttempt = asyncHandler(async (req, res) => {
  const { levelId } = req.params;
  const userId = req.user.id;
  const { answers } = req.body;

  const level = await prisma.gameLevel.findUnique({
    where: { id: levelId },
    include: { section: true },
  });
  if (!level) throw new ApiError(404, "Game level not found");
  if (!level.isPublished) throw new ApiError(404, "Game level not found");

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: level.section.courseId } },
  });
  if (!enrollment) throw new ApiError(400, "You are not enrolled in this course");

  // ── Cooldown check ────────────────────────────────────────
  if (level.cooldownMinutes > 0) {
    const cooldownKey = `cooldown:${enrollment.id}:${levelId}`;
    const onCooldown = await redis.get(cooldownKey).catch(() => null);
    if (onCooldown) {
      const ttl = await redis.ttl(cooldownKey).catch(() => 0);
      throw new ApiError(
        429,
        `You must wait before retrying this level`,
        { retryAfterSeconds: ttl },
        { code: "COOLDOWN" }
      );
    }
  }

  // ── Score the attempt ─────────────────────────────────────
  const { questions = [] } = level.config;
  let correct = 0;

  for (const q of questions) {
    const submitted = answers.find((a) => a.questionId === q.id);
    if (submitted && submitted.answer === q.correctAnswer) correct++;
  }

  const score    = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  const isPassed = score >= level.passingScore;
  const xpAwarded = isPassed ? level.xpReward : 0;

  // ── Persist attempt ───────────────────────────────────────
  const attempt = await prisma.levelAttempt.create({
    data: {
      enrollmentId: enrollment.id,
      levelId,
      score,
      isPassed,
      xpAwarded,
      answers,
      finishedAt: new Date(),
      retryAvailableAt: !isPassed && level.cooldownMinutes > 0
        ? new Date(Date.now() + level.cooldownMinutes * 60 * 1000)
        : null,
    },
  });

  // ── Set Redis cooldown if failed ──────────────────────────
  if (!isPassed && level.cooldownMinutes > 0) {
    const cooldownKey = `cooldown:${enrollment.id}:${levelId}`;
    await redis
      .set(cooldownKey, "1", "EX", level.cooldownMinutes * 60)
      .catch(() => {});
  }

  // ── Award XP and advance progress if passed ───────────────
  if (isPassed) {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { xpEarned: { increment: xpAwarded } },
      });
      await recordActivity(tx, enrollment.userId, xpAwarded, now);
    });

    await advanceProgressAfterLevel(enrollment, level);
    await recalculateOverallProgress(enrollment.id, level.section.courseId);
  }

  return res.status(201).json(
    new ApiResponse(201, {
      attempt,
      score,
      isPassed,
      xpAwarded,
      ...(attempt.retryAvailableAt && {
        retryAvailableAt: attempt.retryAvailableAt,
        cooldownMinutes: level.cooldownMinutes,
      }),
    }, isPassed ? "Level passed! XP awarded." : `Level failed. Score: ${score}%. Try again.`)
  );
});

// ─── GET /levels/:levelId/attempts ───────────────────────────
// Returns student's past attempts for a level
export const getLevelAttempts = asyncHandler(async (req, res) => {
  const { levelId } = req.params;
  const userId = req.user.id;

  const level = await prisma.gameLevel.findUnique({
    where: { id: levelId },
    include: { section: true },
  });
  if (!level) throw new ApiError(404, "Game level not found");

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: level.section.courseId } },
  });
  if (!enrollment) throw new ApiError(400, "You are not enrolled in this course");

  const attempts = await prisma.levelAttempt.findMany({
    where: { enrollmentId: enrollment.id, levelId },
    orderBy: { startedAt: "desc" },
  });

  // Check active cooldown
  let cooldownRemainingSeconds = 0;
  if (level.cooldownMinutes > 0) {
    const cooldownKey = `cooldown:${enrollment.id}:${levelId}`;
    const ttl = await redis.ttl(cooldownKey).catch(() => 0);
    if (ttl > 0) cooldownRemainingSeconds = ttl;
  }

  return res.status(200).json(
    new ApiResponse(200, {
      attempts,
      cooldownRemainingSeconds,
      totalAttempts: attempts.length,
      bestScore: attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : 0,
    }, "Level attempts fetched successfully")
  );
});

// ─── Helpers ──────────────────────────────────────────────────

// After a lesson is completed, advance CourseProgress pointer
const advanceProgressAfterLesson = async (enrollment, lesson) => {
  // Find next lesson in the same section
  const nextLesson = await prisma.lesson.findFirst({
    where: { sectionId: lesson.sectionId, order: { gt: lesson.order } },
    orderBy: { order: "asc" },
  });

  if (nextLesson) {
    await prisma.courseProgress.update({
      where: { enrollmentId: enrollment.id },
      data: {
        currentSectionId: lesson.sectionId,
        currentLessonId:  nextLesson.id,
        currentLevelId:   null,
      },
    });
    return;
  }

  // No more lessons — point to the first level in this section
  const firstLevel = await prisma.gameLevel.findFirst({
    where: { sectionId: lesson.sectionId, isPublished: true },
    orderBy: { order: "asc" },
  });

  if (firstLevel) {
    await prisma.courseProgress.update({
      where: { enrollmentId: enrollment.id },
      data: {
        currentSectionId: lesson.sectionId,
        currentLessonId:  null,
        currentLevelId:   firstLevel.id,
      },
    });
    return;
  }

  // No levels either — advance to next section
  await advanceToNextSection(enrollment, lesson.sectionId);
};

// After a level is passed, advance CourseProgress pointer
const advanceProgressAfterLevel = async (enrollment, level) => {
  const nextLevel = await prisma.gameLevel.findFirst({
    where: {
      sectionId:   level.sectionId,
      order:       { gt: level.order },
      isPublished: true,
    },
    orderBy: { order: "asc" },
  });

  if (nextLevel) {
    await prisma.courseProgress.update({
      where: { enrollmentId: enrollment.id },
      data: {
        currentSectionId: level.sectionId,
        currentLessonId:  null,
        currentLevelId:   nextLevel.id,
      },
    });
    return;
  }

  // No more levels — advance to next section
  await advanceToNextSection(enrollment, level.sectionId);
};

const advanceToNextSection = async (enrollment, currentSectionId) => {
  const currentSection = await prisma.section.findUnique({
    where: { id: currentSectionId },
  });

  const nextSection = await prisma.section.findFirst({
    where: { courseId: currentSection.courseId, order: { gt: currentSection.order } },
    orderBy: { order: "asc" },
  });

  if (!nextSection) {
    // Course complete!
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "completed", completedAt: new Date() },
    });
    await prisma.courseProgress.update({
      where: { enrollmentId: enrollment.id },
      data: {
        currentSectionId: null,
        currentLessonId:  null,
        currentLevelId:   null,
        overallProgress:  1.0,
      },
    });
    return;
  }

  // Point to first lesson or first level of next section
  const firstLesson = await prisma.lesson.findFirst({
    where: { sectionId: nextSection.id },
    orderBy: { order: "asc" },
  });

  const firstLevel = !firstLesson
    ? await prisma.gameLevel.findFirst({
        where: { sectionId: nextSection.id, isPublished: true },
        orderBy: { order: "asc" },
      })
    : null;

  await prisma.courseProgress.update({
    where: { enrollmentId: enrollment.id },
    data: {
      currentSectionId: nextSection.id,
      currentLessonId:  firstLesson?.id ?? null,
      currentLevelId:   firstLevel?.id  ?? null,
    },
  });
};

// Recalculate overall progress 0.0-1.0
const recalculateOverallProgress = async (enrollmentId, courseId) => {
  const [totalLessons, totalLevels, completedLessons, passedLevels] = await Promise.all([
    prisma.lesson.count({ where: { section: { courseId } } }),
    prisma.gameLevel.count({ where: { section: { courseId }, isPublished: true } }),
    prisma.lessonProgress.count({ where: { enrollmentId, isCompleted: true } }),
    prisma.levelAttempt.count({ where: { enrollmentId, isPassed: true } }),
  ]);

  const total     = totalLessons + totalLevels;
  const completed = completedLessons + passedLevels;
  const overall   = total > 0 ? parseFloat((completed / total).toFixed(4)) : 0;

  await prisma.courseProgress.update({
    where: { enrollmentId },
    data: { overallProgress: overall },
  });
};
