import type {
  CourseLanguage,
  ExerciseContract,
  InterfaceLocale,
  LearnerExercise,
} from "./index";

type Localized = Record<InterfaceLocale, string>;
type Scenario = {
  key: string;
  language: CourseLanguage;
  goal: Localized;
  reading: string;
  question: Localized;
  replies: [string, string, string];
  gap: string;
  missing: string;
  order: string[];
  correction: {
    before: string;
    fragment: string;
    after: string;
    fixed: string;
  };
  request: Localized;
  accepted: string[];
};
const l = (pl: string, en: string, th: string): Localized => ({ pl, en, th });
const scenarios: Scenario[] = [
  {
    key: "change-meeting",
    language: "en",
    goal: l(
      "Uzgodnisz zmianę terminu spotkania",
      "Agree on a new meeting time",
      "ตกลงเวลาใหม่สำหรับการประชุม",
    ),
    reading: "Alex: I cannot meet at two. Is three o'clock possible?",
    question: l(
      "Którą godzinę proponuje Alex?",
      "What time does Alex suggest?",
      "อเล็กซ์เสนอเวลาใด",
    ),
    replies: ["Three o'clock", "Two o'clock", "Four o'clock"],
    gap: "Could we ___ at three instead?",
    missing: "meet",
    order: ["Three", "works", "for", "me."],
    correction: {
      before: "Could we ",
      fragment: "meets",
      after: " at three?",
      fixed: "meet",
    },
    request: l(
      "Nie możesz o trzeciej. Zaproponuj spotkanie o czwartej.",
      "You cannot meet at three. Suggest meeting at four.",
      "คุณพบกันตอนสามโมงไม่ได้ เสนอพบกันตอนสี่โมง",
    ),
    accepted: [
      "Could we meet at four instead?",
      "Can we meet at four?",
      "Would four o'clock work for you?",
    ],
  },
  {
    key: "order-food",
    language: "en",
    goal: l(
      "Zamówisz posiłek i zapytasz o składnik",
      "Order food and ask about an ingredient",
      "สั่งอาหารและถามเกี่ยวกับส่วนผสม",
    ),
    reading: "Server: The soup contains milk. The salad has no milk.",
    question: l(
      "Które danie nie zawiera mleka?",
      "Which dish has no milk?",
      "อาหารจานใดไม่มีนม",
    ),
    replies: ["The salad", "The soup", "Both dishes"],
    gap: "Does the soup ___ milk?",
    missing: "contain",
    order: ["I", "would", "like", "the salad."],
    correction: {
      before: "I ",
      fragment: "would likes",
      after: " the salad, please.",
      fixed: "would like",
    },
    request: l(
      "Zamów sałatkę i zapytaj, czy zawiera orzechy.",
      "Order a salad and ask whether it contains nuts.",
      "สั่งสลัดและถามว่ามีถั่วหรือไม่",
    ),
    accepted: [
      "I'd like the salad, please. Does it contain nuts?",
      "Can I have the salad? Does it have nuts?",
    ],
  },
  {
    key: "ask-directions",
    language: "en",
    goal: l(
      "Zapytasz o drogę i potwierdzisz wskazówkę",
      "Ask for directions and confirm an instruction",
      "ถามทางและยืนยันคำแนะนำ",
    ),
    reading:
      "Go straight to the bank. Turn left there. The station is on your right.",
    question: l(
      "Gdzie należy skręcić w lewo?",
      "Where should you turn left?",
      "ควรเลี้ยวซ้ายที่ไหน",
    ),
    replies: ["At the bank", "At the station", "At the restaurant"],
    gap: "Excuse me, ___ is the station?",
    missing: "where",
    order: ["Turn", "left", "at", "the bank."],
    correction: {
      before: "Where ",
      fragment: "are",
      after: " the station?",
      fixed: "is",
    },
    request: l(
      "Potwierdź, że masz skręcić w lewo przy banku.",
      "Confirm that you should turn left at the bank.",
      "ยืนยันว่าคุณต้องเลี้ยวซ้ายที่ธนาคาร",
    ),
    accepted: [
      "So I should turn left at the bank?",
      "Do I turn left at the bank?",
    ],
  },
  {
    key: "change-meeting",
    language: "th",
    goal: l(
      "Uzgodnisz zmianę terminu spotkania",
      "Agree on a new meeting time",
      "ตกลงเวลาใหม่สำหรับการประชุม",
    ),
    reading: "พรุ่งนี้ฉันไม่ว่างตอนบ่ายสอง เจอกันตอนบ่ายสามได้ไหม",
    question: l(
      "Którą godzinę proponuje rozmówca?",
      "What time does the speaker suggest?",
      "ผู้พูดเสนอเวลาใด",
    ),
    replies: ["บ่ายสาม", "บ่ายสอง", "บ่ายสี่"],
    gap: "เจอกันตอนบ่ายสามได้___",
    missing: "ไหม",
    order: ["เจอกัน", "ตอน", "บ่ายสาม", "ได้ไหม"],
    correction: {
      before: "เจอกันตอนบ่ายสามได้",
      fragment: "ไม่",
      after: "",
      fixed: "ไหม",
    },
    request: l(
      "Nie możesz o trzeciej. Zaproponuj spotkanie o czwartej.",
      "You cannot meet at three. Suggest meeting at four.",
      "คุณไม่ว่างตอนบ่ายสาม เสนอเจอกันตอนบ่ายสี่",
    ),
    accepted: ["เจอกันตอนบ่ายสี่ได้ไหม", "เปลี่ยนเป็นบ่ายสี่ได้ไหม"],
  },
  {
    key: "order-food",
    language: "th",
    goal: l(
      "Zamówisz posiłek i zapytasz o składnik",
      "Order food and ask about an ingredient",
      "สั่งอาหารและถามเกี่ยวกับส่วนผสม",
    ),
    reading: "ซุปนี้มีนม แต่สลัดไม่มีนม",
    question: l(
      "Które danie nie zawiera mleka?",
      "Which dish has no milk?",
      "อาหารจานใดไม่มีนม",
    ),
    replies: ["สลัด", "ซุป", "ทั้งสองจาน"],
    gap: "สลัดนี้มีถั่ว___ไหม",
    missing: "หรือ",
    order: ["ขอ", "สลัด", "หนึ่งจาน"],
    correction: {
      before: "สลัดนี้มีถั่ว",
      fragment: "หรือไม่ไหม",
      after: "",
      fixed: "หรือไม่",
    },
    request: l(
      "Zamów sałatkę i zapytaj, czy zawiera orzechy.",
      "Order a salad and ask whether it contains nuts.",
      "สั่งสลัดและถามว่ามีถั่วหรือไม่",
    ),
    accepted: [
      "ขอสลัดหนึ่งจาน สลัดนี้มีถั่วไหม",
      "ขอสลัดหนึ่งจาน สลัดมีถั่วหรือไม่",
    ],
  },
  {
    key: "ask-directions",
    language: "th",
    goal: l(
      "Zapytasz o drogę i potwierdzisz wskazówkę",
      "Ask for directions and confirm an instruction",
      "ถามทางและยืนยันคำแนะนำ",
    ),
    reading: "ตรงไปจนถึงธนาคาร แล้วเลี้ยวซ้าย สถานีอยู่ทางขวา",
    question: l(
      "Gdzie należy skręcić w lewo?",
      "Where should you turn left?",
      "ควรเลี้ยวซ้ายที่ไหน",
    ),
    replies: ["ที่ธนาคาร", "ที่สถานี", "ที่ร้านอาหาร"],
    gap: "สถานีอยู่___ไหน",
    missing: "ที่",
    order: ["เลี้ยวซ้าย", "ที่", "ธนาคาร"],
    correction: {
      before: "สถานี",
      fragment: "อยู่ไหนที่",
      after: "",
      fixed: "อยู่ที่ไหน",
    },
    request: l(
      "Potwierdź, że masz skręcić w lewo przy banku.",
      "Confirm that you should turn left at the bank.",
      "ยืนยันว่าต้องเลี้ยวซ้ายที่ธนาคาร",
    ),
    accepted: ["ต้องเลี้ยวซ้ายที่ธนาคารใช่ไหม", "เลี้ยวซ้ายที่ธนาคารใช่ไหม"],
  },
];
export const pilotLessonIds = scenarios.map(
  (item) => `${item.language}-${item.key}`,
);
const instructions = {
  choice: l(
    "Przeczytaj wiadomość i wybierz odpowiedź.",
    "Read the message and choose an answer.",
    "อ่านข้อความและเลือกคำตอบ",
  ),
  gap: l("Wpisz brakujące słowo.", "Write the missing word.", "เติมคำที่หายไป"),
  order: l(
    "Ułóż odpowiedź z fragmentów.",
    "Arrange the parts into an answer.",
    "เรียงส่วนต่าง ๆ ให้เป็นคำตอบ",
  ),
  correction: l(
    "Popraw tylko wyróżniony fragment.",
    "Correct only the highlighted fragment.",
    "แก้ไขเฉพาะส่วนที่เน้น",
  ),
  typed: l(
    "Napisz własną odpowiedź w języku kursu.",
    "Write your own answer in the course language.",
    "เขียนคำตอบของคุณเองในภาษาที่เรียน",
  ),
};

