import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../config/prisma.js";
import { uniqueSlug } from "../utils/slug.js";
import { getUserPlan } from "../utils/user-client.js";

// ══════════════════════════════════════════════════════════════
// ROADMAPS
// ══════════════════════════════════════════════════════════════

// ─── GET /roadmaps ────────────────────────────────────────────
export const getAllRoadmaps = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page  ?? "1",  10);
  const limit = parseInt(req.query.limit ?? "10", 10);
  const skip  = (page - 1) * limit;

  const where = {};
  // Non-admins only see published roadmaps
  if (req.user?.role !== "admin") where.status = "published";

  const [roadmaps, total] = await Promise.all([
    prisma.roadmap.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { enrollments: true } },
        tracks: {
          take: 1,
          select: { _count: { select: { nodes: true } } },
        },
      },
    }),
    prisma.roadmap.count({ where }),
  ]);

  // Flatten courseCount onto each roadmap for convenience
  const roadmapsWithCount = roadmaps.map(({ tracks, ...rm }) => ({
    ...rm,
    courseCount: tracks?.[0]?._count?.nodes ?? 0,
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      roadmaps: roadmapsWithCount,
      pagination: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }, "Roadmaps fetched successfully")
  );
});

// ─── GET /roadmaps/slug/:slug ─────────────────────────────────
export const getRoadmapBySlug = asyncHandler(async (req, res) => {
  const roadmap = await prisma.roadmap.findUnique({
    where: { slug: req.params.slug },
    include: {
      tracks: {
        take: 1,
        include: {
          nodes: {
            orderBy: { order: "asc" },
            include: {
              course: {
                select: {
                  id: true, title: true, slug: true, thumbnail: true,
                  difficulty: true, totalXp: true, status: true,
                  _count: { select: { sections: true } },
                },
              },
            },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!roadmap) throw new ApiError(404, "Roadmap not found");
  // Admins can preview draft roadmaps; non-admins only see published
  if (roadmap.status !== "published" && req.user?.role !== "admin") {
    throw new ApiError(403, "This roadmap is not published yet");
  }

  // Flatten: expose courses directly on the roadmap
  const courses = roadmap.tracks?.[0]?.nodes ?? [];
  const { tracks, ...rest } = roadmap;

  return res.status(200).json(
    new ApiResponse(200, { roadmap: { ...rest, courses } }, "Roadmap fetched successfully")
  );
});

// ─── GET /roadmaps/:id (by ID — admin editor) ─────────────────
export const getRoadmapById = asyncHandler(async (req, res) => {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: req.params.id },
    include: {
      tracks: {
        take: 1,
        include: {
          nodes: {
            orderBy: { order: "asc" },
            include: {
              course: {
                select: {
                  id: true, title: true, slug: true, thumbnail: true,
                  difficulty: true, totalXp: true, status: true,
                },
              },
            },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!roadmap) throw new ApiError(404, "Roadmap not found");
  if (roadmap.status !== "published" && req.user?.role !== "admin") {
    throw new ApiError(404, "Roadmap not found");
  }

  const courses = roadmap.tracks?.[0]?.nodes ?? [];
  const { tracks, ...rest } = roadmap;

  return res.status(200).json(
    new ApiResponse(200, { roadmap: { ...rest, courses } }, "Roadmap fetched successfully")
  );
});

// ─── POST /roadmaps ───────────────────────────────────────────
export const createRoadmap = asyncHandler(async (req, res) => {
  const { title, description, thumbnail, tags } = req.body;
  const slug = await uniqueSlug("roadmap", title);

  const roadmap = await prisma.roadmap.create({
    data: {
      authorId:    req.user.id,
      title,
      slug,
      description: description ?? "",
      thumbnail:   thumbnail   ?? "",
      tags:        tags        ?? [],
    },
  });

  return res.status(201).json(
    new ApiResponse(201, { roadmap }, "Roadmap created successfully")
  );
});

// ─── PATCH /roadmaps/:id ──────────────────────────────────────
export const updateRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await prisma.roadmap.findUnique({ where: { id: req.params.id } });
  if (!roadmap) throw new ApiError(404, "Roadmap not found");

  if (roadmap.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to update this roadmap");
  }

  const { title, ...rest } = req.body;
  let slug;
  if (title && title !== roadmap.title) {
    slug = await uniqueSlug("roadmap", title, req.params.id);
  }

  const updated = await prisma.roadmap.update({
    where: { id: req.params.id },
    data: { ...(title && { title }), ...(slug && { slug }), ...rest },
  });

  return res.status(200).json(
    new ApiResponse(200, { roadmap: updated }, "Roadmap updated successfully")
  );
});

// ─── DELETE /roadmaps/:id ─────────────────────────────────────
export const deleteRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await prisma.roadmap.findUnique({ where: { id: req.params.id } });
  if (!roadmap) throw new ApiError(404, "Roadmap not found");

  if (roadmap.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to delete this roadmap");
  }

  await prisma.roadmap.delete({ where: { id: req.params.id } });

  return res.status(200).json(
    new ApiResponse(200, null, "Roadmap deleted successfully")
  );
});

// ══════════════════════════════════════════════════════════════
// ROADMAP COURSES (trackless API — one hidden default track)
// ══════════════════════════════════════════════════════════════

// ── Ensure a default track exists for a roadmap ───────────────
const ensureDefaultTrack = async (roadmapId) => {
  let track = await prisma.track.findFirst({ where: { roadmapId } });
  if (!track) {
    track = await prisma.track.create({
      data: { roadmapId, title: "Default", description: "", order: 1 },
    });
  }
  return track;
};

// ─── POST /roadmaps/:id/courses ───────────────────────────────
export const addCourseToRoadmap = asyncHandler(async (req, res) => {
  const { id: roadmapId } = req.params;
  const { courseId, order } = req.body;

  const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
  if (!roadmap) throw new ApiError(404, "Roadmap not found");
  if (roadmap.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new ApiError(404, "Course not found");
  if (course.status !== "published") throw new ApiError(400, "Only published courses can be added");

  const track = await ensureDefaultTrack(roadmapId);

  // Auto-assign order if not provided
  const nodeOrder = order ?? (await prisma.trackNode.count({ where: { trackId: track.id } })) + 1;

  const existing = await prisma.trackNode.findFirst({ where: { trackId: track.id, courseId } });
  if (existing) throw new ApiError(409, "Course already in this roadmap");

  const node = await prisma.trackNode.create({
    data: { trackId: track.id, courseId, order: nodeOrder, isSkippable: true },
    include: {
      course: { select: { id: true, title: true, slug: true, thumbnail: true, difficulty: true, totalXp: true } },
    },
  });

  return res.status(201).json(new ApiResponse(201, { node }, "Course added to roadmap"));
});

// ─── DELETE /roadmaps/:id/courses/:nodeId ─────────────────────
export const removeCourseFromRoadmap = asyncHandler(async (req, res) => {
  const { id: roadmapId, nodeId } = req.params;

  const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
  if (!roadmap) throw new ApiError(404, "Roadmap not found");
  if (roadmap.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  const track = await prisma.track.findFirst({ where: { roadmapId } });
  if (!track) throw new ApiError(404, "Roadmap has no courses");

  const node = await prisma.trackNode.findFirst({ where: { id: nodeId, trackId: track.id } });
  if (!node) throw new ApiError(404, "Course not found in roadmap");

  await prisma.trackNode.delete({ where: { id: nodeId } });

  return res.status(200).json(new ApiResponse(200, null, "Course removed from roadmap"));
});

// ══════════════════════════════════════════════════════════════
// TRACKS (kept for internal use — hidden from users)
// ══════════════════════════════════════════════════════════════

// ─── POST /roadmaps/:roadmapId/tracks ────────────────────────
export const createTrack = asyncHandler(async (req, res) => {
  const { roadmapId } = req.params;

  const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
  if (!roadmap) throw new ApiError(404, "Roadmap not found");
  if (roadmap.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to modify this roadmap");
  }

  const { title, description, order, freeUpToNode } = req.body;

  const existing = await prisma.track.findFirst({ where: { roadmapId, order } });
  if (existing) throw new ApiError(409, `A track with order ${order} already exists`);

  const track = await prisma.track.create({
    data: {
      roadmapId,
      title,
      description: description  ?? "",
      order,
      freeUpToNode: freeUpToNode ?? null,
    },
  });

  return res.status(201).json(
    new ApiResponse(201, { track }, "Track created successfully")
  );
});

// ─── PATCH /roadmaps/:roadmapId/tracks/:trackId ───────────────
export const updateTrack = asyncHandler(async (req, res) => {
  const { roadmapId, trackId } = req.params;

  const track = await prisma.track.findFirst({ where: { id: trackId, roadmapId } });
  if (!track) throw new ApiError(404, "Track not found");

  const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
  if (roadmap.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to modify this roadmap");
  }

  const updated = await prisma.track.update({
    where: { id: trackId },
    data: req.body,
  });

  return res.status(200).json(
    new ApiResponse(200, { track: updated }, "Track updated successfully")
  );
});

// ─── DELETE /roadmaps/:roadmapId/tracks/:trackId ──────────────
export const deleteTrack = asyncHandler(async (req, res) => {
  const { roadmapId, trackId } = req.params;

  const track = await prisma.track.findFirst({ where: { id: trackId, roadmapId } });
  if (!track) throw new ApiError(404, "Track not found");

  const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
  if (roadmap.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to modify this roadmap");
  }

  await prisma.track.delete({ where: { id: trackId } });

  return res.status(200).json(
    new ApiResponse(200, null, "Track deleted successfully")
  );
});

// ══════════════════════════════════════════════════════════════
// TRACK NODES
// ══════════════════════════════════════════════════════════════

// ─── POST /tracks/:trackId/nodes ─────────────────────────────
export const createTrackNode = asyncHandler(async (req, res) => {
  const { trackId } = req.params;

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: { roadmap: true },
  });
  if (!track) throw new ApiError(404, "Track not found");
  if (track.roadmap.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to modify this track");
  }

  const { courseId, order, isSkippable, prerequisiteIds } = req.body;

  // Validate course exists and is published
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new ApiError(404, "Course not found");
  if (course.status !== "published") {
    throw new ApiError(400, "Only published courses can be added to a track");
  }

  // Validate prerequisiteIds are all within the same track
  if (prerequisiteIds?.length > 0) {
    const validNodes = await prisma.trackNode.findMany({
      where: { id: { in: prerequisiteIds }, trackId },
    });
    if (validNodes.length !== prerequisiteIds.length) {
      throw new ApiError(400, "All prerequisiteIds must belong to the same track");
    }
  }

  const existing = await prisma.trackNode.findFirst({ where: { trackId, order } });
  if (existing) throw new ApiError(409, `A node with order ${order} already exists in this track`);

  const node = await prisma.trackNode.create({
    data: {
      trackId,
      courseId,
      order,
      isSkippable:     isSkippable     ?? true,
      prerequisiteIds: prerequisiteIds ?? [],
    },
    include: { course: { select: { id: true, title: true, slug: true, thumbnail: true } } },
  });

  return res.status(201).json(
    new ApiResponse(201, { node }, "Track node created successfully")
  );
});

// ─── PATCH /tracks/:trackId/nodes/:nodeId ────────────────────
export const updateTrackNode = asyncHandler(async (req, res) => {
  const { trackId, nodeId } = req.params;

  const node = await prisma.trackNode.findFirst({ where: { id: nodeId, trackId } });
  if (!node) throw new ApiError(404, "Track node not found");

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: { roadmap: true },
  });
  if (track.roadmap.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to modify this track");
  }

  const updated = await prisma.trackNode.update({
    where: { id: nodeId },
    data: req.body,
  });

  return res.status(200).json(
    new ApiResponse(200, { node: updated }, "Track node updated successfully")
  );
});

// ─── DELETE /tracks/:trackId/nodes/:nodeId ────────────────────
export const deleteTrackNode = asyncHandler(async (req, res) => {
  const { trackId, nodeId } = req.params;

  const node = await prisma.trackNode.findFirst({ where: { id: nodeId, trackId } });
  if (!node) throw new ApiError(404, "Track node not found");

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: { roadmap: true },
  });
  if (track.roadmap.authorId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to modify this track");
  }

  await prisma.trackNode.delete({ where: { id: nodeId } });

  return res.status(200).json(
    new ApiResponse(200, null, "Track node deleted successfully")
  );
});

