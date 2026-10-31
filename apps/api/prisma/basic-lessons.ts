import type { TrackExercise } from "./learning-tracks";
import { choiceExplanation } from "../src/content/choice-explanations";
type LocalizedText = Record<"pl" | "en" | "th", string>;

type SimpleExercise = Partial<TrackExercise> & {
  prompt: LocalizedText;
  options?: { id: string; text: string }[];
  correct?: string;
  answer?: unknown;
  explanation?: string | LocalizedText;
  usageTip?: LocalizedText;
};

type SimpleLesson = {
  slug: string;
  position: number;
  title: LocalizedText;
  summary: string;
  estimatedMinutes?: number;
  exercises: SimpleExercise[];
  vocabulary?: Array<{
    term: string;
    definition: string;
    translations: LocalizedText;
  }>;
};

export type SimpleModule = {
  slug: string;
  title: string;
  position: number;
  lessons: SimpleLesson[];
};

const correctOption = (exercise: SimpleExercise) => {
  const answer =
    typeof exercise.answer === "object" && exercise.answer !== null
      ? (exercise.answer as Record<string, unknown>)["correct"]
      : exercise.correct;
  const id = typeof answer === "string" ? answer : (exercise.correct ?? "a");
  return exercise.options?.find((option) => option.id === id);
};

const withFourOptions = (
  exercise: SimpleExercise,
  candidates: Array<{ id: string; text: string }>,
): SimpleExercise => {
  const existing = exercise.options ?? [];
  if (existing.length >= 4) return exercise;
  const texts = new Set(existing.map((option) => option.text));
  const additions = candidates
    .filter((option) => !texts.has(option.text))
    .slice(0, 4 - existing.length)
    .map((option, index) => ({
      id: String.fromCharCode(97 + existing.length + index),
      text: option.text,
    }));
  return { ...exercise, options: [...existing, ...additions] };
};

/**
 * Early sample lessons contained two almost identical choice questions. Keep
 * their subject matter, but turn every short lesson into a six-activity loop
 * so seeded A1 content exercises recognition, listening, recall and syntax.
 */
