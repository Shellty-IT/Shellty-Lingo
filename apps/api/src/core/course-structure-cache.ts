import { Injectable } from "@nestjs/common";
import type { CourseLanguage } from "@shellty/api-contracts";

import { PrismaService } from "./prisma.service";

export interface CachedLesson {
  id: string;
  slug: string;
  title: string;
  estimatedMinutes: number;
  /** ContentRevision id — needed to look up a per-locale title translation. */
  publishedRevisionId: string;
}

export interface CachedModule {
  slug: string;
  title: string;
  lessons: CachedLesson[];
}

export interface CachedCourse {
  slug: string;
  title: string;
  level: string;
  modules: CachedModule[];
}

/**
 * Memoizes the published course → module → lesson structure per language.
 * That structure is identical for every learner — only per-user progress
 * differs, which callers join separately with a lean, indexed query. Cleared
 * whenever content publication changes (ContentService.publish/rollback), so
 * a stale structure never survives longer than the next publish action.
 */
@Injectable()
export class CourseStructureCache {
  private readonly cache = new Map<CourseLanguage, Promise<CachedCourse[]>>();

  constructor(private readonly prisma: PrismaService) {}

  get(language: CourseLanguage): Promise<CachedCourse[]> {
    const cached = this.cache.get(language);
    if (cached) return cached;
    const loaded = this.load(language);
    this.cache.set(language, loaded);
    loaded.catch(() => this.cache.delete(language));
    return loaded;
  }

  invalidate(): void {
    this.cache.clear();
  }

  private async load(language: CourseLanguage): Promise<CachedCourse[]> {
    const courses = await this.prisma.course.findMany({
      where: { language, status: "published" },
      orderBy: { title: "asc" },
      select: {
        slug: true,
        title: true,
        level: true,
        modules: {
          where: { status: "published" },
          orderBy: { position: "asc" },
          select: {
            slug: true,
            title: true,
            lessons: {
              where: { status: "published" },
              orderBy: { position: "asc" },
              select: {
                id: true,
                slug: true,
                publishedRevision: {
                  select: {
                    id: true,
                    status: true,
                    title: true,
                    estimatedMinutes: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return courses.map((course) => ({
      slug: course.slug,
      title: course.title,
      level: course.level,
      modules: course.modules.map((module) => ({
        slug: module.slug,
        title: module.title,
        lessons: module.lessons
          .filter((lesson) => lesson.publishedRevision?.status === "published")
          .map((lesson) => ({
            id: lesson.id,
            slug: lesson.slug,
            publishedRevisionId: lesson.publishedRevision!.id,
            title: lesson.publishedRevision!.title,
            estimatedMinutes: lesson.publishedRevision!.estimatedMinutes,
          })),
      })),
    }));
  }
}
