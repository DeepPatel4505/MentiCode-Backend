import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AUTHORS = [
  "seed-author-001",
  "seed-author-002",
  "seed-author-003",
  "seed-author-004",
];

const STUDENTS = [
  "seed-student-001",
  "seed-student-002",
  "seed-student-003",
  "seed-student-004",
  "seed-student-005",
];

const TEST_VIDEO_URL =
  process.env.SEED_VIDEO_URL ??
  "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const COURSE_BLUEPRINTS = [
  {
    slug: "html-css-fundamentals",
    title: "HTML & CSS Fundamentals",
    description: "Learn how to build modern web pages with semantic HTML and clean CSS.",
    difficulty: "beginner",
    tags: ["html", "css", "frontend"],
  },
  {
    slug: "javascript-essentials",
    title: "JavaScript Essentials",
    description: "Master JavaScript basics, functions, arrays, and objects for real apps.",
    difficulty: "beginner",
    tags: ["javascript", "web", "programming"],
  },
  {
    slug: "typescript-practical",
    title: "Practical TypeScript",
    description: "Use TypeScript confidently in frontend and backend projects.",
    difficulty: "intermediate",
    tags: ["typescript", "javascript", "dev"],
  },
  {
    slug: "react-from-zero",
    title: "React From Zero",
    description: "Build reusable components, manage state, and create polished React apps.",
    difficulty: "intermediate",
    tags: ["react", "frontend", "ui"],
  },
  {
    slug: "nextjs-starter-kit",
    title: "Next.js Starter Kit",
    description: "Ship fast pages and APIs with a production-ready Next.js workflow.",
    difficulty: "intermediate",
    tags: ["nextjs", "react", "fullstack"],
  },
  {
    slug: "node-api-basics",
    title: "Node.js API Basics",
    description: "Create secure REST APIs with Express, validation, and middleware.",
    difficulty: "beginner",
    tags: ["node", "express", "api"],
  },
  {
    slug: "postgresql-for-devs",
    title: "PostgreSQL for Developers",
    description: "Design tables, write queries, and model app data in Postgres.",
    difficulty: "intermediate",
    tags: ["postgres", "sql", "database"],
  },
  {
    slug: "docker-dev-workflows",
    title: "Docker Dev Workflows",
    description: "Containerize apps and streamline local development with Docker.",
    difficulty: "intermediate",
    tags: ["docker", "devops", "backend"],
  },
  {
    slug: "git-github-productivity",
    title: "Git & GitHub Productivity",
    description: "Collaborate with branches, pull requests, and clean commit history.",
    difficulty: "beginner",
    tags: ["git", "github", "workflow"],
  },
  {
    slug: "frontend-testing-toolkit",
    title: "Frontend Testing Toolkit",
    description: "Write reliable UI and integration tests that prevent regressions.",
    difficulty: "intermediate",
    tags: ["testing", "frontend", "qa"],
  },
  {
    slug: "backend-testing-node",
    title: "Backend Testing in Node",
    description: "Test controllers, services, and database flows with confidence.",
    difficulty: "intermediate",
    tags: ["node", "testing", "api"],
  },
  {
    slug: "system-design-junior",
    title: "System Design for Juniors",
    description: "Understand scalable architecture patterns through practical examples.",
    difficulty: "advanced",
    tags: ["system-design", "architecture", "scalability"],
  },
];

