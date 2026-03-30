import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../config/prisma.js";

const assertCourseOwner = async (courseId, userId, role) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new ApiError(404, "Course not found");
  if (course.authorId !== userId && role !== "admin") {
    throw new ApiError(403, "You do not have permission to modify this course");
  }
  return course;
};

// ─── GET /courses/:courseId/sections ─────────────────────────
export const getSections = asyncHandler(async (req, res) => {
  const sections = await prisma.section.findMany({
    where: { courseId: req.params.courseId },
    orderBy: { order: "asc" },
    include: {
      lessons: { orderBy: { order: "asc" } },
      levels: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
      },
      _count: { select: { lessons: true, levels: true } },
    },
  });

  return res.status(200).json(
    new ApiResponse(200, { sections }, "Sections fetched successfully")
  );
});

// ─── GET /courses/:courseId/sections/:sectionId ───────────────
export const getSectionById = asyncHandler(async (req, res) => {
  const section = await prisma.section.findFirst({
    where: { id: req.params.sectionId, courseId: req.params.courseId },
    include: {
      lessons: { orderBy: { order: "asc" } },
      levels: { orderBy: { order: "asc" } },
    },
  });

  if (!section) throw new ApiError(404, "Section not found");

  return res.status(200).json(
    new ApiResponse(200, { section }, "Section fetched successfully")
  );
});

// ─── POST /courses/:courseId/sections ────────────────────────
export const createSection = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  await assertCourseOwner(courseId, req.user.id, req.user.role);

  const { title, description, order, type, isSkippable } = req.body;

  // Ensure order is not already taken
  const existing = await prisma.section.findFirst({
    where: { courseId, order },
  });
  if (existing) {
    throw new ApiError(409, `A section with order ${order} already exists in this course`);
  }

  const section = await prisma.section.create({
    data: {
      courseId,
      title,
      description: description ?? "",
      order,
      type:        type        ?? "video_section",
      isSkippable: isSkippable ?? true,
    },
  });

  return res.status(201).json(
    new ApiResponse(201, { section }, "Section created successfully")
  );
});

// ─── PATCH /courses/:courseId/sections/:sectionId ─────────────
export const updateSection = asyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  await assertCourseOwner(courseId, req.user.id, req.user.role);

  const section = await prisma.section.findFirst({
    where: { id: sectionId, courseId },
  });
  if (!section) throw new ApiError(404, "Section not found");

  const updated = await prisma.section.update({
    where: { id: sectionId },
    data: req.body,
  });

  return res.status(200).json(
    new ApiResponse(200, { section: updated }, "Section updated successfully")
  );
});

// ─── DELETE /courses/:courseId/sections/:sectionId ────────────
export const deleteSection = asyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  await assertCourseOwner(courseId, req.user.id, req.user.role);

  const section = await prisma.section.findFirst({
    where: { id: sectionId, courseId },
  });
  if (!section) throw new ApiError(404, "Section not found");

  await prisma.section.delete({ where: { id: sectionId } });

  return res.status(200).json(
    new ApiResponse(200, null, "Section deleted successfully")
  );
});

// ─── PATCH /courses/:courseId/sections/reorder ────────────────
// Body: { sections: [{ id, order }] }
export const reorderSections = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  await assertCourseOwner(courseId, req.user.id, req.user.role);

  const { sections } = req.body;
  if (!Array.isArray(sections)) {
    throw new ApiError(400, "sections must be an array of { id, order }");
  }

  await prisma.$transaction(
    sections.map(({ id, order }) =>
      prisma.section.update({ where: { id }, data: { order } })
    )
  );

  return res.status(200).json(
    new ApiResponse(200, null, "Sections reordered successfully")
  );
});
