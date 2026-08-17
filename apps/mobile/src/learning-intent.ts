export type LearningIntent =
  | { requestId: string; kind: "browse" }
  | { requestId: string; kind: "reviews" }
  | { requestId: string; kind: "lesson"; lessonSlug: string };