const ROADMAP_BLUEPRINTS = [
  {
    slug: "frontend-engineer-roadmap",
    title: "Frontend Engineer Roadmap",
    description: "From web basics to modern React and testing workflows.",
    tracks: [
      {
        title: "Web Foundations",
        description: "Core web technologies and JavaScript fundamentals.",
        courseSlugs: [
          "html-css-fundamentals",
          "javascript-essentials",
          "typescript-practical",
        ],
      },
      {
        title: "Modern Frontend Stack",
        description: "React, Next.js, and frontend testing practices.",
        courseSlugs: [
          "react-from-zero",
          "nextjs-starter-kit",
          "frontend-testing-toolkit",
        ],
      },
    ],
  },
  {
    slug: "backend-engineer-roadmap",
    title: "Backend Engineer Roadmap",
    description: "Build, test, and scale robust backend services.",
    tracks: [
      {
        title: "API Development",
        description: "Node APIs, data modeling, and query performance.",
        courseSlugs: [
          "node-api-basics",
          "postgresql-for-devs",
          "backend-testing-node",
        ],
      },
      {
        title: "Ops and Architecture",
        description: "Deployment workflows and high-level system design.",
        courseSlugs: [
          "docker-dev-workflows",
          "git-github-productivity",
          "system-design-junior",
        ],
      },
    ],
  },
  {
    slug: "fullstack-fast-track",
    title: "Fullstack Fast Track",
    description: "A compact path that combines frontend and backend essentials.",
    tracks: [
      {
        title: "UI to API Journey",
        description: "From interface building to API integration.",
        courseSlugs: [
          "html-css-fundamentals",
          "react-from-zero",
          "node-api-basics",
        ],
      },
      {
        title: "Production Readiness",
        description: "Testing, workflows, and deploy-friendly practices.",
        courseSlugs: [
          "frontend-testing-toolkit",
          "backend-testing-node",
          "docker-dev-workflows",
        ],
      },
    ],
  },
];

const VIDEO_SECTION_COUNT = 3;
const LESSONS_PER_VIDEO_SECTION = 8;

const pick = (arr, index) => arr[index % arr.length];

const makeVideoLessonPayload = ({ slug, title, sectionOrder, lessonOrder }) => {
  const lessonType =
    lessonOrder <= 6 ? "video" : lessonOrder === 7 ? "article" : "attachment";

  return {
    title: `${title} - Section ${sectionOrder} Lesson ${lessonOrder}`,
    order: lessonOrder,
    type: lessonType,
    videoUrl: lessonType === "video" ? TEST_VIDEO_URL : "",
    duration: lessonType === "video" ? 210 + lessonOrder * 35 : 0,
    body:
      lessonType === "article"
        ? `Written notes for ${title}, section ${sectionOrder}, lesson ${lessonOrder}.`
        : "",
    attachmentUrl:
      lessonType === "attachment"
        ? `https://example.com/assets/${slug}/section-${sectionOrder}/resource-${lessonOrder}.pdf`
        : "",
    isPreview: sectionOrder === 1 && lessonOrder <= 2,
  };
};

const makeQuizConfig = (topic, sectionOrder, levelOrder) => ({
  questions: [
    {
      id: `${topic}-s${sectionOrder}-l${levelOrder}-q1`,
      text: `Which concept is most important in ${topic}?`,
      options: ["Structure", "Timing", "Color", "Fonts"],
      correctAnswer: "Structure",
    },
    {
      id: `${topic}-s${sectionOrder}-l${levelOrder}-q2`,
      text: "Which answer usually indicates a safe default?",
      options: ["A", "B", "C", "D"],
      correctAnswer: "A",
    },
    {
      id: `${topic}-s${sectionOrder}-l${levelOrder}-q3`,
      text: "What is the best next step after understanding fundamentals?",
      options: ["Practice", "Skip", "Guess", "Ignore"],
      correctAnswer: "Practice",
    },
  ],
});

const makeDragDropConfig = (topic) => ({
  prompt: `${topic}: match each item with its correct category.`,
  pairs: [
    { item: "Component", target: "UI" },
    { item: "Route", target: "Navigation" },
    { item: "Query", target: "Data" },
  ],
});

const makeCodeChallengeConfig = (topic) => ({
  instructions: `Build a minimal ${topic} feature using the given starter template.`,
  starterCode: "// write your solution here",
  testCases: [
    { id: "t1", description: "renders expected output" },
    { id: "t2", description: "handles invalid input" },
  ],
});

const makeFillBlankConfig = (topic) => ({
  template: `${topic} requires <_> and <_> for a stable workflow.`,
  blanks: [
    { id: "b1", correctAnswer: "planning" },
    { id: "b2", correctAnswer: "practice" },
  ],
});

