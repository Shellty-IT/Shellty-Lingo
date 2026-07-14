import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function seed(): Promise<void> {
  await prisma.systemMetadata.upsert({
    where: { key: "foundation_version" },
    update: { value: "stage-2" },
    create: { key: "foundation_version", value: "stage-2" },
  });
  const english = await prisma.course.upsert({
    where: { slug: "english-everyday-a1" },
    update: { status: "published", title: "English for everyday life" },
    create: {
      slug: "english-everyday-a1",
      language: "en",
      level: "A1",
      title: "English for everyday life",
      description: "Practical first conversations.",
      status: "published",
    },
  });
  const thai = await prisma.course.upsert({
    where: { slug: "thai-script-a1" },
    update: { status: "published", title: "Thai script and first tones" },
    create: {
      slug: "thai-script-a1",
      language: "th",
      level: "A1",
      title: "Thai script and first tones",
      description: "A careful introduction to Thai reading.",
      status: "published",
    },
  });
  const englishModule = await prisma.courseModule.upsert({
    where: {
      courseId_slug: { courseId: english.id, slug: "restaurant-basics" },
    },
    update: { status: "published", title: "At a restaurant" },
    create: {
      courseId: english.id,
      slug: "restaurant-basics",
      title: "At a restaurant",
      position: 1,
      status: "published",
    },
  });
  const thaiModule = await prisma.courseModule.upsert({
    where: { courseId_slug: { courseId: thai.id, slug: "first-consonants" } },
    update: { status: "published", title: "First consonants" },
    create: {
      courseId: thai.id,
      slug: "first-consonants",
      title: "First consonants",
      position: 1,
      status: "published",
    },
  });
  const englishLesson = await prisma.lesson.upsert({
    where: {
      moduleId_slug: { moduleId: englishModule.id, slug: "polite-requests" },
    },
    update: { status: "published" },
    create: {
      moduleId: englishModule.id,
      slug: "polite-requests",
      position: 1,
      status: "published",
    },
  });
  const thaiLesson = await prisma.lesson.upsert({
    where: {
      moduleId_slug: { moduleId: thaiModule.id, slug: "first-thai-letters" },
    },
    update: { status: "published" },
    create: {
      moduleId: thaiModule.id,
      slug: "first-thai-letters",
      position: 1,
      status: "published",
    },
  });
  await seedLesson(
    englishLesson.id,
    "Ordering with polite requests",
    "Choose a natural way to ask for the menu.",
    {
      type: "single_choice",
      prompt: "Choose the polite request.",
      options: [
        { id: "a", text: "Could I have the menu, please?" },
        { id: "b", text: "I want menu." },
      ],
      answer: { correct: "a" },
      explanation: "Could I have is a polite request.",
    },
  );
  await seedLesson(
    thaiLesson.id,
    "อักษรไทย: พยัญชนะชุดแรก",
    "Recognise the first Thai consonants.",
    {
      type: "single_choice",
      prompt: "Which letter is ก (ko kai)?",
      options: [
        { id: "a", text: "ก" },
        { id: "b", text: "ข" },
      ],
      answer: { correct: "a" },
      explanation: "ก is called ko kai.",
    },
  );
  await prisma.systemMetadata.upsert({
    where: { key: "content_version" },
    update: { value: "stage-4" },
    create: { key: "content_version", value: "stage-4" },
  });
}

async function seedLesson(
  lessonId: string,
  title: string,
  summary: string,
  exercise: {
    type: "single_choice";
    prompt: string;
    options: { id: string; text: string }[];
    answer: { correct: string };
    explanation: string;
  },
): Promise<void> {
  const revision = await prisma.contentRevision.upsert({
    where: { lessonId_version: { lessonId, version: 1 } },
    update: {
      status: "published",
      title,
      summary,
      reviewedAt: new Date(),
      publishedAt: new Date(),
    },
    create: {
      lessonId,
      version: 1,
      status: "published",
      title,
      summary,
      estimatedMinutes: 5,
      reviewedAt: new Date(),
      publishedAt: new Date(),
      exercises: { create: { position: 1, ...exercise } },
    },
  });
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { publishedRevisionId: revision.id, status: "published" },
  });
  for (const locale of ["pl", "en", "th"]) {
    await prisma.translation.upsert({
      where: {
        entityType_entityId_locale_field: {
          entityType: "lesson_revision",
          entityId: revision.id,
          locale,
          field: "title",
        },
      },
      update: { value: title, verifiedAt: new Date() },
      create: {
        entityType: "lesson_revision",
        entityId: revision.id,
        locale,
        field: "title",
        value: title,
        verifiedAt: new Date(),
      },
    });
  }
}

seed()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error("Database seed failed", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
