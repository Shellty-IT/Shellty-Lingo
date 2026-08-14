import type {
  CourseLanguage,
  ExerciseType,
  InterfaceLocale,
  PlacementQuestion,
  ReviewRating,
} from "@shellty/api-contracts";

import {
  localizeAssessmentQuestion,
  upperEnglishPlacementQuestions,
} from "./advanced-assessment-bank";
import {
  additionalPlacementQuestions,
  localizeAdditionalQuestion,
} from "./placement-bank";

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
    {
      id: "en-grammar-3",
      skill: "grammar",
      prompt: "I ___ never been to Thailand.",
      options: [
        { id: "a", text: "have" },
        { id: "b", text: "has" },
        { id: "c", text: "had" },
      ],
      correct: "a",
    },
    {
      id: "en-vocabulary-3",
      skill: "vocabulary",
      prompt: 'Co znaczy "afford"?',
      options: [
        { id: "a", text: "być w stanie coś kupić / opłacić" },
        { id: "b", text: "unikać czegoś" },
        { id: "c", text: "pożyczać coś od kogoś" },
      ],
      correct: "a",
    },
    {
      id: "en-grammar-4",
      skill: "grammar",
      prompt: "This hotel is ___ than the last one.",
      options: [
        { id: "a", text: "cheap" },
        { id: "b", text: "cheaper" },
        { id: "c", text: "most cheap" },
      ],
      correct: "b",
    },
    {
      id: "en-vocabulary-4",
      skill: "vocabulary",
      prompt: 'Co znaczy "exhausted"?',
      options: [
        { id: "a", text: "bardzo zmęczony" },
        { id: "b", text: "bardzo podekscytowany" },
        { id: "c", text: "zawstydzony" },
      ],
      correct: "a",
    },
    {
      id: "en-grammar-5",
      skill: "grammar",
      prompt: "You ___ see a doctor; that's my advice.",
      options: [
        { id: "a", text: "should" },
        { id: "b", text: "have" },
        { id: "c", text: "are" },
      ],
      correct: "a",
    },
    {
      id: "en-listening-2",
      skill: "listening",
      prompt: 'Wybierz naturalną odpowiedź na pytanie: "How was your flight?"',
      options: [
        { id: "a", text: "It was long, but okay, thanks." },
        { id: "b", text: "Yes, I have." },
        { id: "c", text: "I am flight." },
      ],
      correct: "a",
    },
    {
      id: "en-vocabulary-5",
      skill: "vocabulary",
      prompt: 'Co znaczy "accommodation"?',
      options: [
        { id: "a", text: "miejsce noclegowe" },
        { id: "b", text: "spotkanie / wizyta" },
        { id: "c", text: "podanie / wniosek" },
      ],
      correct: "a",
    },
    {
      id: "en-grammar-6",
      skill: "grammar",
      prompt: "If I ___ more time, I would travel more.",
      options: [
        { id: "a", text: "had" },
        { id: "b", text: "have" },
        { id: "c", text: "has" },
      ],
      correct: "a",
    },
    {
      id: "en-vocabulary-6",
      skill: "vocabulary",
      prompt: 'Co znaczy "reluctant"?',
      options: [
        { id: "a", text: "niechętny" },
        { id: "b", text: "chętny / entuzjastyczny" },
        { id: "c", text: "pewny siebie" },
      ],
      correct: "a",
    },
    {
      id: "en-grammar-7",
      skill: "grammar",
      prompt: "The museum ___ in 1889.",
      options: [
        { id: "a", text: "built" },
        { id: "b", text: "was built" },
        { id: "c", text: "has build" },
      ],
      correct: "b",
    },
    {
      id: "en-listening-3",
      skill: "listening",
      prompt: "Wybierz najbardziej uprzejmy sposób wyrażenia sprzeciwu.",
      options: [
        { id: "a", text: "That's completely wrong." },
        { id: "b", text: "I see your point, but I'm not sure I agree." },
        { id: "c", text: "No way." },
      ],
      correct: "b",
    },
    {
      id: "en-vocabulary-7",
      skill: "vocabulary",
      prompt: 'Co znaczy "itinerary"?',
      options: [
        { id: "a", text: "szczegółowy plan podróży" },
        { id: "b", text: "rodzaj bagażu" },
        { id: "c", text: "paragon z hotelu" },
      ],
      correct: "a",
    },
    {
      id: "en-grammar-8",
      skill: "grammar",
      prompt: "She said she ___ tired.",
      options: [
        { id: "a", text: "is" },
        { id: "b", text: "was" },
        { id: "c", text: "be" },
      ],
      correct: "b",
    },
    {
      id: "en-listening-4",
      skill: "listening",
      prompt: "Który zwrot potwierdza, że rozumiesz czyjś punkt widzenia?",
      options: [
        { id: "a", text: "I hear you." },
        { id: "b", text: "I ear you." },
        { id: "c", text: "I listen you." },
      ],
      correct: "a",
    },
    {
      id: "en-vocabulary-8",
      skill: "vocabulary",
      prompt: 'Co znaczy "postpone"?',
      options: [
        { id: "a", text: "odłożyć na później" },
        { id: "b", text: "odwołać" },
        { id: "c", text: "potwierdzić" },
      ],
      correct: "a",
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
    {
      id: "th-vocabulary-4",
      skill: "vocabulary",
      prompt: 'Co znaczy "อร่อย"?',
      options: [
        { id: "a", text: "pyszne / smaczne" },
        { id: "b", text: "drogie" },
        { id: "c", text: "gorące" },
      ],
      correct: "a",
    },
    {
      id: "th-grammar-2",
      skill: "grammar",
      prompt:
        "Która partykuła pytająca zmienia zdanie twierdzące w pytanie tak/nie?",
      options: [
        { id: "a", text: "ไหม" },
        { id: "b", text: "ครับ" },
        { id: "c", text: "นี่" },
      ],
      correct: "a",
    },
    {
      id: "th-vocabulary-5",
      skill: "vocabulary",
      prompt: 'Co znaczy "ไป"?',
      options: [
        { id: "a", text: "iść / jechać" },
        { id: "b", text: "jeść" },
        { id: "c", text: "spać" },
      ],
      correct: "a",
    },
    {
      id: "th-grammar-3",
      skill: "grammar",
      prompt:
        "Który klasyfikator liczbowy stosuje się przy liczeniu osób (np. „dwóch lekarzy”)?",
      options: [
        { id: "a", text: "คน" },
        { id: "b", text: "ตัว" },
        { id: "c", text: "อัน" },
      ],
      correct: "a",
    },
    {
      id: "th-vocabulary-6",
      skill: "vocabulary",
      prompt: 'Co znaczy "แพง"?',
      options: [
        { id: "a", text: "drogie" },
        { id: "b", text: "tanie" },
        { id: "c", text: "ciężkie" },
      ],
      correct: "a",
    },
    {
      id: "th-listening-2",
      skill: "listening",
      prompt: "Który zapis oznacza liczbę dwa?",
      options: [
        { id: "a", text: "สอง" },
        { id: "b", text: "สาม" },
        { id: "c", text: "สี่" },
      ],
      correct: "a",
    },
    {
      id: "th-vocabulary-7",
      skill: "vocabulary",
      prompt: 'Co znaczy "สวย"?',
      options: [
        { id: "a", text: "piękne / ładne" },
        { id: "b", text: "brzydkie" },
        { id: "c", text: "małe" },
      ],
      correct: "a",
    },
    {
      id: "th-grammar-4",
      skill: "grammar",
      prompt:
        "Żywa sylaba ze spółgłoską klasy wysokiej i bez znaku tonu zwykle ma ton:",
      options: [
        { id: "a", text: "wznoszący (rising)" },
        { id: "b", text: "niski (low)" },
        { id: "c", text: "wysoki (high)" },
      ],
      correct: "a",
    },
    {
      id: "th-vocabulary-8",
      skill: "vocabulary",
      prompt: 'Co znaczy "ขอโทษ"?',
      options: [
        { id: "a", text: "przepraszam" },
        { id: "b", text: "proszę" },
        { id: "c", text: "do zobaczenia" },
      ],
      correct: "a",
    },
    {
      id: "th-grammar-5",
      skill: "grammar",
      prompt: "Standardowy szyk zdania w języku tajskim to:",
      options: [
        { id: "a", text: "podmiot–orzeczenie–dopełnienie (SVO)" },
        { id: "b", text: "podmiot–dopełnienie–orzeczenie (SOV)" },
        { id: "c", text: "orzeczenie–podmiot–dopełnienie (VSO)" },
      ],
      correct: "a",
    },
    {
      id: "th-listening-3",
      skill: "listening",
      prompt: "Który zwrot uprzejmie oznacza „przepraszam, że przeszkadzam”?",
      options: [
        { id: "a", text: "ขอโทษที่รบกวนนะครับ/คะ" },
        { id: "b", text: "ไปให้พ้น" },
        { id: "c", text: "เงียบเลย" },
      ],
      correct: "a",
    },
    {
      id: "th-vocabulary-9",
      skill: "vocabulary",
      prompt: 'Co znaczy "เข้าใจ"?',
      options: [
        { id: "a", text: "rozumieć" },
        { id: "b", text: "zapomnieć" },
        { id: "c", text: "wątpić" },
      ],
      correct: "a",
    },
    {
      id: "th-grammar-6",
      skill: "grammar",
      prompt: "Kobieta zadająca uprzejme pytanie zakończy je partykułą:",
      options: [
        { id: "a", text: "คะ" },
        { id: "b", text: "ครับ" },
        { id: "c", text: "ค่ะ" },
      ],
      correct: "a",
    },
    {
      id: "th-listening-4",
      skill: "listening",
      prompt: 'Który zwrot oznacza "nie rozumiem"?',
      options: [
        { id: "a", text: "ไม่เข้าใจ" },
        { id: "b", text: "เข้าใจแล้ว" },
        { id: "c", text: "ไม่เป็นไร" },
      ],
      correct: "a",
    },
    {
      id: "th-vocabulary-10",
      skill: "vocabulary",
      prompt: 'Co znaczy "ช่วย"?',
      options: [
        { id: "a", text: "pomóc" },
        { id: "b", text: "kupić" },
        { id: "c", text: "czekać" },
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
      {
        prompt: "I ___ never been to Thailand.",
        options: ["have", "has", "had"],
      },
      {
        prompt: 'What does "afford" mean?',
        options: [
          "to be able to pay for something",
          "to avoid something",
          "to borrow something from someone",
        ],
      },
      {
        prompt: "This hotel is ___ than the last one.",
        options: ["cheap", "cheaper", "most cheap"],
      },
      {
        prompt: 'What does "exhausted" mean?',
        options: ["very tired", "very excited", "embarrassed"],
      },
      {
        prompt: "You ___ see a doctor; that's my advice.",
        options: ["should", "have", "are"],
      },
      {
        prompt: 'Choose the natural reply to: "How was your flight?"',
        options: [
          "It was long, but okay, thanks.",
          "Yes, I have.",
          "I am flight.",
        ],
      },
      {
        prompt: 'What does "accommodation" mean?',
        options: [
          "a place to stay",
          "a meeting or visit",
          "an application or request",
        ],
      },
      {
        prompt: "If I ___ more time, I would travel more.",
        options: ["had", "have", "has"],
      },
      {
        prompt: 'What does "reluctant" mean?',
        options: ["unwilling", "eager", "confident"],
      },
      {
        prompt: "The museum ___ in 1889.",
        options: ["built", "was built", "has build"],
      },
      {
        prompt: "Choose the most polite way to disagree.",
        options: [
          "That's completely wrong.",
          "I see your point, but I'm not sure I agree.",
          "No way.",
        ],
      },
      {
        prompt: 'What does "itinerary" mean?',
        options: [
          "a detailed travel plan",
          "a type of luggage",
          "a hotel receipt",
        ],
      },
      {
        prompt: "She said she ___ tired.",
        options: ["is", "was", "be"],
      },
      {
        prompt:
          "Which phrase acknowledges that you understand someone's point?",
        options: ["I hear you.", "I ear you.", "I listen you."],
      },
      {
        prompt: 'What does "postpone" mean?',
        options: ["to delay until later", "to cancel", "to confirm"],
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
      {
        prompt: "เติมคำ: I ___ never been to Thailand.",
        options: ["have", "has", "had"],
      },
      {
        prompt: 'คำว่า "afford" หมายความว่าอย่างไร?',
        options: [
          "สามารถจ่ายเงินซื้อได้",
          "หลีกเลี่ยงบางสิ่ง",
          "ยืมบางสิ่งจากใครบางคน",
        ],
      },
      {
        prompt: "เติมคำ: This hotel is ___ than the last one.",
        options: ["cheap", "cheaper", "most cheap"],
      },
      {
        prompt: 'คำว่า "exhausted" หมายความว่าอย่างไร?',
        options: ["เหนื่อยมาก", "ตื่นเต้นมาก", "อับอาย"],
      },
      {
        prompt: "เติมคำแนะนำ: You ___ see a doctor; that's my advice.",
        options: ["should", "have", "are"],
      },
      {
        prompt: 'เลือกคำตอบที่เป็นธรรมชาติสำหรับ: "How was your flight?"',
        options: [
          "It was long, but okay, thanks.",
          "Yes, I have.",
          "I am flight.",
        ],
      },
      {
        prompt: 'คำว่า "accommodation" หมายความว่าอย่างไร?',
        options: ["ที่พัก", "การนัดพบ", "ใบสมัคร/คำร้อง"],
      },
      {
        prompt: "เติมคำ: If I ___ more time, I would travel more.",
        options: ["had", "have", "has"],
      },
      {
        prompt: 'คำว่า "reluctant" หมายความว่าอย่างไร?',
        options: ["ไม่เต็มใจ", "กระตือรือร้น", "มั่นใจ"],
      },
      {
        prompt: "เติมคำ: The museum ___ in 1889.",
        options: ["built", "was built", "has build"],
      },
      {
        prompt: "เลือกวิธีที่สุภาพที่สุดในการไม่เห็นด้วย",
        options: [
          "That's completely wrong.",
          "I see your point, but I'm not sure I agree.",
          "No way.",
        ],
      },
      {
        prompt: 'คำว่า "itinerary" หมายความว่าอย่างไร?',
        options: [
          "แผนการเดินทางโดยละเอียด",
          "กระเป๋าเดินทางชนิดหนึ่ง",
          "ใบเสร็จโรงแรม",
        ],
      },
      {
        prompt: "เติมคำ: She said she ___ tired.",
        options: ["is", "was", "be"],
      },
      {
        prompt: "วลีใดใช้แสดงว่าคุณเข้าใจมุมมองของอีกฝ่าย?",
        options: ["I hear you.", "I ear you.", "I listen you."],
      },
      {
        prompt: 'คำว่า "postpone" หมายความว่าอย่างไร?',
        options: ["เลื่อนออกไป", "ยกเลิก", "ยืนยัน"],
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
      {
        prompt: 'What does "อร่อย" mean?',
        options: ["delicious", "expensive", "hot"],
      },
      {
        prompt: "Which particle turns a Thai statement into a yes/no question?",
        options: ["ไหม", "ครับ", "นี่"],
      },
      {
        prompt: 'What does "ไป" mean?',
        options: ["to go", "to eat", "to sleep"],
      },
      {
        prompt: "Which classifier word is used when counting people?",
        options: ["คน", "ตัว", "อัน"],
      },
      {
        prompt: 'What does "แพง" mean?',
        options: ["expensive", "cheap", "heavy"],
      },
      {
        prompt: "Which word means two?",
        options: ["สอง", "สาม", "สี่"],
      },
      {
        prompt: 'What does "สวย" mean?',
        options: ["beautiful", "ugly", "small"],
      },
      {
        prompt:
          "A live syllable with a high-class consonant and no tone mark usually takes which tone?",
        options: ["rising", "low", "high"],
      },
      {
        prompt: 'What does "ขอโทษ" mean?',
        options: ["sorry / excuse me", "please", "see you later"],
      },
      {
        prompt: "What is the standard word order in Thai?",
        options: [
          "Subject-Verb-Object",
          "Subject-Object-Verb",
          "Verb-Subject-Object",
        ],
      },
      {
        prompt: 'Which phrase politely means "sorry to bother you"?',
        options: ["ขอโทษที่รบกวนนะครับ/คะ", "ไปให้พ้น", "เงียบเลย"],
      },
      {
        prompt: 'What does "เข้าใจ" mean?',
        options: ["to understand", "to forget", "to doubt"],
      },
      {
        prompt:
          "Which polite particle ends a question asked by a female speaker?",
        options: ["คะ", "ครับ", "ค่ะ"],
      },
      {
        prompt: 'Which phrase means "I don\'t understand"?',
        options: ["ไม่เข้าใจ", "เข้าใจแล้ว", "ไม่เป็นไร"],
      },
      {
        prompt: 'What does "ช่วย" mean?',
        options: ["to help", "to buy", "to wait"],
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
      {
        prompt: 'คำว่า "อร่อย" แปลว่าอะไร?',
        options: ["รสชาติดี", "ราคาแพง", "อุณหภูมิสูง"],
      },
      {
        prompt: "คำใดใช้เปลี่ยนประโยคบอกเล่าเป็นคำถามใช่/ไม่ใช่?",
        options: ["ไหม", "ครับ", "นี่"],
      },
      {
        prompt: 'คำว่า "ไป" แปลว่าอะไร?',
        options: [
          "เคลื่อนที่จากที่หนึ่งไปอีกที่หนึ่ง",
          "รับประทานอาหาร",
          "การนอนหลับ",
        ],
      },
      {
        prompt: "ลักษณนามใดใช้กับการนับคน?",
        options: ["คน", "ตัว", "อัน"],
      },
      {
        prompt: 'คำว่า "แพง" แปลว่าอะไร?',
        options: ["ราคาสูง", "ราคาต่ำ", "น้ำหนักมาก"],
      },
      {
        prompt: "คำใดหมายถึงเลขสอง?",
        options: ["สอง", "สาม", "สี่"],
      },
      {
        prompt: 'คำว่า "สวย" แปลว่าอะไร?',
        options: ["งดงาม", "น่าเกลียด", "ขนาดเล็ก"],
      },
      {
        prompt:
          "พยางค์เป็นที่มีอักษรสูงและไม่มีวรรณยุกต์ มักมีเสียงวรรณยุกต์ใด?",
        options: ["เสียงจัตวา (rising)", "เสียงเอก (low)", "เสียงตรี (high)"],
      },
      {
        prompt: 'คำว่า "ขอโทษ" แปลว่าอะไร?',
        options: ["การขอประทานอภัย", "การขอร้อง", "การบอกลา"],
      },
      {
        prompt: "โครงสร้างประโยคพื้นฐานของภาษาไทยคือแบบใด?",
        options: [
          "ประธาน-กริยา-กรรม",
          "ประธาน-กรรม-กริยา",
          "กริยา-ประธาน-กรรม",
        ],
      },
      {
        prompt: "วลีใดสุภาพและหมายถึง 'ขอโทษที่รบกวน'?",
        options: ["ขอโทษที่รบกวนนะครับ/คะ", "ไปให้พ้น", "เงียบเลย"],
      },
      {
        prompt: 'คำว่า "เข้าใจ" แปลว่าอะไร?',
        options: ["รู้และเข้าใจความหมาย", "ลืมเลือน", "สงสัยไม่แน่ใจ"],
      },
      {
        prompt: "ผู้หญิงใช้คำลงท้ายสุภาพใดเมื่อถามคำถาม?",
        options: ["คะ", "ครับ", "ค่ะ"],
      },
      {
        prompt: "วลีใดหมายถึง 'ไม่เข้าใจ'?",
        options: ["ไม่เข้าใจ", "เข้าใจแล้ว", "ไม่เป็นไร"],
      },
      {
        prompt: 'คำว่า "ช่วย" แปลว่าอะไร?',
        options: ["ให้ความช่วยเหลือ", "ซื้อของ", "การรอคอย"],
      },
    ],
  },
};

export function questionsFor(
  language: CourseLanguage,
  locale: InterfaceLocale = "pl",
): PlacementQuestion[] {
  return placementQuestionBank(language, locale).map(stripPlacementAnswer);
}

const quotedListeningText = (prompt: string): string | undefined => {
  const matches = [
    ...prompt.matchAll(/"([^"]+)"|“([^”]+)”|'([^']+)'|‘([^’]+)’/g),
  ];
  const last = matches[matches.length - 1];
  return last?.slice(1).find(Boolean);
};

const ensureListeningAudio = (
  question: PlacementQuestionWithAnswer,
): PlacementQuestionWithAnswer => {
  if (question.skill !== "listening" || question.audioText) return question;
  const correctOption = question.options.find(
    (option) => option.id === question.correct,
  );
  return {
    ...question,
    // Older bank items did not carry a separate recording script. A quoted
    // stimulus is preferred; recognition items fall back to the target phrase.
    audioText: quotedListeningText(question.prompt) ?? correctOption?.text,
  };
};

const placementQuestionBank = (
  language: CourseLanguage,
  locale: InterfaceLocale,
): PlacementQuestionWithAnswer[] =>
  [
    ...placementQuestions[language].map((question, index) => {
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
        correct: question.correct,
      };
    }),
    ...additionalPlacementQuestions[language].map((question) =>
      localizeAdditionalQuestion(question, locale),
    ),
    ...(language === "en"
      ? upperEnglishPlacementQuestions.map((question) =>
          localizeAssessmentQuestion(question, locale),
        )
      : []),
  ].map(ensureListeningAudio);

const stripPlacementAnswer = (
  question: PlacementQuestionWithAnswer,
): PlacementQuestion => ({
  id: question.id,
  skill: question.skill,
  prompt: question.prompt,
  options: question.options,
  ...(question.audioText ? { audioText: question.audioText } : {}),
});

const randomFromSeed = (seed: number): (() => number) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
};