const makeLevelPayload = ({ type, topic, sectionOrder, levelOrder }) => {
  const base = {
    title: `${topic} - Level ${sectionOrder}.${levelOrder}`,
    order: levelOrder,
    type,
    xpReward: 15 + levelOrder * 5,
    passingScore: type === "code_challenge" ? 80 : 70,
    cooldownMinutes: 0,
    isPublished: true,
  };

  if (type === "quiz") {
    return { ...base, config: makeQuizConfig(topic, sectionOrder, levelOrder) };
  }

  if (type === "drag_drop") {
    return { ...base, config: makeDragDropConfig(topic) };
  }

  if (type === "code_challenge") {
    return { ...base, config: makeCodeChallengeConfig(topic) };
  }

  return { ...base, config: makeFillBlankConfig(topic) };
};

const seedCourseCatalog = async () => {
  const seededCourseMetaBySlug = {};

  for (let courseIndex = 0; courseIndex < COURSE_BLUEPRINTS.length; courseIndex += 1) {
    const blueprint = COURSE_BLUEPRINTS[courseIndex];

    const courseData = {
      authorId: pick(AUTHORS, courseIndex),
      title: blueprint.title,
      slug: blueprint.slug,
      description: blueprint.description,
      thumbnail: `https://picsum.photos/seed/${blueprint.slug}/1280/720`,
      tags: blueprint.tags,
      language: "en",
      status: "published",
      difficulty: blueprint.difficulty,
      freeUpToLesson: 4,
      freeUpToLevel: 1,
    };

    const course = await prisma.course.upsert({
      where: { slug: blueprint.slug },
      update: courseData,
      create: courseData,
    });

    const sectionIdByOrder = {};
    const firstSectionLessonIds = [];
    let firstLevelId = null;

    for (let sectionOrder = 1; sectionOrder <= VIDEO_SECTION_COUNT + 1; sectionOrder += 1) {
      const isChallengeSection = sectionOrder === VIDEO_SECTION_COUNT + 1;
      const sectionTitle = isChallengeSection
        ? `${blueprint.title} - Challenge Arena`
        : `${blueprint.title} - Module ${sectionOrder}`;

      const sectionData = {
        title: sectionTitle,
        description: isChallengeSection
          ? `Hands-on challenges for ${blueprint.title}.`
          : `Video module ${sectionOrder} for ${blueprint.title}.`,
        order: sectionOrder,
        type: isChallengeSection ? "challenge_section" : "video_section",
        isSkippable: true,
      };

      const section = await prisma.section.upsert({
        where: { courseId_order: { courseId: course.id, order: sectionOrder } },
        update: sectionData,
        create: { courseId: course.id, ...sectionData },
      });

      sectionIdByOrder[sectionOrder] = section.id;

      if (!isChallengeSection) {
        for (let lessonOrder = 1; lessonOrder <= LESSONS_PER_VIDEO_SECTION; lessonOrder += 1) {
          const lessonData = makeVideoLessonPayload({
            slug: blueprint.slug,
            title: blueprint.title,
            sectionOrder,
            lessonOrder,
          });

          const lesson = await prisma.lesson.upsert({
            where: {
              sectionId_order: {
                sectionId: section.id,
                order: lessonOrder,
              },
            },
            update: lessonData,
            create: {
              sectionId: section.id,
              ...lessonData,
            },
          });

          if (sectionOrder === 1 && lessonOrder <= 5) {
            firstSectionLessonIds.push(lesson.id);
          }
        }

        const quizLevelData = makeLevelPayload({
          type: "quiz",
          topic: blueprint.title,
          sectionOrder,
          levelOrder: 1,
        });

        const quizLevel = await prisma.gameLevel.upsert({
          where: { sectionId_order: { sectionId: section.id, order: 1 } },
          update: quizLevelData,
          create: {
            sectionId: section.id,
            ...quizLevelData,
          },
        });

        const dragDropData = makeLevelPayload({
          type: "drag_drop",
          topic: blueprint.title,
          sectionOrder,
          levelOrder: 2,
        });

        await prisma.gameLevel.upsert({
          where: { sectionId_order: { sectionId: section.id, order: 2 } },
          update: dragDropData,
          create: {
            sectionId: section.id,
            ...dragDropData,
          },
        });

        if (sectionOrder === 1) {
          firstLevelId = quizLevel.id;
        }
      } else {
        const challengeTypes = ["code_challenge", "fill_blank", "quiz", "drag_drop"];

        for (let i = 0; i < challengeTypes.length; i += 1) {
          const levelOrder = i + 1;
          const levelData = makeLevelPayload({
            type: challengeTypes[i],
            topic: blueprint.title,
            sectionOrder,
            levelOrder,
          });

          await prisma.gameLevel.upsert({
            where: {
              sectionId_order: {
                sectionId: section.id,
                order: levelOrder,
              },
            },
            update: levelData,
            create: {
              sectionId: section.id,
              ...levelData,
            },
          });
        }
      }
    }

    const skipSectionId = sectionIdByOrder[2];
    if (skipSectionId) {
      await prisma.placementSkipRule.upsert({
        where: {
          courseId_sectionId: {
            courseId: course.id,
            sectionId: skipSectionId,
          },
        },
        update: { minScore: 75 },
        create: {
          courseId: course.id,
          sectionId: skipSectionId,
          minScore: 75,
        },
      });
    }

    const xpResult = await prisma.gameLevel.aggregate({
      where: { section: { courseId: course.id } },
      _sum: { xpReward: true },
    });

    await prisma.course.update({
      where: { id: course.id },
      data: { totalXp: xpResult._sum.xpReward ?? 0 },
    });

    seededCourseMetaBySlug[blueprint.slug] = {
      id: course.id,
      slug: blueprint.slug,
      title: blueprint.title,
      sectionIdByOrder,
      firstSectionLessonIds,
      firstLevelId,
    };

    console.info(
      `  seeded course ${courseIndex + 1}/${COURSE_BLUEPRINTS.length}: ${blueprint.title}`
    );
  }

  return seededCourseMetaBySlug;
};

