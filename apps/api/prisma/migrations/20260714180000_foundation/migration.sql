CREATE TABLE "system_metadata" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_metadata_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "system_metadata_key_key" ON "system_metadata"("key");
