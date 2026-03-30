import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../config/prisma.js";
import { uniqueSlug } from "../utils/slug.js";

// ─── GET /courses ─────────────────────────────────────────────
export const getAllCourses = asyncHandler(async (req, res) => {
  const page     = parseInt(req.query.page  ?? "1",  10);
  const limit    = parseInt(req.query.limit ?? "10", 10);
  const skip     = (page - 1) * limit;
  const { status, difficulty, search, tags } = req.query;

  const where = {};
  if (status)     where.status     = status;
  if (difficulty) where.difficulty = difficulty;
  if (search) {
    where.OR = [
      { title:       { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (tags) {
    where.tags = { hasSome: tags.split(",").map((t) => t.trim()) };
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, slug: true, description: true,
        thumbnail: true, tags: true, status: true, difficulty: true,
        language: true, totalXp: true, freeUpToLesson: true,
        freeUpToLevel: true, authorId: true, createdAt: true,
        _count: { select: { sections: true, enrollments: true, reviews: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      courses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }, "Courses fetched successfully")
  );
});

// ─── GET /courses/:slug ───────────────────────────────────────
export const getCourseBySlug = asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true, title: true, order: true, type: true,
              videoUrl: true, body: true, attachmentUrl: true,
              duration: true, isPreview: true, createdAt: true,
            },
          },
          levels: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            select: {
              id: true, title: true, order: true, type: true,
              xpReward: true, passingScore: true, isPublished: true,
            },
          },
        },
      },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });

  if (!course) throw new ApiError(404, "Course not found");

  return res.status(200).json(
    new ApiResponse(200, { course }, "Course fetched successfully")
  );
});

// ─── GET /courses/:id (by ID — for internal/admin use) ────────
export const getCourseById = asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { sections: true, enrollments: true, reviews: true } },
    },
  });

  if (!course) throw new ApiError(404, "Course not found");

  return res.status(200).json(
    new ApiResponse(200, { course }, "Course fetched successfully")
  );
});

// ─── POST /courses ────────────────────────────────────────────
export const createCourse = asyncHandler(async (req, res) => {
  const { title, description, thumbnail, tags, language, difficulty,
          freeUpToLesson, freeUpToLevel } = req.body;

  const slug = await uniqueSlug("course", title);

  const course = await prisma.course.create({
    data: {
      authorId: req.user.id,
      title,
      slug,
      description: description ?? "",
      thumbnail:   thumbnail   ?? "",
      tags:        tags        ?? [],
      language:    language    ?? "en",
      difficulty:  difficulty  ?? "beginner",
      freeUpToLesson: freeUpToLesson ?? null,
      freeUpToLevel:  freeUpToLevel  ?? null,
    },
  });

  return res.status(201).json(
    new ApiResponse(201, { course }, "Course created successfully")
  );
});

// ─── PATCH /courses/:id ───────────────────────────────────────
export const updateCourse = asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) throw new ApiError(404, "Course not found");

  if (course.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to update this course");
  }

  const { title, ...rest } = req.body;

  // Regenerate slug only if title changed
  let slug;
  if (title && title !== course.title) {
    slug = await uniqueSlug("course", title, req.params.id);
  }

  const updated = await prisma.course.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(slug  && { slug  }),
      ...rest,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, { course: updated }, "Course updated successfully")
  );
});

// ─── DELETE /courses/:id ──────────────────────────────────────
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) throw new ApiError(404, "Course not found");

  if (course.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to delete this course");
  }

  await prisma.course.delete({ where: { id: req.params.id } });

  return res.status(200).json(
    new ApiResponse(200, null, "Course deleted successfully")
  );
});

// ─── PATCH /courses/:id/publish ───────────────────────────────
export const publishCourse = asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { sections: true } } },
  });
  if (!course) throw new ApiError(404, "Course not found");

  if (course.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to publish this course");
  }

  if (course._count.sections === 0) {
    throw new ApiError(400, "Course must have at least one section before publishing");
  }

  const updated = await prisma.course.update({
    where: { id: req.params.id },
    data: { status: "published" },
  });

  return res.status(200).json(
    new ApiResponse(200, { course: updated }, "Course published successfully")
  );
});

// ─── GET /courses/my ──────────────────────────────────────────
export const getMyCourses = asyncHandler(async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { authorId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { sections: true, enrollments: true } },
    },
  });

  return res.status(200).json(
    new ApiResponse(200, { courses }, "Your courses fetched successfully")
  );
});