const seedRoadmaps = async (seededCourseMetaBySlug) => {
  let firstRoadmapId = null;
  let firstTrackId = null;

  for (let roadmapIndex = 0; roadmapIndex < ROADMAP_BLUEPRINTS.length; roadmapIndex += 1) {
    const roadmapBlueprint = ROADMAP_BLUEPRINTS[roadmapIndex];

    const roadmapData = {
      authorId: pick(AUTHORS, roadmapIndex),
      title: roadmapBlueprint.title,
      slug: roadmapBlueprint.slug,
      description: roadmapBlueprint.description,
      thumbnail: `https://picsum.photos/seed/${roadmapBlueprint.slug}/1280/720`,
      tags: ["roadmap", "learning", "career"],
      status: "published",
    };

    const roadmap = await prisma.roadmap.upsert({
      where: { slug: roadmapBlueprint.slug },
      update: roadmapData,
      create: roadmapData,
    });

    if (roadmapIndex === 0) {
      firstRoadmapId = roadmap.id;
    }

    for (let trackIndex = 0; trackIndex < roadmapBlueprint.tracks.length; trackIndex += 1) {
      const trackBlueprint = roadmapBlueprint.tracks[trackIndex];
      const trackOrder = trackIndex + 1;

      const trackData = {
        title: trackBlueprint.title,
        description: trackBlueprint.description,
        order: trackOrder,
        freeUpToNode: 1,
      };

      const track = await prisma.track.upsert({
        where: {
          roadmapId_order: {
            roadmapId: roadmap.id,
            order: trackOrder,
          },
        },
        update: trackData,
        create: {
          roadmapId: roadmap.id,
          ...trackData,
        },
      });

      if (roadmapIndex === 0 && trackOrder === 1) {
        firstTrackId = track.id;
      }

      const uniqueSlugs = [...new Set(trackBlueprint.courseSlugs)];

      for (let nodeIndex = 0; nodeIndex < uniqueSlugs.length; nodeIndex += 1) {
        const courseSlug = uniqueSlugs[nodeIndex];
        const courseMeta = seededCourseMetaBySlug[courseSlug];

        if (!courseMeta) {
          continue;
        }

        const nodeOrder = nodeIndex + 1;

        await prisma.trackNode.upsert({
          where: {
            trackId_order: {
              trackId: track.id,
              order: nodeOrder,
            },
          },
          update: {
            courseId: courseMeta.id,
            isSkippable: nodeOrder === 1,
            prerequisiteIds: [],
          },
          create: {
            trackId: track.id,
            courseId: courseMeta.id,
            order: nodeOrder,
            isSkippable: nodeOrder === 1,
            prerequisiteIds: [],
          },
        });
      }
    }

    console.info(
      `  seeded roadmap ${roadmapIndex + 1}/${ROADMAP_BLUEPRINTS.length}: ${roadmapBlueprint.title}`
    );
  }

  return { firstRoadmapId, firstTrackId };
};

