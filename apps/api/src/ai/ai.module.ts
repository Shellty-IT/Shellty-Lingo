import { Module } from "@nestjs/common";
import type { ApiEnvironment } from "@shellty/config";

import { API_ENVIRONMENT } from "../core/app-logger";
import {
  CONVERSATION_AI_PROVIDER,
  createConversationProvider,
} from "./ai-fallback-provider";
import {
  TRANSLATION_AI_PROVIDER,
  createTranslationProvider,
} from "./ai-translation";

/** Provider chains for conversations and dictionary translation. */
@Module({
  providers: [
    {
      provide: CONVERSATION_AI_PROVIDER,
      useFactory: (environment: ApiEnvironment) =>
        createConversationProvider(environment),
      inject: [API_ENVIRONMENT],
    },
    {
      provide: TRANSLATION_AI_PROVIDER,
      useFactory: (environment: ApiEnvironment) =>
        createTranslationProvider(environment),
      inject: [API_ENVIRONMENT],
    },
  ],
  exports: [CONVERSATION_AI_PROVIDER, TRANSLATION_AI_PROVIDER],
})
export class AiModule {}
