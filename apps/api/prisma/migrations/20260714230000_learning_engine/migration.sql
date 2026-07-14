CREATE TYPE "LearningSessionKind" AS ENUM ('placement', 'lesson', 'review');
CREATE TYPE "LearningSessionStatus" AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE "ReviewRating" AS ENUM ('again', 'hard', 'good', 'easy');

ALTER TABLE "user_courses"
  ADD COLUMN "current_level" VARCHAR(20) NOT NULL DEFAULT 'A1',
  ADD COLUMN "placement_score" INTEGER,
  ADD COLUMN "placement_completed_at" TIMESTAMP(3);

CREATE TABLE "learning_sessions" (
  "id" UUID NOT NULL,
  "user_course_id" UUID NOT NULL,
  "lesson_id" UUID,
  "kind" "LearningSessionKind" NOT NULL,
  "status" "LearningSessionStatus" NOT NULL DEFAULT 'active',
  "idempotency_key" VARCHAR(100) NOT NULL,
  "current_exercise_id" UUID,
  "correct_count" INTEGER NOT NULL DEFAULT 0,
  "total_count" INTEGER NOT NULL DEFAULT 0,
  "result" JSONB NOT NULL DEFAULT '{}',
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "learning_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "learning_sessions_user_course_id_idempotency_key_key" ON "learning_sessions"("user_course_id", "idempotency_key");
CREATE INDEX "learning_sessions_user_course_id_status_last_activity_at_idx" ON "learning_sessions"("user_course_id", "status", "last_activity_at");

CREATE TABLE "exercise_attempts" (
  "id" UUID NOT NULL,
  "session_id" UUID NOT NULL,
  "exercise_id" UUID NOT NULL,
  "idempotency_key" VARCHAR(100) NOT NULL,
  "answer" JSONB NOT NULL,
  "correct" BOOLEAN NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "feedback" JSONB NOT NULL DEFAULT '{}',
  "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exercise_attempts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "exercise_attempts_session_id_idempotency_key_key" ON "exercise_attempts"("session_id", "idempotency_key");
CREATE INDEX "exercise_attempts_exercise_id_answered_at_idx" ON "exercise_attempts"("exercise_id", "answered_at");

CREATE TABLE "placement_answers" (
  "id" UUID NOT NULL,
  "session_id" UUID NOT NULL,
  "question_id" VARCHAR(80) NOT NULL,
  "selected_option_id" VARCHAR(80) NOT NULL,
  "correct" BOOLEAN NOT NULL,
  CONSTRAINT "placement_answers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "placement_answers_session_id_question_id_key" ON "placement_answers"("session_id", "question_id");

CREATE TABLE "lesson_progress" (
  "id" UUID NOT NULL,
  "user_course_id" UUID NOT NULL,
  "lesson_id" UUID NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'not_started',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "best_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "last_exercise_id" UUID,
  "completed_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "lesson_progress_user_course_id_lesson_id_key" ON "lesson_progress"("user_course_id", "lesson_id");
CREATE INDEX "lesson_progress_user_course_id_status_idx" ON "lesson_progress"("user_course_id", "status");

CREATE TABLE "review_items" (
  "id" UUID NOT NULL,
  "user_course_id" UUID NOT NULL,
  "vocabulary_id" UUID,
  "source_key" VARCHAR(500) NOT NULL,
  "source_text" TEXT NOT NULL,
  "translation" TEXT NOT NULL,
  "context" TEXT,
  "interval_minutes" INTEGER NOT NULL DEFAULT 0,
  "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
  "repetitions" INTEGER NOT NULL DEFAULT 0,
  "lapses" INTEGER NOT NULL DEFAULT 0,
  "due_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "review_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "review_items_user_course_id_source_key_key" ON "review_items"("user_course_id", "source_key");
CREATE INDEX "review_items_user_course_id_due_at_idx" ON "review_items"("user_course_id", "due_at");

CREATE TABLE "review_attempts" (
  "id" UUID NOT NULL,
  "review_item_id" UUID NOT NULL,
  "idempotency_key" VARCHAR(100) NOT NULL,
  "rating" "ReviewRating" NOT NULL,
  "previous_due_at" TIMESTAMP(3) NOT NULL,
  "next_due_at" TIMESTAMP(3) NOT NULL,
  "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "review_attempts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "review_attempts_review_item_id_idempotency_key_key" ON "review_attempts"("review_item_id", "idempotency_key");

CREATE TABLE "learning_events" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "user_course_id" UUID,
  "course_id" UUID,
  "name" VARCHAR(100) NOT NULL,
  "properties" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "learning_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "learning_events_user_id_name_created_at_idx" ON "learning_events"("user_id", "name", "created_at");

ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_user_course_id_fkey" FOREIGN KEY ("user_course_id") REFERENCES "user_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "learning_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "placement_answers" ADD CONSTRAINT "placement_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "learning_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_course_id_fkey" FOREIGN KEY ("user_course_id") REFERENCES "user_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_user_course_id_fkey" FOREIGN KEY ("user_course_id") REFERENCES "user_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabulary_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "review_attempts" ADD CONSTRAINT "review_attempts_review_item_id_fkey" FOREIGN KEY ("review_item_id") REFERENCES "review_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_user_course_id_fkey" FOREIGN KEY ("user_course_id") REFERENCES "user_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
