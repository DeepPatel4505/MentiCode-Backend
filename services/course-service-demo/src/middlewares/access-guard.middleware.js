import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { getUserPlan } from "../utils/user-client.js";
import { prisma } from "../config/prisma.js";

// Checks lesson access — used on GET /lessons/:lessonId
export const guardLesson = asyncHandler(async (req, res, next) => {
  const lessonId = req.params.lessonId || req.params.id;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { include: { course: true } } },
  });

  if (!lesson) throw new ApiError(404, "Lesson not found");

  const course = lesson.section.course;

  // null → whole course is free
  if (course.freeUpToLesson === null) return next();

  // within the free window
  if (lesson.order <= course.freeUpToLesson) return next();

  // needs pro plan
  const plan = await getUserPlan(
    req.user.id,
    req.header("Authorization") || `Bearer ${req.cookies?.accessToken}`
  );

  if (plan === "pro") return next();

  throw new ApiError(
    402,
    "This content requires a Pro plan",
    {
      freeUpTo: course.freeUpToLesson,
      currentOrder: lesson.order,
      courseId: course.id,
    },
    { code: "PAYWALL" }
  );
});

// Checks game level access — used on GET /levels/:levelId
export const guardLevel = asyncHandler(async (req, res, next) => {
  const levelId = req.params.levelId || req.params.id;

  const level = await prisma.gameLevel.findUnique({
    where: { id: levelId },
    include: { section: { include: { course: true } } },
  });

  if (!level) throw new ApiError(404, "Game level not found");

  const course = level.section.course;

  if (course.freeUpToLevel === null) return next();
  if (level.order <= course.freeUpToLevel) return next();

  const plan = await getUserPlan(
    req.user.id,
    req.header("Authorization") || `Bearer ${req.cookies?.accessToken}`
  );

  if (plan === "pro") return next();

  throw new ApiError(
    402,
    "This content requires a Pro plan",
    {
      freeUpTo: course.freeUpToLevel,
      currentOrder: level.order,
      courseId: course.id,
    },
    { code: "PAYWALL" }
  );
});

// Checks roadmap track node access — pro only past freeUpToNode
export const guardTrackNode = asyncHandler(async (req, res, next) => {
  const nodeId = req.params.nodeId || req.params.id;

  const node = await prisma.trackNode.findUnique({
    where: { id: nodeId },
    include: { track: true },
  });

  if (!node) throw new ApiError(404, "Track node not found");

  const track = node.track;

  if (track.freeUpToNode === null) return next();
  if (node.order <= track.freeUpToNode) return next();

  const plan = await getUserPlan(
    req.user.id,
    req.header("Authorization") || `Bearer ${req.cookies?.accessToken}`
  );

  if (plan === "pro") return next();

  throw new ApiError(
    402,
    "This content requires a Pro plan",
    {
      freeUpTo: track.freeUpToNode,
      currentOrder: node.order,
      trackId: track.id,
    },
    { code: "PAYWALL" }
  );
});