/** Editorial drafts. Exporting or importing this catalogue never approves it. */
export function pilotLesson(id: string, locale: InterfaceLocale) {
  const source = scenarios.find(
    (item) => `${item.language}-${item.key}` === id,
  );
  if (!source) return undefined;
  const skillKey = `pilot-v1.${source.language}.a2.${source.key}`;
  const make = (
    position: number,
    type: ExerciseContract["type"],
    prompt: string,
    instruction: Localized,
    answer: unknown,
    extra: Partial<ExerciseContract> = {},
  ): ExerciseContract => ({
    id: `${id}-${position}`,
    type,
    prompt,
    instructions: instruction[locale],
    instructionsLocale: locale,
    answerLanguage: source.language,
    skillKey,
    learningObjective: source.goal[locale],
    answer,
    ...extra,
  });
  const exercises = [
    make(
      1,
      "single_choice",
      `${source.reading}\n\n${source.question[locale]}`,
      instructions.choice,
      { correct: "a" },
      {
        options: source.replies.map((text, index) => ({
          id: String.fromCharCode(97 + index),
          text,
        })),
      },
    ),
    make(2, "gap_fill", source.gap, instructions.gap, {
      accepted: [source.missing],
    }),
    make(
      3,
      "ordering",
      source.goal[locale],
      instructions.order,
      { correct: source.order.map((_, index) => String(index)) },
      {
        options: source.order.map((text, index) => ({
          id: String(index),
          text,
        })),
      },
    ),
    make(
      4,
      "gap_fill",
      source.goal[locale],
      instructions.correction,
      { accepted: [source.correction.fixed] },
      {
        interaction: {
          kind: "correct_fragment",
          before: source.correction.before,
          fragment: source.correction.fragment,
          after: source.correction.after,
        },
      },
    ),
    make(5, "typed_answer", source.request[locale], instructions.typed, {
      accepted: source.accepted,
    }),
  ];
  return {
    id,
    language: source.language,
    level: "A2",
    status: "draft" as const,
    title: source.goal[locale],
    objective: source.goal[locale],
    exercises,
    retentionProbes: {
      d7: pilotProbe(id, 7, locale),
      d30: pilotProbe(id, 30, locale),
      requiresNewContext: true as const,
    },
  };
}

