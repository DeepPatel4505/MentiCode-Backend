import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../config/prisma.js";

// ─── GET /courses/:courseId/reviews ──────────────────────────
export const getCourseReviews = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const page  = parseInt(req.query.page  ?? "1",  10);
  const limit = parseInt(req.query.limit ?? "10", 10);
  const skip  = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { courseId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where: { courseId } }),
  ]);

  // Average rating
  const agg = await prisma.review.aggregate({
    where: { courseId },
    _avg: { rating: true },
  });

  return res.status(200).json(
    new ApiResponse(200, {
      reviews,
      averageRating: parseFloat((agg._avg.rating ?? 0).toFixed(2)),
      pagination: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }, "Reviews fetched successfully")
  );
});

// ─── POST /courses/:courseId/reviews ─────────────────────────
export const createReview = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;
  const { rating, comment } = req.body;

  // Must be enrolled and completed to leave a review
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) {
    throw new ApiError(400, "You must be enrolled in this course to leave a review");
  }

  // One review per user per course
  const existing = await prisma.review.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) throw new ApiError(409, "You have already reviewed this course");

  const review = await prisma.review.create({
    data: { userId, courseId, rating, comment: comment ?? "" },
  });

  return res.status(201).json(
    new ApiResponse(201, { review }, "Review submitted successfully")
  );
});

// ─── PATCH /courses/:courseId/reviews/:reviewId ───────────────
export const updateReview = asyncHandler(async (req, res) => {
  const { courseId, reviewId } = req.params;
  const userId = req.user.id;

  const review = await prisma.review.findFirst({
    where: { id: reviewId, courseId },
  });
  if (!review) throw new ApiError(404, "Review not found");

  if (review.userId !== userId && req.user.role !== "admin") {
    throw new ApiError(403, "You can only edit your own reviews");
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: req.body,
  });

  return res.status(200).json(
    new ApiResponse(200, { review: updated }, "Review updated successfully")
  );
});

// ─── DELETE /courses/:courseId/reviews/:reviewId ──────────────
export const deleteReview = asyncHandler(async (req, res) => {
  const { courseId, reviewId } = req.params;
  const userId = req.user.id;

  const review = await prisma.review.findFirst({
    where: { id: reviewId, courseId },
  });
  if (!review) throw new ApiError(404, "Review not found");

  if (review.userId !== userId && req.user.role !== "admin") {
    throw new ApiError(403, "You can only delete your own reviews");
  }

  await prisma.review.delete({ where: { id: reviewId } });

  return res.status(200).json(
    new ApiResponse(200, null, "Review deleted successfully")
  );
});