const seedLearnerData = async (seededCourseMetaBySlug, roadmapMeta) => {
  const courseMetaList = Object.values(seededCourseMetaBySlug).slice(0, 8);

  for (let studentIndex = 0; studentIndex < STUDENTS.length; studentIndex += 1) {
    const studentId = STUDENTS[studentIndex];

    for (let courseIndex = 0; courseIndex < courseMetaList.length; courseIndex += 1) {
      const courseMeta = courseMetaList[courseIndex];
      const isCompleted = studentIndex === 0 && courseIndex < 2;
      const progressValue = isCompleted
        ? 100
        : Math.min(92, 25 + studentIndex * 10 + courseIndex * 5);

      const enrollmentData = {
        status: isCompleted ? "completed" : "active",
        xpEarned: Math.round(progressValue * 12),
        placementScore: 70 + ((studentIndex + courseIndex) % 20),
        completedAt: isCompleted ? new Date() : null,
      };

      const enrollment = await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: studentId,
            courseId: courseMeta.id,
          },
        },
        update: enrollmentData,
        create: {
          userId: studentId,
          courseId: courseMeta.id,
          ...enrollmentData,
        },
      });

      const currentLessonId =
        courseMeta.firstSectionLessonIds[
          Math.min(courseMeta.firstSectionLessonIds.length - 1, 1 + studentIndex)
        ] ?? null;

      await prisma.courseProgress.upsert({
        where: { enrollmentId: enrollment.id },
        update: {
          currentSectionId: courseMeta.sectionIdByOrder[1] ?? null,
          currentLessonId,
          currentLevelId: courseMeta.firstLevelId,
          overallProgress: progressValue,
        },
        create: {
          enrollmentId: enrollment.id,
          currentSectionId: courseMeta.sectionIdByOrder[1] ?? null,
          currentLessonId,
          currentLevelId: courseMeta.firstLevelId,
          overallProgress: progressValue,
        },
      });

      for (let i = 0; i < courseMeta.firstSectionLessonIds.length; i += 1) {
        const lessonId = courseMeta.firstSectionLessonIds[i];
        const isLessonDone = isCompleted || i < 2 + studentIndex;

        await prisma.lessonProgress.upsert({
          where: {
            enrollmentId_lessonId: {
              enrollmentId: enrollment.id,
              lessonId,
            },
          },
          update: {
            watchedUpTo: isLessonDone ? 1000 : 220 + i * 70,
            isCompleted: isLessonDone,
            completedAt: isLessonDone ? new Date() : null,
          },
          create: {
            enrollmentId: enrollment.id,
            lessonId,
            watchedUpTo: isLessonDone ? 1000 : 220 + i * 70,
            isCompleted: isLessonDone,
            completedAt: isLessonDone ? new Date() : null,
          },
        });
      }

      await prisma.review.upsert({
        where: {
          userId_courseId: {
            userId: studentId,
            courseId: courseMeta.id,
          },
        },
        update: {
          rating: 4 + ((courseIndex + studentIndex) % 2),
          comment: `Great test course for ${courseMeta.title}.`,
        },
        create: {
          userId: studentId,
          courseId: courseMeta.id,
          rating: 4 + ((courseIndex + studentIndex) % 2),
          comment: `Great test course for ${courseMeta.title}.`,
        },
      });

      if (studentIndex === 2 && courseMeta.sectionIdByOrder[2]) {
        await prisma.skippedSection.upsert({
          where: {
            enrollmentId_sectionId: {
              enrollmentId: enrollment.id,
              sectionId: courseMeta.sectionIdByOrder[2],
            },
          },
          update: {
            reason: "manual",
          },
          create: {
            enrollmentId: enrollment.id,
            sectionId: courseMeta.sectionIdByOrder[2],
            reason: "manual",
          },
        });
      }
    }
  }

  if (roadmapMeta.firstRoadmapId && roadmapMeta.firstTrackId) {
    const trackNodes = await prisma.trackNode.findMany({
      where: { trackId: roadmapMeta.firstTrackId },
      orderBy: { order: "asc" },
    });

    for (let i = 0; i < Math.min(3, STUDENTS.length); i += 1) {
      const studentId = STUDENTS[i];

      const roadmapEnrollment = await prisma.roadmapEnrollment.upsert({
        where: {
          userId_roadmapId: {
            userId: studentId,
            roadmapId: roadmapMeta.firstRoadmapId,
          },
        },
        update: {
          trackId: roadmapMeta.firstTrackId,
          status: "active",
          progress: Math.min(95, 20 + i * 25),
          completedAt: null,
        },
        create: {
          userId: studentId,
          roadmapId: roadmapMeta.firstRoadmapId,
          trackId: roadmapMeta.firstTrackId,
          status: "active",
          progress: Math.min(95, 20 + i * 25),
        },
      });

      for (let nodeIndex = 0; nodeIndex < trackNodes.length; nodeIndex += 1) {
        const node = trackNodes[nodeIndex];

        let status = "locked";
        let courseProgress = 0;

        if (nodeIndex === 0) {
          status = "completed";
          courseProgress = 100;
        } else if (nodeIndex === 1) {
          status = i === 0 ? "completed" : "in_progress";
          courseProgress = i === 0 ? 100 : 45 + i * 10;
        } else if (nodeIndex === 2 && i >= 1) {
          status = "unlocked";
          courseProgress = 0;
        }

        await prisma.trackNodeProgress.upsert({
          where: {
            roadmapEnrollmentId_trackNodeId: {
              roadmapEnrollmentId: roadmapEnrollment.id,
              trackNodeId: node.id,
            },
          },
          update: {
            status,
            courseProgress,
            skippedAt: null,
            completedAt: status === "completed" ? new Date() : null,
          },
          create: {
            roadmapEnrollmentId: roadmapEnrollment.id,
            trackNodeId: node.id,
            status,
            courseProgress,
            skippedAt: null,
            completedAt: status === "completed" ? new Date() : null,
          },
        });
      }
    }
  }
};