// ══════════════════════════════════════════════════════════════
// ROADMAP ENROLLMENTS
// ══════════════════════════════════════════════════════════════

// ─── POST /roadmaps/:roadmapId/enroll ────────────────────────
export const enrollInRoadmap = asyncHandler(async (req, res) => {
  const { roadmapId } = req.params;
  const userId = req.user.id;

  // Pro plan check
  const plan = await getUserPlan(
    userId,
    req.header("Authorization") || `Bearer ${req.cookies?.accessToken}`
  );
  if (plan !== "pro") {
    throw new ApiError(402, "Roadmap enrollment requires a Pro plan", null, { code: "PAYWALL" });
  }

  const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
  if (!roadmap) throw new ApiError(404, "Roadmap not found");
  if (roadmap.status !== "published") throw new ApiError(400, "Roadmap is not published");

  const existing = await prisma.roadmapEnrollment.findUnique({
    where: { userId_roadmapId: { userId, roadmapId } },
  });
  if (existing) throw new ApiError(409, "You are already enrolled in this roadmap");

  // Get the single default track
  const track = await prisma.track.findFirst({ where: { roadmapId } });
  if (!track) throw new ApiError(400, "Roadmap has no courses yet");

  const nodes = await prisma.trackNode.findMany({
    where: { trackId: track.id },
    orderBy: { order: "asc" },
  });

  const enrollment = await prisma.$transaction(async (tx) => {
    const re = await tx.roadmapEnrollment.create({
      data: { userId, roadmapId, trackId: track.id },
    });

    for (const node of nodes) {
      await tx.trackNodeProgress.create({
        data: {
          roadmapEnrollmentId: re.id,
          trackNodeId: node.id,
          status: "unlocked", // all courses unlocked immediately
        },
      });
    }

    return re;
  });

  return res.status(201).json(
    new ApiResponse(201, { enrollment }, "Enrolled in roadmap successfully")
  );
});

