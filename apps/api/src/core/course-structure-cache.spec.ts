import { describe, expect, it, vi } from "vitest";

import { CourseStructureCache } from "./course-structure-cache";

const course = {
  slug: "en-a1",
  title: "English A1",
  level: "A1",
  modules: [],
};

describe("CourseStructureCache", () => {
  it("loads once and serves subsequent calls from cache", async () => {
    const findMany = vi.fn().mockResolvedValue([course]);
    const prisma = { course: { findMany } };
    const cache = new CourseStructureCache(prisma as never);

    const first = await cache.get("en");
    const second = await cache.get("en");

    expect(first).toEqual([course]);
    expect(second).toBe(first);
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("keeps separate entries per language", async () => {
    const findMany = vi.fn().mockResolvedValue([course]);
    const prisma = { course: { findMany } };
    const cache = new CourseStructureCache(prisma as never);

    await cache.get("en");
    await cache.get("th");

    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it("reloads after invalidate() following a publish", async () => {
    const findMany = vi.fn().mockResolvedValue([course]);
    const prisma = { course: { findMany } };
    const cache = new CourseStructureCache(prisma as never);

    await cache.get("en");
    cache.invalidate();
    await cache.get("en");

    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it("does not poison the cache with a failed load", async () => {
    const findMany = vi
      .fn()
      .mockRejectedValueOnce(new Error("db unavailable"))
      .mockResolvedValueOnce([course]);
    const prisma = { course: { findMany } };
    const cache = new CourseStructureCache(prisma as never);

    await expect(cache.get("en")).rejects.toThrow("db unavailable");
    const result = await cache.get("en");

    expect(result).toEqual([course]);
    expect(findMany).toHaveBeenCalledTimes(2);
  });
});
