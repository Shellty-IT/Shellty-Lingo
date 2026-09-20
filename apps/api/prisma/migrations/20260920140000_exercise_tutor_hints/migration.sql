CREATE TABLE "exercise_tutor_hints" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "hint" TEXT,
    "focus" VARCHAR(30),
    "provider" VARCHAR(30),
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_tutor_hints_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "exercise_tutor_hints_session_id_exercise_id_key"
ON "exercise_tutor_hints"("session_id", "exercise_id");

CREATE INDEX "exercise_tutor_hints_user_id_status_created_at_idx"
ON "exercise_tutor_hints"("user_id", "status", "created_at");

CREATE INDEX "exercise_tutor_hints_created_at_idx"
ON "exercise_tutor_hints"("created_at");

ALTER TABLE "exercise_tutor_hints"
ADD CONSTRAINT "exercise_tutor_hints_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "exercise_tutor_hints"
ADD CONSTRAINT "exercise_tutor_hints_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "learning_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "exercise_tutor_hints"
ADD CONSTRAINT "exercise_tutor_hints_exercise_id_fkey"
FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