// ─── GET /roadmaps/my ────────────────────────────────────────
export const getMyRoadmaps = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const enrollments = await prisma.roadmapEnrollment.findMany({
    where: { userId },
    include: {
      roadmap: {
        select: { id: true, title: true, slug: true, description: true, tags: true, status: true },
      },
      track: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return res.status(200).json(
    new ApiResponse(200, { enrollments }, "My roadmap enrollments fetched successfully")
  );
});

// ─── GET /roadmaps/:roadmapId/enrollment ─────────────────────
export const getMyRoadmapEnrollment = asyncHandler(async (req, res) => {
  const { roadmapId } = req.params;
  const userId = req.user.id;

  const enrollment = await prisma.roadmapEnrollment.findUnique({
    where: { userId_roadmapId: { userId, roadmapId } },
    include: {
      track: { include: { nodes: { orderBy: { order: "asc" } } } },
      nodeProgress: {
        include: {
          trackNode: {
            include: {
              course: { select: { id: true, title: true, slug: true, thumbnail: true } },
            },
          },
        },
        orderBy: { trackNode: { order: "asc" } },
      },
    },
  });

  if (!enrollment) throw new ApiError(404, "You are not enrolled in this roadmap");

  return res.status(200).json(
    new ApiResponse(200, { enrollment }, "Roadmap enrollment fetched successfully")
  );
});

// ─── PATCH /roadmaps/:roadmapId/nodes/:nodeId/skip ───────────
// Student manually skips a skippable node
export const skipTrackNode = asyncHandler(async (req, res) => {
  const { roadmapId, nodeId } = req.params;
  const userId = req.user.id;

  const enrollment = await prisma.roadmapEnrollment.findUnique({
    where: { userId_roadmapId: { userId, roadmapId } },
  });
  if (!enrollment) throw new ApiError(400, "You are not enrolled in this roadmap");

  const node = await prisma.trackNode.findFirst({
    where: { id: nodeId, trackId: enrollment.trackId },
  });
  if (!node) throw new ApiError(404, "Track node not found in your track");
  if (!node.isSkippable) throw new ApiError(400, "This node cannot be skipped");

  const nodeProgress = await prisma.trackNodeProgress.findUnique({
    where: {
      roadmapEnrollmentId_trackNodeId: {
        roadmapEnrollmentId: enrollment.id,
        trackNodeId: nodeId,
      },
    },
  });
  if (!nodeProgress) throw new ApiError(404, "Node progress not found");
  if (nodeProgress.status === "locked") {
    throw new ApiError(400, "Cannot skip a locked node — complete prerequisites first");
  }

  await prisma.trackNodeProgress.update({
    where: {
      roadmapEnrollmentId_trackNodeId: {
        roadmapEnrollmentId: enrollment.id,
        trackNodeId: nodeId,
      },
    },
    data: { status: "skipped", skippedAt: new Date() },
  });

  // Unlock next nodes whose prerequisites are now satisfied
  await unlockEligibleNodes(enrollment.id, enrollment.trackId);

  return res.status(200).json(
    new ApiResponse(200, null, "Track node skipped successfully")
  );
});

// ── Helper: unlock nodes whose prerequisites are all done/skipped
const unlockEligibleNodes = async (roadmapEnrollmentId, trackId) => {
  const allProgress = await prisma.trackNodeProgress.findMany({
    where: { roadmapEnrollmentId },
    include: { trackNode: true },
  });

  const doneStatuses = ["completed", "skipped"];

  for (const np of allProgress) {
    if (np.status !== "locked") continue;

    const prereqs = np.trackNode.prerequisiteIds;
    if (prereqs.length === 0) continue;

    const allMet = prereqs.every((prereqId) => {
      const prereqProgress = allProgress.find((p) => p.trackNodeId === prereqId);
      return prereqProgress && doneStatuses.includes(prereqProgress.status);
    });

    if (allMet) {
      await prisma.trackNodeProgress.update({
        where: {
          roadmapEnrollmentId_trackNodeId: {
            roadmapEnrollmentId,
            trackNodeId: np.trackNodeId,
          },
        },
        data: { status: "unlocked" },
      });
    }
  }
};
