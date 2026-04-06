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

// ─── GET /sections/:sectionId/levels ─────────────────────────
export const getLevels = asyncHandler(async (req, res) => {
  const where = { sectionId: req.params.sectionId };

  // Non-admins / non-authors only see published levels
  if (req.user?.role !== "admin") {
    where.isPublished = true;
  }

  const levels = await prisma.gameLevel.findMany({
    where,
    orderBy: { order: "asc" },
    select: {
      id: true, title: true, order: true, type: true,
      xpReward: true, passingScore: true, cooldownMinutes: true,
      isPublished: true, createdAt: true,
      // config excluded from list — returned only on detail view
    },
  });

  return res.status(200).json(
    new ApiResponse(200, { levels }, "Game levels fetched successfully")
  );
});

// ─── GET /levels/:levelId ─────────────────────────────────────
export const getLevelById = asyncHandler(async (req, res) => {
  const level = await prisma.gameLevel.findUnique({
    where: { id: req.params.levelId },
    include: {
      section: {
        select: { id: true, title: true, courseId: true, type: true },
      },
    },
  });

  if (!level) throw new ApiError(404, "Game level not found");
  if (!level.isPublished && req.user?.role !== "admin") {
    throw new ApiError(404, "Game level not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { level }, "Game level fetched successfully")
  );
});

// ─── POST /sections/:sectionId/levels ────────────────────────
export const createLevel = asyncHandler(async (req, res) => {
  const { sectionId } = req.params;
  await assertSectionOwner(sectionId, req.user.id, req.user.role);

  const { title, order, type, xpReward, passingScore, cooldownMinutes, config, isPublished } = req.body;

  const existing = await prisma.gameLevel.findFirst({ where: { sectionId, order } });
  if (existing) {
    throw new ApiError(409, `A level with order ${order} already exists in this section`);
  }

  const level = await prisma.gameLevel.create({
    data: {
      sectionId,
      title,
      order,
      type:            type            ?? "quiz",
      xpReward:        xpReward        ?? 10,
      passingScore:    passingScore    ?? 70,
      cooldownMinutes: cooldownMinutes ?? 0,
      config:          config          ?? {},
      isPublished:     isPublished     ?? false,
    },
  });

  // Update course totalXp
  await recalculateCourseXp(sectionId);

  return res.status(201).json(
    new ApiResponse(201, { level }, "Game level created successfully")
  );
});

// ─── PATCH /levels/:levelId ───────────────────────────────────
export const updateLevel = asyncHandler(async (req, res) => {
  const level = await prisma.gameLevel.findUnique({
    where: { id: req.params.levelId },
    include: { section: { include: { course: true } } },
  });
  if (!level) throw new ApiError(404, "Game level not found");

  if (level.section.course.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to update this level");
  }

  const updated = await prisma.gameLevel.update({
    where: { id: req.params.levelId },
    data: req.body,
  });

  if (req.body.xpReward !== undefined) {
    await recalculateCourseXp(level.sectionId);
  }

  return res.status(200).json(
    new ApiResponse(200, { level: updated }, "Game level updated successfully")
  );
});

// ─── DELETE /levels/:levelId ──────────────────────────────────
export const deleteLevel = asyncHandler(async (req, res) => {
  const level = await prisma.gameLevel.findUnique({
    where: { id: req.params.levelId },
    include: { section: { include: { course: true } } },
  });
  if (!level) throw new ApiError(404, "Game level not found");

  if (level.section.course.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to delete this level");
  }

  const sectionId = level.sectionId;
  await prisma.gameLevel.delete({ where: { id: req.params.levelId } });
  await recalculateCourseXp(sectionId);

  return res.status(200).json(
    new ApiResponse(200, null, "Game level deleted successfully")
  );
});

// ─── PATCH /levels/:levelId/publish ──────────────────────────
export const publishLevel = asyncHandler(async (req, res) => {
  const level = await prisma.gameLevel.findUnique({
    where: { id: req.params.levelId },
    include: { section: { include: { course: true } } },
  });
  if (!level) throw new ApiError(404, "Game level not found");

  if (level.section.course.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to publish this level");
  }

  const updated = await prisma.gameLevel.update({
    where: { id: req.params.levelId },
    data: { isPublished: true },
  });

  return res.status(200).json(
    new ApiResponse(200, { level: updated }, "Game level published successfully")
  );
});

// ── Helper: recompute course.totalXp after level create/update/delete
const recalculateCourseXp = async (sectionId) => {
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) return;

  const result = await prisma.gameLevel.aggregate({
    where: { section: { courseId: section.courseId } },
    _sum: { xpReward: true },
  });

  await prisma.course.update({
    where: { id: section.courseId },
    data: { totalXp: result._sum.xpReward ?? 0 },
  });
};
