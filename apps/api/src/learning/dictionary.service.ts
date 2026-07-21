import { Inject, Injectable, Optional } from "@nestjs/common";
import type {
  ContextDictionaryResult,
  CourseLanguage,
  InterfaceLocale,
  ReviewQueueItem,
} from "@shellty/api-contracts";

import { moderateText } from "../ai/ai-provider";
import {
  TRANSLATION_AI_PROVIDER,
  type TranslationAi,
} from "../ai/ai-translation";
import { PrismaService } from "../core/prisma.service";
import {
  LearningContext,
  invalid,
  isRecord,
  notFound,
  parseLanguage,
  parseLocale,
  requireField,
  toReviewQueueItem,
} from "./learning-support";

@Injectable()
export class DictionaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: LearningContext,
    @Optional()
    @Inject(TRANSLATION_AI_PROVIDER)
    private readonly translator?: TranslationAi | null,
  ) {}

  async dictionary(
    userId: string,
    input: {
      exerciseId?: string;
      selection?: string;
      targetLocale?: string;
    },
  ): Promise<ContextDictionaryResult> {
    const exerciseId = requireField(input.exerciseId, "exerciseId");
    const selection = requireField(input.selection, "selection").slice(0, 500);
    const targetLocale = parseLocale(input.targetLocale);
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        revision: {
          include: {
            lesson: { include: { module: { include: { course: true } } } },
          },
        },
      },
    });
    if (!exercise || exercise.revision.status !== "published")
      throw notFound("DICTIONARY_CONTEXT_NOT_FOUND", "Context not found.");
    const sourceLanguage = parseLanguage(
      exercise.revision.lesson.module.course.language,
    );
    await this.context.userCourse(userId, sourceLanguage);
    const availableText = [
      exercise.prompt,
      ...(Array.isArray(exercise.options)
        ? exercise.options.flatMap((option) =>
            isRecord(option) && typeof option["text"] === "string"
              ? [option["text"]]
              : [],
          )
        : []),
    ].join(" ");
    if (
      !availableText.toLocaleLowerCase().includes(selection.toLocaleLowerCase())
    )
      throw invalid(
        "SELECTION_OUTSIDE_CONTEXT",
        "Selection is not part of this exercise.",
      );
    const vocabulary = await this.prisma.vocabularyEntry.findFirst({
      where: {
        language: sourceLanguage,
        term: { equals: selection, mode: "insensitive" },
      },
    });
    const translation = vocabulary
      ? await this.prisma.translation.findUnique({
          where: {
            entityType_entityId_locale_field: {
              entityType: "vocabulary_entry",
              entityId: vocabulary.id,
              locale: targetLocale,
              field: "definition",
            },
          },
        })
      : selection === exercise.prompt
        ? await this.prisma.translation.findUnique({
            where: {
              entityType_entityId_locale_field: {
                entityType: "exercise",
                entityId: exercise.id,
                locale: targetLocale,
                field: "prompt",
              },
            },
          })
        : null;
    const reviewedMeaning = translation?.value ?? vocabulary?.definition;
    // Reviewed content is authoritative. When none exists, fall back to a live AI
    // translation so any selected word is learnable — flagged `dynamic` so it is
    // never treated as published educational content (docs/engineering-guidelines.md §14).
    const dynamicMeaning = reviewedMeaning
      ? undefined
      : await this.translateDynamically(
          selection,
          sourceLanguage,
          targetLocale,
        );
    const meaning = reviewedMeaning ?? dynamicMeaning;
    if (!meaning)
      throw notFound(
        "DICTIONARY_TRANSLATION_NOT_FOUND",
        "Translation is not available for this selection.",
      );
    return {
      sourceKey: vocabulary
        ? `vocabulary:${vocabulary.id}`
        : `selection:${sourceLanguage}:${selection.toLocaleLowerCase()}`,
      ...(vocabulary ? { vocabularyId: vocabulary.id } : {}),
      sourceLanguage,
      contextExerciseId: exercise.id,
      targetLocale,
      sourceText: selection,
      translation: meaning,
      definition: vocabulary?.definition ?? meaning,
      context: exercise.prompt,
      ...(dynamicMeaning ? { dynamic: true } : {}),
      ...(vocabulary?.transliteration
        ? { transliteration: vocabulary.transliteration }
        : {}),
      ...(vocabulary?.toneMarks ? { toneMarks: vocabulary.toneMarks } : {}),
      speech: {
        source: {
          language: sourceLanguage === "th" ? "th-TH" : "en-GB",
          text: selection,
        },
        translation: {
          language:
            targetLocale === "pl"
              ? "pl-PL"
              : targetLocale === "th"
                ? "th-TH"
                : "en-GB",
          text: meaning,
        },
      },
    };
  }

  async saveDictionaryResult(
    userId: string,
    input: {
      exerciseId?: string;
      selection?: string;
      targetLocale?: string;
    },
  ): Promise<ReviewQueueItem> {
    const dictionary = await this.dictionary(userId, input);
    const userCourse = await this.context.userCourse(
      userId,
      dictionary.sourceLanguage,
    );
    const item = await this.prisma.reviewItem.upsert({
      where: {
        userCourseId_sourceKey: {
          userCourseId: userCourse.id,
          sourceKey: dictionary.sourceKey,
        },
      },
      update: {
        sourceText: dictionary.sourceText,
        translation: dictionary.translation,
        context: dictionary.context,
      },
      create: {
        userCourseId: userCourse.id,
        sourceKey: dictionary.sourceKey,
        sourceText: dictionary.sourceText,
        translation: dictionary.translation,
        context: dictionary.context,
        ...(dictionary.vocabularyId
          ? { vocabularyId: dictionary.vocabularyId }
          : {}),
      },
    });
    await this.context.event(
      userId,
      userCourse.id,
      null,
      "dictionary_item_saved",
      {
        sourceKey: dictionary.sourceKey,
      },
    );
    return toReviewQueueItem(item);
  }

  /**
   * Live AI translation used only when no reviewed entry exists. Moderated and
   * best-effort: any failure returns undefined so the dictionary degrades to
   * "translation not available" instead of surfacing an error.
   */
  private async translateDynamically(
    selection: string,
    sourceLanguage: CourseLanguage,
    targetLocale: InterfaceLocale,
  ): Promise<string | undefined> {
    if (!this.translator) return undefined;
    if (!moderateText(selection).allowed) return undefined;
    try {
      const translation = await this.translator.translate({
        text: selection,
        sourceLanguage,
        targetLocale,
      });
      if (!translation || !moderateText(translation).allowed) return undefined;
      return translation.slice(0, 500);
    } catch (error) {
      this.context.logger.warn(
        {
          event: "dictionary_dynamic_translation_failed",
          sourceLanguage,
          targetLocale,
        },
        "DictionaryService",
      );
      void error;
      return undefined;
    }
  }
}