const shuffled = <T>(items: T[], random: () => number): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
};

export const PLACEMENT_QUESTION_COUNT = 30;

/**
 * Builds a repeatable, balanced placement form. A new session receives a new
 * seed, while retries and resumes reuse the saved seed and therefore see the
 * exact same questions and option ordering.
 */
export function placementQuestionsFor(
  language: CourseLanguage,
  locale: InterfaceLocale,
  seed: number,
): PlacementQuestion[] {
  const random = randomFromSeed(seed);
  const bank = placementQuestionBank(language, locale);
  const perSkill = PLACEMENT_QUESTION_COUNT / 3;
  const selected = (["vocabulary", "grammar", "listening"] as const).flatMap(
    (skill) => {
      const skillQuestions = bank.filter(
        (question) => question.skill === skill,
      );
      if (language !== "en")
        return shuffled(skillQuestions, random).slice(0, perSkill);
      const upper = skillQuestions.filter((question) =>
        question.id.startsWith("en-b2-"),
      );
      const foundation = skillQuestions.filter(
        (question) => !question.id.startsWith("en-b2-"),
      );
      return [
        ...shuffled(upper, random).slice(0, 4),
        ...shuffled(foundation, random).slice(0, perSkill - 4),
      ];
    },
  );
  return shuffled(selected, random).map((question) => ({
    ...stripPlacementAnswer(question),
    options: shuffled(question.options, random),
  }));
}

export function gradePlacement(
  language: CourseLanguage,
  answers: Array<{ questionId: string; selectedOptionId: string }>,
  questionIds?: string[],
): {
  correct: number;
  total: number;
  score: number;
  level: "A1" | "A2" | "B1" | "B2";
} {
  const bank = placementQuestionBank(language, "pl");
  const selectedIds = questionIds ? new Set(questionIds) : undefined;
  const questions = selectedIds
    ? bank.filter((question) => selectedIds.has(question.id))
    : bank;
  const byId = new Map(answers.map((answer) => [answer.questionId, answer]));
  const correct = questions.filter(
    (question) => byId.get(question.id)?.selectedOptionId === question.correct,
  ).length;
  const score = questions.length
    ? Math.round((correct / questions.length) * 100)
    : 0;
  return {
    correct,
    total: questions.length,
    score,
    level:
      language === "en" && score >= 90
        ? "B2"
        : score >= 67
          ? "B1"
          : score >= 40
            ? "A2"
            : "A1",
  };
}

export const PLACEMENT_RETAKE_AFTER_LESSONS = 10;

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
