CREATE TABLE "exercise_corrections" (
  "id" UUID NOT NULL,
  "original_attempt_id" UUID NOT NULL,
  "idempotency_key" VARCHAR(100) NOT NULL,
  "request_hash" VARCHAR(64) NOT NULL,
  "answer" JSONB NOT NULL,
  "result" JSONB NOT NULL,
  "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exercise_corrections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "exercise_corrections_original_attempt_id_key" ON "exercise_corrections"("original_attempt_id");
ALTER TABLE "exercise_corrections" ADD CONSTRAINT "exercise_corrections_original_attempt_id_fkey" FOREIGN KEY ("original_attempt_id") REFERENCES "exercise_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exercises" ADD COLUMN "skill_key" VARCHAR(100), ADD COLUMN "learning_objective" TEXT, ADD COLUMN "interaction" JSONB;
ALTER TABLE "user_courses" ADD COLUMN "learning_experiment_version" VARCHAR(50), ADD COLUMN "learning_experiment_cohort" VARCHAR(20);