const probeContexts: Record<
  string,
  [Localized, string[], Localized, string[]]
> = {
  "en-change-meeting": [
    l(
      "Zaproponuj rozmowę telefoniczną o piątej zamiast o drugiej.",
      "Suggest a call at five instead of two.",
      "เสนอคุยโทรศัพท์ตอนห้าโมงแทนสองโมง",
    ),
    [
      "Could we have the call at five instead?",
      "Can we call at five instead of two?",
    ],
    l(
      "Poproś o przełożenie wizyty na dziesiątą rano.",
      "Ask to move an appointment to ten in the morning.",
      "ขอเลื่อนนัดเป็นสิบโมงเช้า",
    ),
    [
      "Could we move the appointment to ten in the morning?",
      "Can we reschedule for ten in the morning?",
    ],
  ],
  "en-order-food": [
    l(
      "Zamów zupę i zapytaj, czy zawiera jajka.",
      "Order soup and ask whether it contains eggs.",
      "สั่งซุปและถามว่ามีไข่หรือไม่",
    ),
    [
      "I'd like the soup, please. Does it contain eggs?",
      "Can I have the soup? Does it have eggs?",
    ],
    l(
      "Zamów ryż i zapytaj, czy jest w nim mleko.",
      "Order rice and ask whether it contains milk.",
      "สั่งข้าวและถามว่ามีนมหรือไม่",
    ),
    [
      "I'd like the rice, please. Does it contain milk?",
      "Can I have the rice? Does it have milk?",
    ],
  ],
  "en-ask-directions": [
    l(
      "Potwierdź, że masz skręcić w prawo przy poczcie.",
      "Confirm that you should turn right at the post office.",
      "ยืนยันว่าต้องเลี้ยวขวาที่ไปรษณีย์",
    ),
    [
      "So I should turn right at the post office?",
      "Do I turn right at the post office?",
    ],
    l(
      "Potwierdź, że masz iść prosto do muzeum.",
      "Confirm that you should go straight to the museum.",
      "ยืนยันว่าต้องตรงไปจนถึงพิพิธภัณฑ์",
    ),
    [
      "So I should go straight to the museum?",
      "Do I go straight to the museum?",
    ],
  ],
  "th-change-meeting": [
    l(
      "Zaproponuj rozmowę o piątej zamiast o drugiej.",
      "Suggest talking at five instead of two.",
      "เสนอคุยกันตอนห้าโมงแทนสองโมง",
    ),
    ["คุยกันตอนห้าโมงแทนได้ไหม", "เปลี่ยนเป็นห้าโมงได้ไหม"],
    l(
      "Poproś o przełożenie wizyty na dziesiątą rano.",
      "Ask to move an appointment to ten in the morning.",
      "ขอเลื่อนนัดเป็นสิบโมงเช้า",
    ),
    ["เลื่อนนัดเป็นสิบโมงเช้าได้ไหม", "เปลี่ยนเวลานัดเป็นสิบโมงเช้าได้ไหม"],
  ],
  "th-order-food": [
    l(
      "Zamów zupę i zapytaj, czy zawiera jajka.",
      "Order soup and ask whether it contains eggs.",
      "สั่งซุปและถามว่ามีไข่หรือไม่",
    ),
    ["ขอซุปหนึ่งถ้วย ซุปนี้มีไข่ไหม", "ขอซุปหนึ่งถ้วย ซุปมีไข่หรือไม่"],
    l(
      "Zamów ryż i zapytaj, czy jest w nim mleko.",
      "Order rice and ask whether it contains milk.",
      "สั่งข้าวและถามว่ามีนมหรือไม่",
    ),
    ["ขอข้าวหนึ่งจาน ข้าวนี้มีนมไหม", "ขอข้าวหนึ่งจาน ข้าวนี้มีนมหรือไม่"],
  ],
  "th-ask-directions": [
    l(
      "Potwierdź, że masz skręcić w prawo przy poczcie.",
      "Confirm that you should turn right at the post office.",
      "ยืนยันว่าต้องเลี้ยวขวาที่ไปรษณีย์",
    ),
    ["ต้องเลี้ยวขวาที่ไปรษณีย์ใช่ไหม", "เลี้ยวขวาที่ไปรษณีย์ใช่ไหม"],
    l(
      "Potwierdź, że masz iść prosto do muzeum.",
      "Confirm that you should go straight to the museum.",
      "ยืนยันว่าต้องตรงไปจนถึงพิพิธภัณฑ์",
    ),
    ["ต้องตรงไปจนถึงพิพิธภัณฑ์ใช่ไหม", "ตรงไปจนถึงพิพิธภัณฑ์ใช่ไหม"],
  ],
};

