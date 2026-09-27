import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonAudioService } from "./lesson-audio.service";

const sign = vi.hoisted(() => vi.fn());
vi.mock("@aws-sdk/s3-request-presigner", () => ({ getSignedUrl: sign }));
const session = {
  kind: "lesson",
  userCourse: { userId: "owner" },
  contentRevision: {
    exercises: [
      {
        id: "exercise",
        type: "listening",
        mediaAsset: {
          id: "audio",
          kind: "audio",
          contentType: "audio/mpeg",
          byteSize: 1000,
          storageKey: "revisions/frozen/audio.mp3",
        },
      },
    ],
  },
};
const environment = {
  MEDIA_S3_BUCKET: "private-lessons",
  MEDIA_S3_REGION: "eu-central-1",
  MEDIA_S3_ACCESS_KEY_ID: "test",
  MEDIA_S3_SECRET_ACCESS_KEY: "test",
};

describe("session-authorized lesson audio", () => {
  beforeEach(() => sign.mockReset());
  it("signs only the asset in the frozen revision for five minutes", async () => {
    sign.mockResolvedValue("https://media.example.test/signed");
    const service = new LessonAudioService(
      {
        learningSession: { findUnique: vi.fn().mockResolvedValue(session) },
      } as never,
      environment as never,
    );
    const result = await service.audio("owner", "session", "exercise");
    expect(result.url).toBe("https://media.example.test/signed");
    expect(Date.parse(result.expiresAt) - Date.now()).toBeGreaterThan(290000);
    const command = sign.mock.calls[0]?.[1] as {
      input: { Key: string; Bucket: string };
    };
    expect(command.input).toMatchObject({
      Key: "revisions/frozen/audio.mp3",
      Bucket: "private-lessons",
    });
    expect(sign.mock.calls[0]?.[2]).toEqual({ expiresIn: 300 });
  });
  it.each([
    { user: "other", exercise: "exercise" },
    { user: "owner", exercise: "another-revision" },
  ])(
    "rejects unauthorized requests $user/$exercise before signing",
    async ({ user, exercise }) => {
      const service = new LessonAudioService(
        {
          learningSession: { findUnique: vi.fn().mockResolvedValue(session) },
        } as never,
        environment as never,
      );
      await expect(
        service.audio(user, "session", exercise),
      ).rejects.toMatchObject({ response: { code: "LESSON_AUDIO_NOT_FOUND" } });
      expect(sign).not.toHaveBeenCalled();
    },
  );
  it("reports missing storage without exposing a storage key", async () => {
    const service = new LessonAudioService(
      {
        learningSession: { findUnique: vi.fn().mockResolvedValue(session) },
      } as never,
      {} as never,
    );
    await expect(
      service.audio("owner", "session", "exercise"),
    ).rejects.toMatchObject({ response: { code: "LESSON_AUDIO_UNAVAILABLE" } });
  });
  it("rejects non-audio assets", async () => {
    const invalid = structuredClone(session);
    invalid.contentRevision.exercises[0]!.mediaAsset.contentType = "text/html";
    const service = new LessonAudioService(
      {
        learningSession: { findUnique: vi.fn().mockResolvedValue(invalid) },
      } as never,
      environment as never,
    );
    await expect(
      service.audio("owner", "session", "exercise"),
    ).rejects.toMatchObject({ response: { code: "LESSON_AUDIO_NOT_FOUND" } });
    expect(sign).not.toHaveBeenCalled();
  });
});
