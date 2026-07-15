import type {
  CourseLanguage,
  ExerciseType,
  InterfaceLocale,
  PlacementQuestion,
  ReviewRating,
} from "@shellty/api-contracts";

type RecordValue = Record<string, unknown>;
export type GradeResult = {
  correct: boolean;
  score: number;
  expected: unknown;
};

const record = (value: unknown): RecordValue | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as RecordValue)
    : undefined;
const text = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;
const texts = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : undefined;
const normalize = (value: string): string =>
  value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/[.,!?;:'"“”‘’]/g, "")
    .replace(/\s+/g, " ");
const sameSet = (left: string[], right: string[]): boolean =>
  left.length === right.length &&
  [...left].sort().every((value, index) => value === [...right].sort()[index]);

export function gradeExercise(
  type: ExerciseType,
  expectedValue: unknown,
  submittedValue: unknown,
): GradeResult {
  const expected = record(expectedValue);
  if (!expected) return { correct: false, score: 0, expected: null };

  if (type === "single_choice" || type === "listening") {
    const answer = text(expected["correct"]);
    const submitted =
      text(submittedValue) ?? text(record(submittedValue)?.["selected"]);
    const correct = Boolean(answer && submitted === answer);
    return { correct, score: correct ? 1 : 0, expected: answer };
  }

  if (type === "multiple_choice") {
    const answer = texts(expected["correct"]) ?? [];
    const submitted =
      texts(submittedValue) ??
      texts(record(submittedValue)?.["selected"]) ??
      [];
    const correct = sameSet(answer, submitted);
    return { correct, score: correct ? 1 : 0, expected: answer };
  }

  if (type === "ordering") {
    const answer = texts(expected["correct"]) ?? [];
    const submitted =
      texts(submittedValue) ?? texts(record(submittedValue)?.["order"]) ?? [];
    const matched = answer.filter(
      (item, index) => submitted[index] === item,
    ).length;
    const score = answer.length ? matched / answer.length : 0;
    return { correct: score === 1, score, expected: answer };
  }

  if (type === "matching") {
    const answer = record(expected["pairs"]) ?? {};
    const submitted = record(submittedValue)?.["pairs"] ?? submittedValue;
    const pairs = record(submitted) ?? {};
    const entries = Object.entries(answer);
    const matched = entries.filter(
      ([key, value]) => pairs[key] === value,
    ).length;
    const score = entries.length ? matched / entries.length : 0;
    return { correct: score === 1, score, expected: answer };
  }

  const accepted =
    texts(expected["accepted"]) ??
    (text(expected["correct"]) ? [text(expected["correct"])!] : []);
  const submitted =
    text(submittedValue) ?? text(record(submittedValue)?.["text"]) ?? "";
  const correct = accepted.some(
    (candidate) => normalize(candidate) === normalize(submitted),
  );
  return { correct, score: correct ? 1 : 0, expected: accepted };
}

type PlacementQuestionWithAnswer = PlacementQuestion & { correct: string };

const placementQuestions: Record<
  CourseLanguage,
  PlacementQuestionWithAnswer[]
> = {
  en: [
    {
      id: "en-vocabulary-1",
      skill: "vocabulary",
      prompt: 'Wybierz tłumaczenie: "I would like to book a table."',
      options: [
        { id: "a", text: "Chciałbym zarezerwować stolik." },
        { id: "b", text: "Chciałbym zamówić rachunek." },
        { id: "c", text: "Czy mogę prosić o menu?" },
      ],
      correct: "a",
    },
    {
      id: "en-grammar-1",
      skill: "grammar",
      prompt: "She ___ to work every day.",
      options: [
        { id: "a", text: "go" },
        { id: "b", text: "goes" },
        { id: "c", text: "going" },
      ],
      correct: "b",
    },
    {
      id: "en-vocabulary-2",
      skill: "vocabulary",
      prompt: 'Co znaczy "receipt"?',
      options: [
        { id: "a", text: "paragon" },
        { id: "b", text: "rezerwacja" },
        { id: "c", text: "napiwek" },
      ],
      correct: "a",
    },
    {
      id: "en-grammar-2",
      skill: "grammar",
      prompt: "We ___ there yesterday.",
      options: [
        { id: "a", text: "go" },
        { id: "b", text: "gone" },
        { id: "c", text: "went" },
      ],
      correct: "c",
    },
    {
      id: "en-listening-1",
      skill: "listening",
      prompt: "Wybierz naturalną, uprzejmą prośbę.",
      options: [
        { id: "a", text: "Give me water." },
        { id: "b", text: "Could I have some water, please?" },
        { id: "c", text: "I water want." },
      ],
      correct: "b",
    },
  ],
  th: [
    {
      id: "th-vocabulary-1",
      skill: "vocabulary",
      prompt: 'Co znaczy "สวัสดี"?',
      options: [
        { id: "a", text: "do widzenia" },
        { id: "b", text: "dzień dobry" },
        { id: "c", text: "dziękuję" },
      ],
      correct: "b",
    },
    {
      id: "th-vocabulary-2",
      skill: "vocabulary",
      prompt: 'Co znaczy "ขอบคุณ"?',
      options: [
        { id: "a", text: "dziękuję" },
        { id: "b", text: "przepraszam" },
        { id: "c", text: "proszę" },
      ],
      correct: "a",
    },
    {
      id: "th-grammar-1",
      skill: "grammar",
      prompt: "Która partykuła grzecznościowa jest typowa dla mężczyzny?",
      options: [
        { id: "a", text: "ค่ะ" },
        { id: "b", text: "ครับ" },
        { id: "c", text: "ไหม" },
      ],
      correct: "b",
    },
    {
      id: "th-vocabulary-3",
      skill: "vocabulary",
      prompt: 'Wybierz znaczenie "น้ำ".',
      options: [
        { id: "a", text: "jedzenie" },
        { id: "b", text: "kawa" },
        { id: "c", text: "woda" },
      ],
      correct: "c",
    },
    {
      id: "th-listening-1",
      skill: "listening",
      prompt: "Który zapis oznacza liczbę jeden?",
      options: [
        { id: "a", text: "หนึ่ง" },
        { id: "b", text: "สอง" },
        { id: "c", text: "สาม" },
      ],
      correct: "a",
    },
  ],
};

const placementLocalization: Record<
  CourseLanguage,
  Record<
    Exclude<InterfaceLocale, "pl">,
    Array<{ prompt: string; options: string[] }>
  >
> = {
  en: {
    en: [
      {
        prompt: "Which sentence is used to make a table reservation?",
        options: [
          "I would like to book a table.",
          "I would like to ask for the bill.",
          "Could I see the menu?",
        ],
      },
      {
        prompt: "She ___ to work every day.",
        options: ["go", "goes", "going"],
      },
      {
        prompt: "Which word means proof of purchase?",
        options: ["receipt", "reservation", "tip"],
      },
      { prompt: "We ___ there yesterday.", options: ["go", "gone", "went"] },
      {
        prompt: "Choose the natural, polite request.",
        options: [
          "Give me water.",
          "Could I have some water, please?",
          "I water want.",
        ],
      },
    ],
    th: [
      {
        prompt: "ประโยคใดใช้สำหรับจองโต๊ะ?",
        options: [
          "I would like to book a table.",
          "I would like to ask for the bill.",
          "Could I see the menu?",
        ],
      },
      {
        prompt: "เติมคำ: She ___ to work every day.",
        options: ["go", "goes", "going"],
      },
      {
        prompt: "คำใดหมายถึงหลักฐานการซื้อ?",
        options: ["receipt", "reservation", "tip"],
      },
      {
        prompt: "เติมคำ: We ___ there yesterday.",
        options: ["go", "gone", "went"],
      },
      {
        prompt: "เลือกคำขอที่สุภาพและเป็นธรรมชาติ",
        options: [
          "Give me water.",
          "Could I have some water, please?",
          "I water want.",
        ],
      },
    ],
  },
  th: {
    en: [
      {
        prompt: "Which Thai word is a greeting?",
        options: ["ลาก่อน", "สวัสดี", "ขอบคุณ"],
      },
      {
        prompt: "Which Thai word means thank you?",
        options: ["ขอบคุณ", "ขอโทษ", "กรุณา"],
      },
      {
        prompt: "Which polite particle is commonly used by men?",
        options: ["ค่ะ", "ครับ", "ไหม"],
      },
      {
        prompt: "Which Thai word means water?",
        options: ["อาหาร", "กาแฟ", "น้ำ"],
      },
      {
        prompt: "Which Thai word means one?",
        options: ["หนึ่ง", "สอง", "สาม"],
      },
    ],
    th: [
      { prompt: "คำใดเป็นคำทักทาย?", options: ["ลาก่อน", "สวัสดี", "ขอบคุณ"] },
      { prompt: "คำใดใช้กล่าวขอบคุณ?", options: ["ขอบคุณ", "ขอโทษ", "กรุณา"] },
      {
        prompt: "คำลงท้ายสุภาพใดที่ผู้ชายใช้ทั่วไป?",
        options: ["ค่ะ", "ครับ", "ไหม"],
      },
      { prompt: "คำใดหมายถึงน้ำ?", options: ["อาหาร", "กาแฟ", "น้ำ"] },
      { prompt: "คำใดหมายถึงเลขหนึ่ง?", options: ["หนึ่ง", "สอง", "สาม"] },
    ],
  },
};

export function questionsFor(
  language: CourseLanguage,
  locale: InterfaceLocale = "pl",
): PlacementQuestion[] {
  return placementQuestions[language].map((question, index) => {
    const localized =
      locale === "pl"
        ? undefined
        : placementLocalization[language][locale][index];
    return {
      id: question.id,
      skill: question.skill,
      prompt: localized?.prompt ?? question.prompt,
      options: question.options.map((option, optionIndex) => ({
        id: option.id,
        text: localized?.options[optionIndex] ?? option.text,
      })),
    };
  });
}

export function gradePlacement(
  language: CourseLanguage,
  answers: Array<{ questionId: string; selectedOptionId: string }>,
): {
  correct: number;
  total: number;
  score: number;
  level: "A1" | "A2" | "B1";
} {
  const questions = placementQuestions[language];
  const byId = new Map(answers.map((answer) => [answer.questionId, answer]));
  const correct = questions.filter(
    (question) => byId.get(question.id)?.selectedOptionId === question.correct,
  ).length;
  const score = Math.round((correct / questions.length) * 100);
  return {
    correct,
    total: questions.length,
    score,
    level: score >= 80 ? "B1" : score >= 40 ? "A2" : "A1",
  };
}

export type ReviewState = {
  intervalMinutes: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
};

export const SRS_ALGORITHM_VERSION = "srs-v1" as const;

export function scheduleReview(
  state: ReviewState,
  rating: ReviewRating,
  now = new Date(),
): ReviewState & { dueAt: Date } {
  let easeFactor = state.easeFactor;
  let repetitions = state.repetitions;
  let lapses = state.lapses;
  let intervalMinutes: number;

  if (rating === "again") {
    intervalMinutes = 10;
    repetitions = 0;
    lapses += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === "hard") {
    intervalMinutes = Math.max(720, Math.round(state.intervalMinutes * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (rating === "easy") {
    intervalMinutes =
      repetitions === 0
        ? 4 * 1440
        : Math.max(
            4 * 1440,
            Math.round(state.intervalMinutes * easeFactor * 1.3),
          );
    repetitions += 1;
    easeFactor += 0.15;
  } else {
    intervalMinutes =
      repetitions === 0
        ? 1440
        : repetitions === 1
          ? 3 * 1440
          : Math.max(1440, Math.round(state.intervalMinutes * easeFactor));
    repetitions += 1;
  }

  return {
    intervalMinutes,
    easeFactor,
    repetitions,
    lapses,
    dueAt: new Date(now.getTime() + intervalMinutes * 60_000),
  };
}

export function learnerDayKey(
  instant: Date,
  timezoneOffsetMinutes: number,
): string {
  const local = new Date(instant.getTime() + timezoneOffsetMinutes * 60_000);
  return local.toISOString().slice(0, 10);
}