export const expandExercises = (
  lesson: SimpleLesson,
  language: "en" | "th",
): SimpleExercise[] => {
  if (lesson.exercises.length >= 6) return lesson.exercises;
  const first = lesson.exercises[0];
  const second = lesson.exercises[1] ?? first;
  if (!first || !second) return lesson.exercises;
  const firstCorrect = correctOption(first)?.text;
  const secondCorrect = correctOption(second)?.text;
  if (!firstCorrect || !secondCorrect) return lesson.exercises;
  const selected = [
    { id: "a", text: firstCorrect },
    { id: "b", text: secondCorrect },
    ...(first.options ?? [])
      .filter((option) => option.text !== firstCorrect)
      .slice(0, 1)
      .map((option) => ({ id: "c", text: option.text })),
    ...(second.options ?? [])
      .filter((option) => option.text !== secondCorrect)
      .slice(0, 1)
      .map((option) => ({ id: "d", text: option.text })),
  ];
  // Keep each answer attached to its source question. A symbol or phrase can
  // be correct in one context and wrong in the other (e.g. Thai vowel length).
  const contextualChoices = selected.map((option) => ({
    ...option,
    text: `[${option.id === "a" || option.id === "c" ? 1 : 2}] ${option.text}`,
  }));
  const words = secondCorrect.split(/\s+/).filter(Boolean);
  const missing =
    firstCorrect
      .split(/\s+/)
      .map((word) => word.replace(/[^\p{L}'-]/gu, ""))
      .find((word) => word.length >= 3) ?? firstCorrect;
  const gap = firstCorrect.replace(missing, "___");
  const targetName = language === "en" ? "angielsku" : "tajsku";
  const optionPool = [
    ...(first.options ?? []),
    ...(second.options ?? []),
    ...(language === "en"
      ? [
          { id: "fallback-1", text: "None of the other answers." },
          { id: "fallback-2", text: "This does not fit the situation." },
        ]
      : [
          { id: "fallback-1", text: "ไม่มีคำตอบอื่นที่ถูกต้อง" },
          { id: "fallback-2", text: "คำตอบนี้ไม่เข้ากับสถานการณ์" },
        ]),
  ];
  const finalExercise: SimpleExercise =
    words.length >= 4
      ? {
          type: "ordering",
          prompt: {
            pl: "Ułóż elementy w naturalnej kolejności.",
            en: "Put the parts in a natural order.",
            th: "เรียงส่วนประกอบให้ถูกต้อง",
          },
          instructions: "Tap the parts in sentence order.",
          options: words.map((text, index) => ({ id: `w${index + 1}`, text })),
          answer: { correct: words.map((_, index) => `w${index + 1}`) },
          explanation: {
            pl: `Poprawna kolejność tworzy zdanie "${secondCorrect}".`,
            en: `The correct order is "${secondCorrect}".`,
            th: `ลำดับที่ถูกต้องคือ "${secondCorrect}"`,
          },
        }
      : {
          ...withFourOptions(second, optionPool),
          type: "single_choice",
          answer: { correct: correctOption(second)?.id ?? "a" },
        };
  return [
    { ...withFourOptions(first, optionPool), type: "single_choice" },
    { ...withFourOptions(second, optionPool), type: "listening" },
    {
      type: "multiple_choice",
      prompt: {
        pl: `Wybierz po jednej poprawnej odpowiedzi do każdego pytania. Numery przy odpowiedziach wskazują pytanie.\n\n[1] ${first.prompt.pl}\n[2] ${second.prompt.pl}`,
        en: `Choose one correct answer for each question. Answer numbers identify the question.\n\n[1] ${first.prompt.en}\n[2] ${second.prompt.en}`,
        th: `เลือกคำตอบที่ถูกต้องหนึ่งข้อสำหรับแต่ละคำถาม หมายเลขคำตอบระบุคำถาม\n\n[1] ${first.prompt.th}\n[2] ${second.prompt.th}`,
      },
      instructions: "Choose all correct answers.",
      options: contextualChoices,
      answer: { correct: ["a", "b"] },
      explanation: Object.fromEntries(
        (["pl", "en", "th"] as const).map((locale) => {
          const explanation = choiceExplanation(locale, contextualChoices, [
            "a",
            "b",
          ]);
          if (!explanation)
            throw new Error(
              `Missing choice explanation: ${lesson.slug}/${locale}`,
            );
          return [locale, explanation];
        }),
      ) as LocalizedText,
    },
    {
      type: "gap_fill",
      prompt: {
        pl: `Uzupełnij zdanie w języku nauki: ${gap}`,
        en: `Complete the sentence: ${gap}`,
        th: `เติมคำในประโยค: ${gap}`,
      },
      instructions: "Type the missing word.",
      answer: { accepted: [missing] },
      explanation: {
        pl: `Brakujące słowo to "${missing}".`,
        en: `The missing word is "${missing}".`,
        th: `คำที่หายไปคือ "${missing}"`,
      },
    },
    {
      type: "typed_answer",
      prompt: {
        pl: `Napisz po ${targetName} poprawną odpowiedź na sytuację: ${first.prompt.pl}`,
        en: `Write the complete answer to: ${first.prompt.en}`,
        th: `เขียนคำตอบเต็มสำหรับ: ${first.prompt.th}`,
      },
      instructions:
        "Write the complete answer in the language you are learning.",
      answer: { accepted: [firstCorrect] },
      explanation: {
        pl: `Przykładowa odpowiedź to "${firstCorrect}".`,
        en: `A model answer is "${firstCorrect}".`,
        th: `ตัวอย่างคำตอบคือ "${firstCorrect}"`,
      },
    },
    finalExercise,
  ];
};

export const englishExtraModules: SimpleModule[] = [
  {
    slug: "restaurant-basics",
    title: "At a restaurant",
    position: 1,
    lessons: [
      {
        slug: "ordering-food",
        position: 2,
        title: {
          en: "Ordering food and drinks",
          pl: "Zamawianie jedzenia i napojów",
          th: "การสั่งอาหารและเครื่องดื่ม",
        },
        summary: "Order a meal and a drink naturally.",
        exercises: [
          {
            prompt: {
              en: "Choose the natural way to order a coffee.",
              pl: "Wybierz naturalny sposób zamówienia kawy.",
              th: "เลือกวิธีที่เป็นธรรมชาติในการสั่งกาแฟ",
            },
            options: [
              { id: "a", text: "I'll have a coffee, please." },
              { id: "b", text: "Give coffee me." },
            ],
            correct: "a",
            explanation:
              '"I\'ll have..." is the standard way to order in English.',
          },
          {
            prompt: {
              en: "Which question does a waiter typically ask?",
              pl: "Jakie pytanie zwykle zadaje kelner?",
              th: "พนักงานเสิร์ฟมักถามคำถามใด",
            },
            options: [
              { id: "a", text: "What would you like to drink?" },
              { id: "b", text: "What you want drink?" },
            ],
            correct: "a",
            explanation: "Waiters use full, polite questions.",
          },
        ],
      },
      {
        slug: "asking-for-bill",
        position: 3,
        title: {
          en: "Asking for the bill",
          pl: "Prośba o rachunek",
          th: "การขอเช็คบิล",
        },
        summary: "Ask to pay and understand the reply.",
        exercises: [
          {
            prompt: {
              en: "Choose the polite way to ask for the bill.",
              pl: "Wybierz uprzejmy sposób poproszenia o rachunek.",
              th: "เลือกวิธีสุภาพในการขอเช็คบิล",
            },
            options: [
              { id: "a", text: "Could we have the bill, please?" },
              { id: "b", text: "Give bill now." },
            ],
            correct: "a",
            explanation: '"Could we have..." is a polite request form.',
          },
          {
            prompt: {
              en: 'What does the waiter mean by "Certainly, one moment"?',
              pl: 'Co oznacza odpowiedź kelnera "Certainly, one moment"?',
              th: 'คำตอบของพนักงานเสิร์ฟ "Certainly, one moment" หมายความว่าอย่างไร',
            },
            options: [
              { id: "a", text: "They will bring it soon." },
              { id: "b", text: "They refuse to bring it." },
            ],
            correct: "a",
            explanation: {
              pl: '"Certainly" potwierdza zgodę, a "one moment" oznacza "chwileczkę".',
              en: '"Certainly" confirms agreement, and "one moment" means shortly.',
              th: '"Certainly" เป็นการยืนยัน และ "one moment" หมายถึงรอสักครู่',
            },
            usageTip: {
              pl: "Użyj „Certainly” jako uprzejmego potwierdzenia prośby, a „one moment” dodaj, gdy prosisz rozmówcę o chwilę cierpliwości.",
              en: "Use “Certainly” to confirm a request politely and add “one moment” when asking someone to wait briefly.",
              th: "ใช้ “Certainly” เพื่อตอบรับคำขออย่างสุภาพ และเติม “one moment” เมื่อต้องการให้อีกฝ่ายรอสักครู่",
            },
          },
        ],
      },
      {
        slug: "dietary-needs",
        position: 4,
        title: {
          en: "Talking about dietary needs",
          pl: "Rozmowa o potrzebach żywieniowych",
          th: "การพูดถึงข้อจำกัดด้านอาหาร",
        },
        summary: "Explain allergies and preferences.",
        exercises: [
          {
            prompt: {
              en: "Choose the correct sentence for a nut allergy.",
              pl: "Wybierz poprawne zdanie o alergii na orzechy.",
              th: "เลือกประโยคที่ถูกต้องเกี่ยวกับการแพ้ถั่ว",
            },
            options: [
              { id: "a", text: "I'm allergic to nuts." },
              { id: "b", text: "I nuts allergic." },
            ],
            correct: "a",
            explanation: '"I\'m allergic to..." is the correct structure.',
          },
          {
            prompt: {
              en: "Which phrase asks if a dish contains meat?",
              pl: "Które zdanie pyta, czy danie zawiera mięso?",
              th: "ประโยคใดถามว่าจานนี้มีเนื้อสัตว์หรือไม่",
            },
            options: [
              { id: "a", text: "Does this dish contain meat?" },
              { id: "b", text: "This meat dish contain?" },
            ],
            correct: "a",
            explanation: 'Questions with "does" need the base verb form.',
          },
        ],
      },
    ],
  },
  {
    slug: "everyday-greetings",
    title: "Everyday greetings",
    position: 2,
    lessons: [
      {
        slug: "introducing-yourself",
        position: 1,
        title: {
          en: "Introducing yourself",
          pl: "Przedstawianie się",
          th: "การแนะนำตัวเอง",
        },
        summary: "Say your name and where you're from.",
        exercises: [
          {
            prompt: {
              en: "Choose the natural introduction.",
              pl: "Wybierz naturalne przedstawienie się.",
              th: "เลือกการแนะนำตัวที่เป็นธรรมชาติ",
            },
            options: [
              { id: "a", text: "Hi, I'm Anna. Nice to meet you." },
              { id: "b", text: "Hi, me Anna, meet nice." },
            ],
            correct: "a",
            explanation:
              "This is the standard, natural way to introduce yourself.",
          },
          {
            prompt: {
              en: "How do you ask someone's name politely?",
              pl: "Jak grzecznie zapytać kogoś o imię?",
              th: "จะถามชื่อคนอื่นอย่างสุภาพได้อย่างไร",
            },
            options: [
              { id: "a", text: "What's your name?" },
              { id: "b", text: "You name what?" },
            ],
            correct: "a",
            explanation:
              '"What\'s your name?" is the standard polite question.',
          },
        ],
      },
      {
        slug: "small-talk",
        position: 2,
        title: {
          en: "Making small talk",
          pl: "Prowadzenie small talku",
          th: "การพูดคุยทั่วไป",
        },
        summary: "Chat about the weather and your day.",
        exercises: [
          {
            prompt: {
              en: "Choose a natural small-talk opener.",
              pl: "Wybierz naturalne otwarcie rozmowy.",
              th: "เลือกประโยคเปิดบทสนทนาที่เป็นธรรมชาติ",
            },
            options: [
              { id: "a", text: "Nice weather today, isn't it?" },
              { id: "b", text: "Weather nice today is?" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: 'Choose the natural reply to "How\'s it going?"',
              pl: 'Wybierz naturalną odpowiedź na "How\'s it going?"',
              th: 'เลือกคำตอบที่เป็นธรรมชาติสำหรับ "How\'s it going?"',
            },
            options: [
              { id: "a", text: "Pretty good, thanks. You?" },
              { id: "b", text: "Going pretty good you." },
            ],
            correct: "a",
          },
        ],
      },
      {
        slug: "asking-directions",
        position: 3,
        title: {
          en: "Asking for directions",
          pl: "Pytanie o drogę",
          th: "การถามทาง",
        },
        summary: "Ask how to get somewhere and understand the answer.",
        exercises: [
          {
            prompt: {
              en: "Choose the polite way to ask for directions.",
              pl: "Wybierz uprzejmy sposób zapytania o drogę.",
              th: "เลือกวิธีสุภาพในการถามทาง",
            },
            options: [
              { id: "a", text: "Excuse me, how do I get to the station?" },
              { id: "b", text: "Station where go?" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: 'What does "It\'s just around the corner" mean?',
              pl: 'Co oznacza "It\'s just around the corner"?',
              th: '"It\'s just around the corner" หมายความว่าอย่างไร',
            },
            options: [
              { id: "a", text: "It's very close." },
              { id: "b", text: "It's far away." },
            ],
            correct: "a",
          },
        ],
      },
      {
        slug: "telling-time",
        position: 4,
        title: {
          en: "Telling the time",
          pl: "Podawanie godziny",
          th: "การบอกเวลา",
        },
        summary: "Ask and say what time it is.",
        exercises: [
          {
            prompt: {
              en: "Choose the correct way to say 3:30.",
              pl: "Wybierz poprawny sposób powiedzenia godziny 3:30.",
              th: "เลือกวิธีบอกเวลา 3:30 ที่ถูกต้อง",
            },
            options: [
              { id: "a", text: "It's half past three." },
              { id: "b", text: "It's three half." },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: "How do you ask what time it is?",
              pl: "Jak zapytać, która jest godzina?",
              th: "จะถามว่ากี่โมงแล้วได้อย่างไร",
            },
            options: [
              { id: "a", text: "What time is it?" },
              { id: "b", text: "Time what is?" },
            ],
            correct: "a",
          },
        ],
      },
    ],
  },
  {
    slug: "daily-routines",
    title: "Daily routines",
    position: 3,
    lessons: [
      {
        slug: "describing-your-day",
        position: 1,
        title: {
          en: "Describing your day",
          pl: "Opisywanie swojego dnia",
          th: "การอธิบายวันของคุณ",
        },
        summary: "Talk about your daily routine.",
        exercises: [
          {
            prompt: {
              en: "Choose the correct sentence about a routine.",
              pl: "Wybierz poprawne zdanie o rutynie dnia.",
              th: "เลือกประโยคที่ถูกต้องเกี่ยวกับกิจวัตร",
            },
            options: [
              { id: "a", text: "I wake up at seven every day." },
              { id: "b", text: "I wake seven every up day." },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: 'Which word fits: "I usually ___ breakfast at eight."',
              pl: 'Które słowo pasuje: "I usually ___ breakfast at eight."',
              th: 'คำใดเติมได้ถูกต้อง: "I usually ___ breakfast at eight."',
            },
            options: [
              { id: "a", text: "have" },
              { id: "b", text: "having" },
            ],
            correct: "a",
          },
        ],
      },
      {
        slug: "shopping-basics",
        position: 2,
        title: {
          en: "Shopping basics",
          pl: "Podstawy zakupów",
          th: "พื้นฐานการช้อปปิ้ง",
        },
        summary: "Ask for prices and pay for items.",
        exercises: [
          {
            prompt: {
              en: "Choose the natural way to ask a price.",
              pl: "Wybierz naturalny sposób zapytania o cenę.",
              th: "เลือกวิธีถามราคาที่เป็นธรรมชาติ",
            },
            options: [
              { id: "a", text: "How much is this?" },
              { id: "b", text: "This how much?" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: 'Choose the correct reply to "Cash or card?"',
              pl: 'Wybierz poprawną odpowiedź na "Cash or card?"',
              th: 'เลือกคำตอบที่ถูกต้องสำหรับ "Cash or card?"',
            },
            options: [
              { id: "a", text: "Card, please." },
              { id: "b", text: "Please card." },
            ],
            correct: "a",
          },
        ],
      },
      {
        slug: "making-plans",
        position: 3,
        title: {
          en: "Making plans",
          pl: "Umawianie się",
          th: "การนัดหมาย",
        },
        summary: "Suggest and agree on plans with friends.",
        exercises: [
          {
            prompt: {
              en: "Choose the natural way to suggest a plan.",
              pl: "Wybierz naturalny sposób zaproponowania planu.",
              th: "เลือกวิธีเสนอแผนที่เป็นธรรมชาติ",
            },
            options: [
              { id: "a", text: "Shall we meet on Friday?" },
              { id: "b", text: "We meet Friday shall?" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: "Choose the natural way to agree.",
              pl: "Wybierz naturalny sposób wyrażenia zgody.",
              th: "เลือกวิธีตอบตกลงที่เป็นธรรมชาติ",
            },
            options: [
              { id: "a", text: "Sounds good to me!" },
              { id: "b", text: "Good to me sounds!" },
            ],
            correct: "a",
          },
        ],
      },
      {
        slug: "talking-about-weather",
        position: 4,
        title: {
          en: "Talking about the weather",
          pl: "Rozmowa o pogodzie",
          th: "การพูดคุยเรื่องอากาศ",
        },
        summary: "Describe today's weather.",
        exercises: [
          {
            prompt: {
              en: "Choose the correct sentence.",
              pl: "Wybierz poprawne zdanie.",
              th: "เลือกประโยคที่ถูกต้อง",
            },
            options: [
              { id: "a", text: "It's raining outside." },
              { id: "b", text: "It rain outside is." },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: 'Which word fits: "It\'s very ___ today, take a jacket."',
              pl: 'Które słowo pasuje: "It\'s very ___ today, take a jacket."',
              th: 'คำใดเติมได้ถูกต้อง: "It\'s very ___ today, take a jacket."',
            },
            options: [
              { id: "a", text: "cold" },
              { id: "b", text: "colding" },
            ],
            correct: "a",
          },
        ],
      },
    ],
  },
];

export const thaiExtraModules: SimpleModule[] = [
  {
    slug: "first-consonants",
    title: "First consonants",
    position: 1,
    lessons: [
      {
        slug: "more-consonants",
        position: 2,
        title: {
          en: "More Thai consonants",
          pl: "Więcej tajskich spółgłosek",
          th: "อักษรไทย: พยัญชนะเพิ่มเติม",
        },
        summary: "Recognise more Thai consonants.",
        exercises: [
          {
            prompt: {
              en: "Which letter is ค (kho khwai)?",
              pl: "Która litera to ค (kho khwai)?",
              th: "ตัวอักษรใดคือ ค (kho khwai)",
            },
            options: [
              { id: "a", text: "ค" },
              { id: "b", text: "ต" },
            ],
            correct: "a",
            explanation: "ค is called kho khwai (buffalo).",
          },
          {
            prompt: {
              en: "Which letter is ง (ngo ngu)?",
              pl: "Która litera to ง (ngo ngu)?",
              th: "ตัวอักษรใดคือ ง (ngo ngu)",
            },
            options: [
              { id: "a", text: "ง" },
              { id: "b", text: "จ" },
            ],
            correct: "a",
            explanation: "ง is called ngo ngu (snake).",
          },
        ],
      },
      {
        slug: "vowels-basics",
        position: 3,
        title: {
          en: "Basic Thai vowels",
          pl: "Podstawowe tajskie samogłoski",
          th: "สระพื้นฐาน",
        },
        summary: "Recognise basic Thai vowel symbols.",
        exercises: [
          {
            prompt: {
              en: 'Which symbol represents the short vowel sound "a" (sara a)?',
              pl: 'Który znak oznacza krótką samogłoskę "a" (sara a)?',
              th: 'สัญลักษณ์ใดแทนเสียงสระ "a" (สระอะ)',
            },
            options: [
              { id: "a", text: "ะ" },
              { id: "b", text: "า" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: 'Which symbol represents the long vowel "aa" (sara aa)?',
              pl: 'Który znak oznacza długą samogłoskę "aa" (sara aa)?',
              th: 'สัญลักษณ์ใดแทนเสียงสระยาว "aa" (สระอา)',
            },
            options: [
              { id: "a", text: "า" },
              { id: "b", text: "ิ" },
            ],
            correct: "a",
          },
        ],
      },
      {
        slug: "tone-marks-intro",
        position: 4,
        title: {
          en: "Introduction to tone marks",
          pl: "Wprowadzenie do znaków tonu",
          th: "เครื่องหมายวรรณยุกต์เบื้องต้น",
        },
        summary: "Recognise the first two Thai tone marks.",
        exercises: [
          {
            prompt: {
              en: 'Which mark is "mai ek" (the first tone mark)?',
              pl: 'Który znak to "mai ek" (pierwszy znak tonu)?',
              th: 'เครื่องหมายใดคือ "ไม้เอก"',
            },
            options: [
              { id: "a", text: "่" },
              { id: "b", text: "๊" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: 'Which mark is "mai tho" (the second tone mark)?',
              pl: 'Który znak to "mai tho" (drugi znak tonu)?',
              th: 'เครื่องหมายใดคือ "ไม้โท"',
            },
            options: [
              { id: "a", text: "้" },
              { id: "b", text: "่" },
            ],
            correct: "a",
          },
        ],
      },
    ],
  },
  {
    slug: "numbers-and-counting",
    title: "Numbers and counting",
    position: 2,
    lessons: [
      {
        slug: "numbers-1-10",
        position: 1,
        title: {
          en: "Thai numbers 1-10",
          pl: "Tajskie liczby 1-10",
          th: "ตัวเลขไทย 1-10",
        },
        summary: "Recognise Thai numbers from one to ten.",
        exercises: [
          {
            prompt: {
              en: "Which word means five?",
              pl: "Które słowo oznacza pięć?",
              th: "คำใดหมายถึงเลขห้า",
            },
            options: [
              { id: "a", text: "ห้า" },
              { id: "b", text: "หก" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: "Which word means ten?",
              pl: "Które słowo oznacza dziesięć?",
              th: "คำใดหมายถึงเลขสิบ",
            },
            options: [
              { id: "a", text: "สิบ" },
              { id: "b", text: "เก้า" },
            ],
            correct: "a",
          },
        ],
      },
      {
        slug: "counting-objects",
        position: 2,
        title: {
          en: "Counting objects",
          pl: "Liczenie przedmiotów",
          th: "การนับสิ่งของ",
        },
        summary: "Use the correct classifier when counting objects.",
        exercises: [
          {
            prompt: {
              en: "Which classifier is used for flat objects like paper?",
              pl: "Który klasyfikator stosuje się do płaskich przedmiotów, np. papieru?",
              th: "ลักษณนามใดใช้กับของแบนเช่นกระดาษ",
            },
            options: [
              { id: "a", text: "แผ่น" },
              { id: "b", text: "ตัว" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: "Which classifier is used for books?",
              pl: "Który klasyfikator stosuje się do książek?",
              th: "ลักษณนามใดใช้กับหนังสือ",
            },
            options: [
              { id: "a", text: "เล่ม" },
              { id: "b", text: "คน" },
            ],
            correct: "a",
          },
        ],
      },
      {
        slug: "telling-time-thai",
        position: 3,
        title: {
          en: "Telling the time in Thai",
          pl: "Podawanie godziny po tajsku",
          th: "การบอกเวลาในภาษาไทย",
        },
        summary: "Ask and understand the time in Thai.",
        exercises: [
          {
            prompt: {
              en: 'Which word means "hour" in casual time expressions?',
              pl: 'Które słowo oznacza "godzinę" w potocznych wyrażeniach czasu?',
              th: 'คำใดหมายถึง "ชั่วโมง" ในการบอกเวลาแบบทั่วไป',
            },
            options: [
              { id: "a", text: "โมง" },
              { id: "b", text: "วัน" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: 'Which phrase asks "what time is it?"',
              pl: 'Które zdanie pyta "która jest godzina?"',
              th: 'ประโยคใดถามว่า "กี่โมงแล้ว"',
            },
            options: [
              { id: "a", text: "กี่โมงแล้ว" },
              { id: "b", text: "ที่ไหนแล้ว" },
            ],
            correct: "a",
          },
        ],
      },
      {
        slug: "prices-and-money",
        position: 4,
        title: {
          en: "Prices and money",
          pl: "Ceny i pieniądze",
          th: "ราคาและเงิน",
        },
        summary: "Ask about prices in Thai.",
        exercises: [
          {
            prompt: {
              en: 'Which word means "baht" (Thai currency)?',
              pl: 'Które słowo oznacza "bat" (walutę Tajlandii)?',
              th: 'คำใดหมายถึง "บาท"',
            },
            options: [
              { id: "a", text: "บาท" },
              { id: "b", text: "เมตร" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: 'Which phrase asks "how much does it cost?"',
              pl: 'Które zdanie pyta "ile to kosztuje?"',
              th: 'ประโยคใดถามว่า "เท่าไหร่"',
            },
            options: [
              { id: "a", text: "เท่าไหร่" },
              { id: "b", text: "ที่ไหน" },
            ],
            correct: "a",
          },
        ],
      },
    ],
  },
  {
    slug: "everyday-thai-phrases",
    title: "Everyday Thai phrases",
    position: 3,
    lessons: [
      {
        slug: "greetings-thai",
        position: 1,
        title: {
          en: "Everyday greetings",
          pl: "Codzienne powitania",
          th: "คำทักทายในชีวิตประจำวัน",
        },
        summary: "Greet people naturally in Thai.",
        exercises: [
          {
            prompt: {
              en: "Which word is the standard Thai greeting?",
              pl: "Które słowo jest standardowym tajskim powitaniem?",
              th: "คำใดเป็นคำทักทายมาตรฐานของไทย",
            },
            options: [
              { id: "a", text: "สวัสดี" },
              { id: "b", text: "ลาก่อน" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: 'Which phrase means "how are you?"',
              pl: 'Które zdanie oznacza "jak się masz?"',
              th: 'ประโยคใดหมายถึง "สบายดีไหม"',
            },
            options: [
              { id: "a", text: "สบายดีไหม" },
              { id: "b", text: "กินข้าวหรือยัง" },
            ],
            correct: "a",
          },
        ],
      },
      {
        slug: "polite-particles",
        position: 2,
        title: {
          en: "Polite particles",
          pl: "Partykuły grzecznościowe",
          th: "คำลงท้ายสุภาพ",
        },
        summary: "Use the correct polite particle for your gender.",
        exercises: [
          {
            prompt: {
              en: "Which polite particle is typically used by women?",
              pl: "Której partykuły grzecznościowej zwykle używają kobiety?",
              th: "ผู้หญิงมักใช้คำลงท้ายสุภาพใด",
            },
            options: [
              { id: "a", text: "ค่ะ" },
              { id: "b", text: "ครับ" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: "Which polite particle is typically used by men?",
              pl: "Której partykuły grzecznościowej zwykle używają mężczyźni?",
              th: "ผู้ชายมักใช้คำลงท้ายสุภาพใด",
            },
            options: [
              { id: "a", text: "ครับ" },
              { id: "b", text: "ค่ะ" },
            ],
            correct: "a",
          },
        ],
      },
      {
        slug: "asking-questions",
        position: 3,
        title: {
          en: "Asking basic questions",
          pl: "Zadawanie podstawowych pytań",
          th: "การตั้งคำถามพื้นฐาน",
        },
        summary: "Form simple questions in Thai.",
        exercises: [
          {
            prompt: {
              en: "Which particle turns a statement into a yes/no question?",
              pl: "Która partykuła zmienia zdanie twierdzące w pytanie tak/nie?",
              th: "คำใดใช้เปลี่ยนประโยคบอกเล่าเป็นคำถามใช่/ไม่ใช่",
            },
            options: [
              { id: "a", text: "ไหม" },
              { id: "b", text: "ครับ" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: 'Which word means "what"?',
              pl: 'Które słowo oznacza "co"?',
              th: 'คำใดหมายถึง "อะไร"',
            },
            options: [
              { id: "a", text: "อะไร" },
              { id: "b", text: "ที่ไหน" },
            ],
            correct: "a",
          },
        ],
      },
      {
        slug: "basic-directions",
        position: 4,
        title: {
          en: "Basic directions",
          pl: "Podstawowe kierunki",
          th: "ทิศทางพื้นฐาน",
        },
        summary: "Understand simple directions in Thai.",
        exercises: [
          {
            prompt: {
              en: 'Which word means "left"?',
              pl: 'Które słowo oznacza "lewo"?',
              th: 'คำใดหมายถึง "ซ้าย"',
            },
            options: [
              { id: "a", text: "ซ้าย" },
              { id: "b", text: "ขวา" },
            ],
            correct: "a",
          },
          {
            prompt: {
              en: 'Which word means "straight ahead"?',
              pl: 'Które słowo oznacza "prosto"?',
              th: 'คำใดหมายถึง "ตรงไป"',
            },
            options: [
              { id: "a", text: "ตรงไป" },
              { id: "b", text: "เลี้ยว" },
            ],
            correct: "a",
          },
        ],
      },
    ],
  },
];