const printSummary = async () => {
  const [
    courseCount,
    sectionCount,
    lessonCount,
    levelCount,
    enrollmentCount,
    reviewCount,
    roadmapCount,
    trackCount,
    nodeCount,
  ] = await Promise.all([
    prisma.course.count(),
    prisma.section.count(),
    prisma.lesson.count(),
    prisma.gameLevel.count(),
    prisma.enrollment.count(),
    prisma.review.count(),
    prisma.roadmap.count(),
    prisma.track.count(),
    prisma.trackNode.count(),
  ]);

  console.info("\nSeed summary:");
  console.info(`  courses: ${courseCount}`);
  console.info(`  sections: ${sectionCount}`);
  console.info(`  lessons: ${lessonCount}`);
  console.info(`  gameLevels: ${levelCount}`);
  console.info(`  enrollments: ${enrollmentCount}`);
  console.info(`  reviews: ${reviewCount}`);
  console.info(`  roadmaps: ${roadmapCount}`);
  console.info(`  tracks: ${trackCount}`);
  console.info(`  trackNodes: ${nodeCount}`);
};

const seed = async () => {
  console.info("Seeding course-service database with large test data...");

  const seededCourseMetaBySlug = await seedCourseCatalog();
  const roadmapMeta = await seedRoadmaps(seededCourseMetaBySlug);
  await seedLearnerData(seededCourseMetaBySlug, roadmapMeta);

  await printSummary();
  console.info("Seed complete.");
};

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
