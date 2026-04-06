import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../config/prisma.js";

const assertSectionOwner = async (sectionId, userId, role) => {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { course: true },
  });
  if (!section) throw new ApiError(404, "Section not found");
  if (section.course.authorId !== userId && role !== "admin") {
    throw new ApiError(403, "You do not have permission to modify this section");
  }
  return section;
};

// ─── GET /sections/:sectionId/lessons ────────────────────────
export const getLessons = asyncHandler(async (req, res) => {
  const lessons = await prisma.lesson.findMany({
    where: { sectionId: req.params.sectionId },
    orderBy: { order: "asc" },
  });

  return res.status(200).json(
    new ApiResponse(200, { lessons }, "Lessons fetched successfully")
  );
});

// ─── GET /lessons/:lessonId ───────────────────────────────────
export const getLessonById = asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.lessonId },
    include: {
      section: {
        select: { id: true, title: true, courseId: true, type: true },
      },
    },
  });

  if (!lesson) throw new ApiError(404, "Lesson not found");

  return res.status(200).json(
    new ApiResponse(200, { lesson }, "Lesson fetched successfully")
  );
});

// ─── POST /sections/:sectionId/lessons ───────────────────────
export const createLesson = asyncHandler(async (req, res) => {
  const { sectionId } = req.params;
  const section = await assertSectionOwner(sectionId, req.user.id, req.user.role);

  if (section.type !== "video_section") {
    throw new ApiError(400, "Lessons can only be added to video sections");
  }

  const { title, order, type, videoUrl, duration, body, attachmentUrl, isPreview } = req.body;

  const existing = await prisma.lesson.findFirst({ where: { sectionId, order } });
  if (existing) {
    throw new ApiError(409, `A lesson with order ${order} already exists in this section`);
  }

  const lesson = await prisma.lesson.create({
    data: {
      sectionId,
      title,
      order,
      type:          type          ?? "video",
      videoUrl:      videoUrl      ?? "",
      duration:      duration      ?? 0,
      body:          body          ?? "",
      attachmentUrl: attachmentUrl ?? "",
      isPreview:     isPreview     ?? false,
    },
  });

  return res.status(201).json(
    new ApiResponse(201, { lesson }, "Lesson created successfully")
  );
});

// ─── PATCH /lessons/:lessonId ─────────────────────────────────
export const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.lessonId },
    include: { section: { include: { course: true } } },
  });
  if (!lesson) throw new ApiError(404, "Lesson not found");

  if (lesson.section.course.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to update this lesson");
  }

  const updated = await prisma.lesson.update({
    where: { id: req.params.lessonId },
    data: req.body,
  });

  return res.status(200).json(
    new ApiResponse(200, { lesson: updated }, "Lesson updated successfully")
  );
});

// ─── DELETE /lessons/:lessonId ────────────────────────────────
export const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.lessonId },
    include: { section: { include: { course: true } } },
  });
  if (!lesson) throw new ApiError(404, "Lesson not found");

  if (lesson.section.course.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to delete this lesson");
  }

  await prisma.lesson.delete({ where: { id: req.params.lessonId } });

  return res.status(200).json(
    new ApiResponse(200, null, "Lesson deleted successfully")
  );
});

// ─── PATCH /sections/:sectionId/lessons/reorder ───────────────
export const reorderLessons = asyncHandler(async (req, res) => {
  await assertSectionOwner(req.params.sectionId, req.user.id, req.user.role);

  const { lessons } = req.body;
  if (!Array.isArray(lessons)) {
    throw new ApiError(400, "lessons must be an array of { id, order }");
  }

  await prisma.$transaction(
    lessons.map(({ id, order }) =>
      prisma.lesson.update({ where: { id }, data: { order } })
    )
  );

  return res.status(200).json(
    new ApiResponse(200, null, "Lessons reordered successfully")
  );
});
