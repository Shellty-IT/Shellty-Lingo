ALTER TABLE "ai_conversation_messages"
  ADD COLUMN "speech_cost_usd" DECIMAL(10, 6) NOT NULL DEFAULT 0;