/** New contexts require the same human language and difficulty review as lessons. */
export function pilotProbe(id: string, days: 7 | 30, locale: InterfaceLocale) {
  const source = scenarios.find(
    (item) => `${item.language}-${item.key}` === id,
  );
  const contexts = probeContexts[id];
  if (!source || !contexts) return undefined;
  const prompt = contexts[days === 7 ? 0 : 2];
  const accepted = contexts[days === 7 ? 1 : 3];
  return {
    id: `${id}-d${days}`,
    language: source.language,
    level: "A2",
    status: "draft" as const,
    title: source.goal[locale],
    objective: source.goal[locale],
    days,
    exercises: [
      {
        id: `${id}-probe-${days}`,
        type: "typed_answer" as const,
        prompt: prompt[locale],
        instructions: instructions.typed[locale],
        instructionsLocale: locale,
        answerLanguage: source.language,
        skillKey: `pilot-v1.${source.language}.a2.${source.key}`,
        learningObjective: source.goal[locale],
        answer: { accepted },
      },
    ],
  };
}

export function pilotPreview(id: string, locale: InterfaceLocale) {
  const lesson = pilotLesson(id, locale);
  if (!lesson) return undefined;
  return {
    id: lesson.id,
    language: lesson.language,
    level: lesson.level,
    status: lesson.status,
    title: lesson.title,
    objective: lesson.objective,
    exercises: lesson.exercises.map((exercise, index): LearnerExercise => {
      const preview: Partial<ExerciseContract> = { ...exercise };
      delete preview.answer;
      delete preview.explanation;
      return { ...preview, position: index + 1 } as LearnerExercise;
    }),
  };
}
