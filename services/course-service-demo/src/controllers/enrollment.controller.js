import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../config/prisma.js";
import { getUserPlan } from "../utils/user-client.js";

// ─── POST /courses/:courseId/enroll ──────────────────────────
export const enrollInCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new ApiError(404, "Course not found");
  if (course.status !== "published") throw new ApiError(400, "Course is not published");

  // Check existing enrollment
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) throw new ApiError(409, "You are already enrolled in this course");

  // Get all sections ordered by order
  const sections = await prisma.section.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
  });

  const firstSection = sections[0] ?? null;

  // Create enrollment + CourseProgress in a transaction
  const enrollment = await prisma.$transaction(async (tx) => {
    const enroll = await tx.enrollment.create({
      data: { userId, courseId },
    });

    await tx.courseProgress.create({
      data: {
        enrollmentId: enroll.id,
        currentSectionId: firstSection?.id ?? null,
      },
    });

    return enroll;
  });

  return res.status(201).json(
    new ApiResponse(201, { enrollment }, "Enrolled in course successfully")
  );
});

// ─── GET /courses/:courseId/enrollment ───────────────────────
export const getMyEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId: req.user.id, courseId: req.params.courseId },
    },
    include: {
      courseProgress: true,
      _count: { select: { lessonProgress: true, levelAttempts: true } },
    },
  });

  if (!enrollment) throw new ApiError(404, "You are not enrolled in this course");

  return res.status(200).json(
    new ApiResponse(200, { enrollment }, "Enrollment fetched successfully")
  );
});

// ─── GET /enrollments (admin — all enrollments for a course) ──
export const getCourseEnrollments = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const page  = parseInt(req.query.page  ?? "1",  10);
  const limit = parseInt(req.query.limit ?? "20", 10);
  const skip  = (page - 1) * limit;

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId },
      skip, take: limit,
      orderBy: { enrolledAt: "desc" },
      select: {
        id: true, userId: true, status: true, xpEarned: true,
        enrolledAt: true, completedAt: true,
        courseProgress: { select: { overallProgress: true } },
      },
    }),
    prisma.enrollment.count({ where: { courseId } }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      enrollments,
      pagination: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
      },
    }, "Enrollments fetched successfully")
  );
});

// ─── POST /courses/:courseId/placement ───────────────────────
// Student submits placement quiz answers to auto-skip sections
export const submitPlacementQuiz = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;
  const { answers } = req.body;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { sectionSkips: { include: { section: true } } },
  });
  if (!course) throw new ApiError(404, "Course not found");
  if (!course.placementQuizId) {
    throw new ApiError(400, "This course does not have a placement quiz");
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) throw new ApiError(400, "You must be enrolled to take the placement quiz");

  // Simple scoring: count correct answers from the course's placement quiz config
  // The actual quiz config lives in GameLevel.config — fetch it
  const placementLevel = await prisma.gameLevel.findUnique({
    where: { id: course.placementQuizId },
  });
  if (!placementLevel) throw new ApiError(404, "Placement quiz not found");

  const { questions = [] } = placementLevel.config;
  let correct = 0;
  for (const q of questions) {
    const submitted = answers.find((a) => a.questionId === q.id);
    if (submitted && submitted.answer === q.correctAnswer) correct++;
  }

  const score = questions.length > 0
    ? Math.round((correct / questions.length) * 100)
    : 0;

  // Determine which sections to skip based on PlacementSkipRules
  const sectionsToSkip = course.sectionSkips.filter((rule) => score >= rule.minScore);

  await prisma.$transaction(async (tx) => {
    // Update enrollment with placement score
    await tx.enrollment.update({
      where: { id: enrollment.id },
      data: { placementScore: score },
    });

    // Create SkippedSection records
    for (const rule of sectionsToSkip) {
      await tx.skippedSection.upsert({
        where: {
          enrollmentId_sectionId: {
            enrollmentId: enrollment.id,
            sectionId: rule.sectionId,
          },
        },
        create: {
          enrollmentId: enrollment.id,
          sectionId: rule.sectionId,
          reason: "placement",
        },
        update: {},
      });
    }

    // Advance CourseProgress to first non-skipped section
    const skippedIds = sectionsToSkip.map((r) => r.sectionId);
    const sections = await tx.section.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    });
    const firstAvailable = sections.find((s) => !skippedIds.includes(s.id));

    if (firstAvailable) {
      await tx.courseProgress.update({
        where: { enrollmentId: enrollment.id },
        data: { currentSectionId: firstAvailable.id },
      });
    }
  });

  return res.status(200).json(
    new ApiResponse(200, {
      score,
      sectionsSkipped: sectionsToSkip.length,
      skippedSections: sectionsToSkip.map((r) => ({
        sectionId: r.sectionId,
        title: r.section.title,
      })),
    }, `Placement quiz submitted. Score: ${score}%. ${sectionsToSkip.length} section(s) skipped.`)
  );
});

// ─── POST /courses/:courseId/sections/skip ───────────────────
// Student manually skips a skippable section
export const skipSection = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { sectionId } = req.body;
  const userId = req.user.id;

  const section = await prisma.section.findFirst({
    where: { id: sectionId, courseId },
  });
  if (!section) throw new ApiError(404, "Section not found in this course");
  if (!section.isSkippable) throw new ApiError(400, "This section cannot be skipped");

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) throw new ApiError(400, "You are not enrolled in this course");

  // Record the skip
  await prisma.skippedSection.upsert({
    where: {
      enrollmentId_sectionId: {
        enrollmentId: enrollment.id,
        sectionId,
      },
    },
    create: { enrollmentId: enrollment.id, sectionId, reason: "manual" },
    update: {},
  });

  // Advance progress to next section
  const sections = await prisma.section.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
  });

  const currentIndex = sections.findIndex((s) => s.id === sectionId);
  const nextSection  = sections[currentIndex + 1] ?? null;

  await prisma.courseProgress.update({
    where: { enrollmentId: enrollment.id },
    data: {
      currentSectionId: nextSection?.id ?? null,
      currentLessonId:  null,
      currentLevelId:   null,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, {
      skipped: sectionId,
      nextSectionId: nextSection?.id ?? null,
    }, "Section skipped successfully")
  );
});

// ─── GET /enrollments/my ─────────────────────────────────────
// Returns all courses the authenticated user is enrolled in,
// with enrollment + progress data — single DB query, no N+1.
export const getMyEnrollments = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        select: {
          id: true, title: true, slug: true, description: true,
          thumbnail: true, tags: true, status: true, difficulty: true,
          language: true, totalXp: true, freeUpToLesson: true,
          freeUpToLevel: true, authorId: true, createdAt: true,
          _count: { select: { sections: true, enrollments: true, reviews: true } },
        },
      },
      courseProgress: {
        select: {
          overallProgress: true, currentSectionId: true,
          currentLessonId: true, currentLevelId: true,
        },
      },
      _count: { select: { lessonProgress: true, levelAttempts: true } },
    },
  });

  // Shape: each item is the course object with enrollment nested inside
  const courses = enrollments.map((e) => ({
    ...e.course,
    enrollment: {
      id:             e.id,
      status:         e.status,
      xpEarned:       e.xpEarned,
      enrolledAt:     e.enrolledAt,
      completedAt:    e.completedAt,
      courseProgress: e.courseProgress,
      _count:         e._count,
    },
  }));

  return res.status(200).json(
    new ApiResponse(200, { courses }, "My enrollments fetched successfully")
  );
});
