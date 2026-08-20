type Locale = "pl" | "en" | "th";
type Localized = Record<Locale, string>;
type ExerciseType =
  | "single_choice"
  | "multiple_choice"
  | "gap_fill"
  | "typed_answer"
  | "ordering"
  | "listening";

export type TrackExercise = {
  type: ExerciseType;
  prompt: Localized;
  instructions?: string;
  options?: Array<{ id: string; text: string }>;
  answer: unknown;
  explanation?: string | Localized;
};

export type TrackLesson = {
  slug: string;
  position: number;
  title: Localized;
  summary: string;
  estimatedMinutes: number;
  exercises: TrackExercise[];
  vocabulary?: Array<{
    term: string;
    definition: string;
    translations: Localized;
  }>;
};

export type LearningTrack = {
  slug: string;
  language: "en" | "th";
  level: string;
  category: "general" | "vocabulary" | "phrases" | "business" | "it";
  title: string;
  description: string;
  modules: Array<{
    slug: string;
    title: string;
    position: number;
    lessons: TrackLesson[];
  }>;
};

const l = (pl: string, en: string, th: string): Localized => ({ pl, en, th });
const options = (...values: string[]) =>
  values.map((text, index) => ({ id: String.fromCharCode(97 + index), text }));

type LessonInput = {
  slug: string;
  title: Localized;
  summary: string;
  context: Localized;
  choice: {
    term: string;
    meanings: [string, string, string, string];
    correct: number;
  };
  select: {
    values: [string, string, string, string];
    correct: [number, number];
  };
  gap: { sentence: string; accepted: string[] };
  typed: { source: Localized; accepted: string[] };
  order: string[];
  listening: {
    prompt: Localized;
    replies: [string, string, string, string];
    correct: number;
  };
  vocabulary?: TrackLesson["vocabulary"];
};

const richLesson = (input: LessonInput, position = 1): TrackLesson => ({
  slug: input.slug,
  position,
  title: input.title,
  summary: input.summary,
  estimatedMinutes: 14,
  vocabulary: input.vocabulary ?? [
    {
      term: input.choice.term,
      definition: input.choice.meanings[input.choice.correct]!,
      translations: l(
        input.choice.meanings[input.choice.correct]!,
        input.choice.meanings[input.choice.correct]!,
        input.choice.meanings[input.choice.correct]!,
      ),
    },
  ],
  exercises: [
    {
      type: "single_choice",
      prompt: l(
        `Co w tym kontekście oznacza „${input.choice.term}”?`,
        `What does “${input.choice.term}” mean in this context?`,
        `ในบริบทนี้ “${input.choice.term}” หมายถึงอะไร`,
      ),
      instructions: "Choose one answer.",
      options: options(...input.choice.meanings),
      answer: { correct: String.fromCharCode(97 + input.choice.correct) },
      explanation: l(
        `W tym zadaniu poprawne znaczenie wyrażenia "${input.choice.term}" to "${input.choice.meanings[input.choice.correct]}".`,
        `In this task, "${input.choice.term}" means "${input.choice.meanings[input.choice.correct]}".`,
        `ในข้อนี้ "${input.choice.term}" หมายถึง "${input.choice.meanings[input.choice.correct]}"`,
      ),
    },
    {
      type: "multiple_choice",
      prompt: input.context,
      instructions: "Choose two expressions that fit the situation.",
      options: options(...input.select.values),
      answer: {
        correct: input.select.correct.map((index) =>
          String.fromCharCode(97 + index),
        ),
      },
      explanation: l(
        "Oba zaznaczone wyrażenia są naturalne w tej sytuacji.",
        "Both selected expressions are natural in this situation.",
        "ทั้งสองสำนวนที่เลือกใช้ได้เป็นธรรมชาติในสถานการณ์นี้",
      ),
    },
    {
      type: "gap_fill",
      prompt: l(
        `Uzupełnij lukę: ${input.gap.sentence}`,
        `Complete the gap: ${input.gap.sentence}`,
        `เติมคำในช่องว่าง: ${input.gap.sentence}`,
      ),
      instructions: "Type the missing word or phrase.",
      answer: { accepted: input.gap.accepted },
      explanation: l(
        `W lukę należy wpisać "${input.gap.accepted[0]}".`,
        `The gap can be completed with "${input.gap.accepted[0]}".`,
        `เติมช่องว่างด้วย "${input.gap.accepted[0]}"`,
      ),
    },
    {
      type: "typed_answer",
      prompt: input.typed.source,
      instructions:
        "Write the complete answer in the language you are learning.",
      answer: { accepted: input.typed.accepted },
      explanation: l(
        `Przykładowa poprawna odpowiedź to "${input.typed.accepted[0]}".`,
        `A model answer is "${input.typed.accepted[0]}".`,
        `ตัวอย่างคำตอบที่ถูกต้องคือ "${input.typed.accepted[0]}"`,
      ),
    },
    {
      type: "ordering",
      prompt: l(
        "Ułóż elementy w naturalnej kolejności.",
        "Put the parts in a natural order.",
        "เรียงส่วนประกอบให้เป็นประโยคที่เป็นธรรมชาติ",
      ),
      instructions: "Tap the parts in sentence order.",
      options: input.order.map((text, index) => ({
        id: `w${index + 1}`,
        text,
      })),
      answer: { correct: input.order.map((_, index) => `w${index + 1}`) },
      explanation: l(
        `Poprawna kolejność tworzy zdanie: "${input.order.join(" ")}".`,
        `The correct order is: "${input.order.join(" ")}".`,
        `ลำดับที่ถูกต้องคือ "${input.order.join(" ")}"`,
      ),
    },
    {
      type: "listening",
      prompt: {
        ...input.listening.prompt,
        en: input.listening.prompt.en.replace(/^Listen:\s*/i, ""),
        th: input.listening.prompt.th.replace(/^ฟัง:\s*/i, ""),
      },
      instructions: "Listen to the prompt, then choose the most natural reply.",
      options: options(...input.listening.replies),
      answer: {
        correct: String.fromCharCode(97 + input.listening.correct),
      },
      explanation: l(
        `Naturalna odpowiedź to "${input.listening.replies[input.listening.correct]}".`,
        `The natural reply is "${input.listening.replies[input.listening.correct]}".`,
        `คำตอบที่เป็นธรรมชาติคือ "${input.listening.replies[input.listening.correct]}"`,
      ),
    },
  ],
});

const englishVocabulary = richLesson({
  slug: "workplace-vocabulary",
  title: l("Słownictwo w pracy", "Workplace vocabulary", "คำศัพท์ในที่ทำงาน"),
  summary: "Build a practical vocabulary set for everyday work.",
  context: l(
    "Wybierz dwa słowa związane z terminem wykonania zadania.",
    "Choose two expressions connected with completing work on time.",
    "เลือกสองคำที่เกี่ยวกับการทำงานให้ทันเวลา",
  ),
  choice: {
    term: "deadline",
    meanings: [
      "the latest time when something must be finished",
      "a break for lunch",
      "money paid for work",
      "a business trip",
    ],
    correct: 0,
  },
  vocabulary: [
    {
      term: "deadline",
      definition: "The latest time when a task must be completed.",
      translations: l(
        "ostateczny termin wykonania zadania",
        "the latest time when a task must be completed",
        "กำหนดเวลาสุดท้ายที่งานต้องเสร็จ",
      ),
    },
  ],
  select: {
    values: ["due date", "on schedule", "coffee break", "parking space"],
    correct: [0, 1],
  },
  gap: { sentence: "The report is ___ on Friday.", accepted: ["due"] },
  typed: {
    source: l(
      "Napisz po angielsku: Muszę dotrzymać terminu.",
      "Write in English: Muszę dotrzymać terminu.",
      "เขียนเป็นภาษาอังกฤษ: ฉันต้องทำให้ทันกำหนด",
    ),
    accepted: ["I need to meet the deadline", "I have to meet the deadline"],
  },
  order: ["We", "finished", "the task", "on time."],
  listening: {
    prompt: l(
      "Odsłuchaj: Can we move the deadline?",
      "Listen: Can we move the deadline?",
      "ฟัง: Can we move the deadline?",
    ),
    replies: [
      "Yes, let’s discuss a new date.",
      "The office is upstairs.",
      "I moved by train.",
      "Deadline is a person.",
    ],
    correct: 0,
  },
});

const englishPhrases = richLesson({
  slug: "useful-everyday-phrases",
  title: l("Przydatne zwroty", "Useful everyday phrases", "วลีที่ใช้บ่อย"),
  summary: "Ask for help, clarification and repetition naturally.",
  context: l(
    "Wybierz dwa uprzejme zwroty z prośbą o pomoc.",
    "Choose two polite ways to ask for help.",
    "เลือกสองวลีสุภาพสำหรับขอความช่วยเหลือ",
  ),
  choice: {
    term: "Could you give me a hand?",
    meanings: [
      "Could you help me?",
      "Could you hold my hand?",
      "Would you like to leave?",
      "Have you finished?",
    ],
    correct: 0,
  },
  select: {
    values: [
      "Could you help me with this?",
      "Would you mind showing me?",
      "Do it now.",
      "You must help.",
    ],
    correct: [0, 1],
  },
  gap: { sentence: "Could you say that ___, please?", accepted: ["again"] },
  typed: {
    source: l(
      "Napisz po angielsku: Nie do końca rozumiem.",
      "Write in English: Nie do końca rozumiem.",
      "เขียนเป็นภาษาอังกฤษ: ฉันยังไม่ค่อยเข้าใจ",
    ),
    accepted: ["I don't quite understand", "I do not quite understand"],
  },
  order: ["Could", "you", "explain that", "again, please?"],
  listening: {
    prompt: l(
      "Odsłuchaj: Is that clear?",
      "Listen: Is that clear?",
      "ฟัง: Is that clear?",
    ),
    replies: [
      "Almost. Could you give me one example?",
      "I am a clear.",
      "Yes, yesterday.",
      "No example is blue.",
    ],
    correct: 0,
  },
});

const englishBusiness = richLesson({
  slug: "business-status-meeting",
  title: l(
    "Służbowe spotkanie statusowe",
    "Business status meeting",
    "การประชุมติดตามงาน",
  ),
  summary: "Give an update, raise a risk and agree on next steps.",
  context: l(
    "Wybierz dwa profesjonalne zwroty do przedstawienia statusu.",
    "Choose two professional status-update phrases.",
    "เลือกสองวลีที่เป็นมืออาชีพสำหรับรายงานสถานะ",
  ),
  choice: {
    term: "on track",
    meanings: [
      "progressing according to plan",
      "outside the agreed scope",
      "without an assigned owner",
      "no longer scheduled",
    ],
    correct: 0,
  },
  select: {
    values: [
      "We’re on track for Friday.",
      "There is one risk to flag.",
      "Everything maybe okay thing.",
      "No update, bye.",
    ],
    correct: [0, 1],
  },
  gap: {
    sentence: "We are waiting ___ the client’s approval.",
    accepted: ["for"],
  },
  typed: {
    source: l(
      "Napisz po angielsku: Następnym krokiem jest test akceptacyjny.",
      "Write in English: Następnym krokiem jest test akceptacyjny.",
      "เขียนเป็นภาษาอังกฤษ: ขั้นตอนถัดไปคือการทดสอบการยอมรับ",
    ),
    accepted: [
      "The next step is acceptance testing",
      "The next step is the acceptance test",
    ],
  },
  order: ["The main risk", "is", "the delayed", "client feedback."],
  listening: {
    prompt: l(
      "Odsłuchaj: Are we still on schedule?",
      "Listen: Are we still on schedule?",
      "ฟัง: Are we still on schedule?",
    ),
    replies: [
      "Yes, but we need approval by Wednesday.",
      "Schedule is in my desk.",
      "We were Friday person.",
      "Approval no.",
    ],
    correct: 0,
  },
});

const englishItA1 = richLesson({
  slug: "it-support-basics-a1",
  title: l(
    "IT A1: podstawy wsparcia",
    "IT A1: support basics",
    "ไอที A1: พื้นฐานงานซัพพอร์ต",
  ),
  summary: "Describe a simple issue and ask basic diagnostic questions.",
  context: l(
    "Wybierz dwa pytania pomocne przy pierwszym zgłoszeniu.",
    "Choose two useful first-line support questions.",
    "เลือกสองคำถามที่ใช้รับแจ้งปัญหาเบื้องต้น",
  ),
  choice: {
    term: "restart",
    meanings: [
      "to stop and start a device or app again",
      "to add new software",
      "to remove a file",
      "to enter an account",
    ],
    correct: 0,
  },
  select: {
    values: [
      "What error do you see?",
      "When did it start?",
      "Your computer is angry.",
      "Buy another laptop.",
    ],
    correct: [0, 1],
  },
  gap: {
    sentence: "Please ___ the application and try again.",
    accepted: ["restart"],
  },
  typed: {
    source: l(
      "Napisz po angielsku: Nie mogę się zalogować.",
      "Write in English: Nie mogę się zalogować.",
      "เขียนเป็นภาษาอังกฤษ: ฉันเข้าสู่ระบบไม่ได้",
    ),
    accepted: ["I can't log in", "I cannot log in"],
  },
  order: ["Could you", "send me", "a screenshot", "of the error?"],
  listening: {
    prompt: l(
      "Odsłuchaj: The app keeps crashing.",
      "Listen: The app keeps crashing.",
      "ฟัง: The app keeps crashing.",
    ),
    replies: [
      "Which version are you using?",
      "The app is a car.",
      "I crash yesterday.",
      "Version is hungry.",
    ],
    correct: 0,
  },
});

const englishItA2 = richLesson({
  slug: "it-delivery-a2",
  title: l(
    "IT A2: praca w zespole",
    "IT A2: team delivery",
    "ไอที A2: การทำงานเป็นทีม",
  ),
  summary: "Discuss tickets, code review, testing and deployment.",
  context: l(
    "Wybierz dwa działania wykonywane przed wdrożeniem.",
    "Choose two actions normally completed before deployment.",
    "เลือกสองขั้นตอนที่มักทำก่อน deploy",
  ),
  choice: {
    term: "pull request",
    meanings: [
      "a request to review and merge code changes",
      "a copy of a database",
      "a production incident",
      "a one-time password",
    ],
    correct: 0,
  },
  select: {
    values: [
      "run the tests",
      "request a code review",
      "hide the error",
      "delete the repository",
    ],
    correct: [0, 1],
  },
  gap: { sentence: "The ticket is ready ___ review.", accepted: ["for"] },
  typed: {
    source: l(
      "Napisz po angielsku: Wdrożenie zostało przełożone.",
      "Write in English: Wdrożenie zostało przełożone.",
      "เขียนเป็นภาษาอังกฤษ: การ deploy ถูกเลื่อนออกไป",
    ),
    accepted: [
      "The deployment has been postponed",
      "The deployment was postponed",
    ],
  },
  order: ["I’ve opened", "a pull request", "and assigned", "two reviewers."],
  listening: {
    prompt: l(
      "Odsłuchaj: Did the pipeline pass?",
      "Listen: Did the pipeline pass?",
      "ฟัง: Did the pipeline pass?",
    ),
    replies: [
      "Not yet; one integration test is failing.",
      "The pipe is in the kitchen.",
      "Yes, I am pass.",
      "Reviewers deployed a chair.",
    ],
    correct: 0,
  },
});

const englishItB1 = richLesson({
  slug: "it-incidents-b1",
  title: l(
    "IT B1: incydenty i architektura",
    "IT B1: incidents and architecture",
    "ไอที B1: incident และสถาปัตยกรรม",
  ),
  summary: "Communicate impact, mitigation and technical trade-offs.",
  context: l(
    "Wybierz dwa elementy dobrego komunikatu o incydencie.",
    "Choose two elements of a good incident update.",
    "เลือกสององค์ประกอบของการอัปเดต incident ที่ดี",
  ),
  choice: {
    term: "root cause",
    meanings: [
      "the underlying reason a problem happened",
      "a temporary workaround",
      "the time needed to respond",
      "an API endpoint",
    ],
    correct: 0,
  },
  select: {
    values: [
      "state the user impact",
      "describe the mitigation",
      "guess without evidence",
      "hide the timeline",
    ],
    correct: [0, 1],
  },
  gap: {
    sentence: "We rolled back the release to ___ the impact.",
    accepted: ["reduce", "limit", "mitigate"],
  },
  typed: {
    source: l(
      "Napisz po angielsku: Usługa działa, ale nadal monitorujemy sytuację.",
      "Write in English: Usługa działa, ale nadal monitorujemy sytuację.",
      "เขียนเป็นภาษาอังกฤษ: บริการกลับมาใช้งานได้แล้ว แต่เรายังติดตามสถานการณ์อยู่",
    ),
    accepted: [
      "The service is operational, but we are still monitoring the situation",
      "The service is back up, but we are still monitoring the situation",
    ],
  },
  order: [
    "The immediate fix",
    "reduces risk",
    "but increases",
    "operational complexity.",
  ],
  listening: {
    prompt: l(
      "Odsłuchaj: What is the current customer impact?",
      "Listen: What is the current customer impact?",
      "ฟัง: What is the current customer impact?",
    ),
    replies: [
      "About ten percent of requests are timing out.",
      "Customers are an architecture.",
      "The root is a database table maybe.",
      "Impact was code review.",
    ],
    correct: 0,
  },
});

const englishItB2 = richLesson({
  slug: "it-architecture-b2",
  title: l(
    "IT B2: architektura i decyzje techniczne",
    "IT B2: architecture and technical decisions",
    "ไอที B2: สถาปัตยกรรมและการตัดสินใจทางเทคนิค",
  ),
  summary: "Explain architecture, trade-offs, reliability and technical risk.",
  context: l(
    "Wybierz dwa profesjonalne sposoby opisania kompromisu technicznego.",
    "Choose two professional ways to describe a technical trade-off.",
    "Choose two professional ways to describe a technical trade-off.",
  ),
  choice: {
    term: "technical debt",
    meanings: [
      "future work created by choosing a quicker solution now",
      "the price of cloud hosting",
      "an unpaid software invoice",
      "a list of resolved incidents",
    ],
    correct: 0,
  },
  select: {
    values: [
      "This improves throughput at the cost of higher memory usage.",
      "The simpler design is easier to maintain but less flexible.",
      "The architecture is good because it is architecture.",
      "There are no trade-offs in distributed systems.",
    ],
    correct: [0, 1],
  },
  gap: {
    sentence: "We introduced caching to reduce the load ___ the database.",
    accepted: ["on"],
  },
  typed: {
    source: l(
      "Wyjaśnij po angielsku, że rozwiązanie zwiększa niezawodność kosztem złożoności.",
      "Explain that the solution improves reliability but adds complexity.",
      "Explain that the solution improves reliability but adds complexity.",
    ),
    accepted: [
      "The solution improves reliability but adds complexity",
      "This solution increases reliability at the cost of additional complexity",
    ],
  },
  order: [
    "The proposed architecture",
    "removes a single point of failure",
    "while keeping",
    "operational costs manageable.",
  ],
  listening: {
    prompt: l(
      "Posłuchaj i wybierz najlepszą reakcję.",
      "The migration is feasible, although the rollback strategy needs more detail.",
      "The migration is feasible, although the rollback strategy needs more detail.",
    ),
    replies: [
      "Agreed. Let's define the rollback triggers before implementation.",
      "Rollback is a database person.",
      "The migration was tomorrow.",
      "Detail is not technical.",
    ],
    correct: 0,
  },
  vocabulary: [
    {
      term: "technical debt",
      definition: "Future work caused by choosing a quicker solution now.",
      translations: l(
        "dług techniczny",
        "future work caused by choosing a quicker solution now",
        "หนี้ทางเทคนิค",
      ),
    },
  ],
});

const b2Lesson = (
  position: number,
  input: {
    slug: string;
    titlePl: string;
    titleEn: string;
    summary: string;
    contextPl: string;
    contextEn: string;
    term: string;
    meanings: [string, string, string, string];
    select: [string, string, string, string];
    gap: string;
    gapAnswers: string[];
    writingPl: string;
    writingEn: string;
    modelAnswers: string[];
    order: [string, string, string, string];
    audio: string;
    replies: [string, string, string, string];
  },
): TrackLesson =>
  richLesson(
    {
      slug: input.slug,
      title: l(input.titlePl, input.titleEn, input.titleEn),
      summary: input.summary,
      context: l(input.contextPl, input.contextEn, input.contextEn),
      choice: { term: input.term, meanings: input.meanings, correct: 0 },
      select: { values: input.select, correct: [0, 1] },
      gap: { sentence: input.gap, accepted: input.gapAnswers },
      typed: {
        source: l(input.writingPl, input.writingEn, input.writingEn),
        accepted: input.modelAnswers,
      },
      order: input.order,
      listening: {
        prompt: l(
          "Posłuchaj i wybierz najlepszą odpowiedź.",
          input.audio,
          input.audio,
        ),
        replies: input.replies,
        correct: 0,
      },
      vocabulary: [
        {
          term: input.term,
          definition: input.meanings[0],
          translations: l(
            input.meanings[0],
            input.meanings[0],
            input.meanings[0],
          ),
        },
      ],
    },
    position,
  );

const englishB2Modules: LearningTrack["modules"] = [
  {
    slug: "b2-advanced-grammar",
    title: "B2 · Advanced grammar in context",
    position: 1,
    lessons: [
      b2Lesson(1, {
        slug: "narrative-tenses-b2",
        titlePl: "Czasy narracyjne",
        titleEn: "Narrative tenses",
        summary: "Tell coherent stories using precise past-time relationships.",
        contextPl:
          "Wybierz dwa zdania poprawnie opisujące wcześniejsze wydarzenie.",
        contextEn:
          "Choose two sentences that correctly describe an earlier past event.",
        term: "in hindsight",
        meanings: [
          "when looking back at a past situation",
          "before an event begins",
          "without any warning",
          "at exactly the same time",
        ],
        select: [
          "By the time I arrived, they had already left.",
          "She had been waiting for an hour when he called.",
          "I had went there yesterday.",
          "They were finished before we had arrive.",
        ],
        gap: "I realised that I ___ the same mistake before.",
        gapAnswers: ["had made"],
        writingPl:
          "Opowiedz jednym zdaniem o problemie, który trwał przed innym wydarzeniem.",
        writingEn:
          "Describe a problem that had been continuing before another event occurred.",
        modelAnswers: [
          "The system had been slowing down for hours before it finally crashed",
        ],
        order: [
          "We had been investigating",
          "the incident for two hours",
          "when the monitoring team",
          "found the root cause.",
        ],
        audio:
          "I had assumed the meeting was online, so by the time I reached the office, everyone had left.",
        replies: [
          "The speaker misunderstood the meeting format.",
          "The meeting was cancelled before it began.",
          "Everyone joined online.",
          "The speaker arrived before everyone else.",
        ],
      }),
      b2Lesson(2, {
        slug: "conditionals-and-regrets-b2",
        titlePl: "Warunki, skutki i żal",
        titleEn: "Conditionals, consequences and regrets",
        summary: "Discuss hypothetical outcomes and mixed-time consequences.",
        contextPl: "Wybierz dwie poprawne konstrukcje warunkowe.",
        contextEn: "Choose two grammatically correct conditional structures.",
        term: "otherwise",
        meanings: [
          "if the situation were different or if not",
          "for that exact reason",
          "at an earlier stage",
          "in the same manner",
        ],
        select: [
          "If I had known, I would have prepared differently.",
          "If the process were simpler, we would be moving faster.",
          "If I would know, I had prepared.",
          "If it was easier, we will moved faster.",
        ],
        gap: "If we had more capacity, we ___ the migration this quarter.",
        gapAnswers: ["could complete", "would complete"],
        writingPl:
          "Wyraź żal, że nie poproszono wcześniej o opinię użytkowników.",
        writingEn:
          "Express regret that user feedback was not requested earlier.",
        modelAnswers: [
          "I wish we had asked users for feedback earlier",
          "If only we had requested user feedback earlier",
        ],
        order: [
          "Had we anticipated",
          "the increase in traffic,",
          "we would have scaled",
          "the service in advance.",
        ],
        audio:
          "If the original estimate had been more realistic, we wouldn't be under so much pressure now.",
        replies: [
          "A past estimate is affecting the present situation.",
          "The current estimate is completely accurate.",
          "There is no pressure now.",
          "The speaker wants a shorter meeting.",
        ],
      }),
      b2Lesson(3, {
        slug: "emphasis-and-inversion-b2",
        titlePl: "Emfaza i inwersja",
        titleEn: "Emphasis and inversion",
        summary: "Use inversion and cleft sentences for controlled emphasis.",
        contextPl: "Wybierz dwa poprawne sposoby podkreślenia informacji.",
        contextEn: "Choose two correct ways to add emphasis.",
        term: "by no means",
        meanings: [
          "not at all",
          "as a direct result",
          "with limited resources",
          "approximately",
        ],
        select: [
          "Never have I seen such a rapid recovery.",
          "What we need is a clearer decision process.",
          "Never I have seen such recovery.",
          "What is we need a process.",
        ],
        gap: "Only after the review ___ the hidden dependency.",
        gapAnswers: ["did we discover"],
        writingPl:
          "Podkreśl po angielsku, że właśnie komunikacja była głównym problemem.",
        writingEn: "Emphasise that communication was the main problem.",
        modelAnswers: [
          "It was communication that was the main problem",
          "What caused the problem was poor communication",
        ],
        order: [
          "Not only did",
          "the team restore the service,",
          "but it also documented",
          "the recovery procedure.",
        ],
        audio:
          "What concerns me most is not the delay itself, but the lack of transparency around it.",
        replies: [
          "The lack of transparency is the speaker's main concern.",
          "The delay is the only concern.",
          "The speaker is satisfied with communication.",
          "There was no delay.",
        ],
      }),
    ],
  },
  {
    slug: "b2-fluent-communication",
    title: "B2 · Fluent communication",
    position: 2,
    lessons: [
      b2Lesson(1, {
        slug: "hedging-and-nuance-b2",
        titlePl: "Ostrożne formułowanie opinii",
        titleEn: "Hedging and nuance",
        summary: "Make claims precise without sounding absolute or vague.",
        contextPl: "Wybierz dwa zdania wyrażające ostrożną, wyważoną opinię.",
        contextEn:
          "Choose two statements that express a cautious, balanced opinion.",
        term: "to some extent",
        meanings: [
          "partly but not completely",
          "without exception",
          "for an unknown reason",
          "at the final stage",
        ],
        select: [
          "The change appears to have improved retention.",
          "This may be partly due to seasonal demand.",
          "This definitely proves everything.",
          "Maybe thing good somehow.",
        ],
        gap: "The results are encouraging, ___ they should be interpreted cautiously.",
        gapAnswers: ["although", "though"],
        writingPl: "Wyraź ostrożnie opinię, że nowa polityka może pomóc.",
        writingEn: "State cautiously that the new policy may be helpful.",
        modelAnswers: [
          "The new policy appears to be helpful",
          "The new policy may prove beneficial",
        ],
        order: [
          "There is some evidence",
          "to suggest that",
          "the intervention has had",
          "a positive effect.",
        ],
        audio:
          "The figures are promising, although I would hesitate to call the trend permanent just yet.",
        replies: [
          "The speaker is cautiously optimistic.",
          "The speaker rejects the figures.",
          "The trend is certainly permanent.",
          "No figures are available.",
        ],
      }),
      b2Lesson(2, {
        slug: "discussion-and-debate-b2",
        titlePl: "Dyskusja i konstruktywny sprzeciw",
        titleEn: "Discussion and constructive disagreement",
        summary:
          "Challenge ideas, concede points and redirect discussion politely.",
        contextPl:
          "Wybierz dwa profesjonalne sposoby wyrażenia odmiennego zdania.",
        contextEn: "Choose two professional ways to express a different view.",
        term: "a fair point",
        meanings: [
          "a reasonable argument worth considering",
          "a final decision",
          "an irrelevant detail",
          "a personal criticism",
        ],
        select: [
          "I take your point, but there is another factor to consider.",
          "That's a fair point; however, the data suggests otherwise.",
          "You are simply wrong.",
          "No, because I say so.",
        ],
        gap: "I agree with the principle; ___, I question the timing.",
        gapAnswers: ["however", "nevertheless"],
        writingPl: "Nie zgódź się uprzejmie i poproś o dodatkowe dowody.",
        writingEn: "Disagree politely and ask for additional evidence.",
        modelAnswers: [
          "I'm not entirely convinced; could you provide some additional evidence",
          "I see your point, but could you support it with more evidence",
        ],
        order: [
          "I can see",
          "where you're coming from,",
          "but we may be overlooking",
          "the long-term impact.",
        ],
        audio:
          "I'm broadly in agreement, although I'd like us to explore the alternative before committing.",
        replies: [
          "The speaker supports the idea with one reservation.",
          "The speaker rejects every option.",
          "A commitment has already been made.",
          "There is no alternative.",
        ],
      }),
      b2Lesson(3, {
        slug: "presentations-and-questions-b2",
        titlePl: "Prezentacje i trudne pytania",
        titleEn: "Presentations and challenging questions",
        summary:
          "Structure arguments, signpost transitions and handle questions.",
        contextPl: "Wybierz dwa naturalne zwroty porządkujące prezentację.",
        contextEn: "Choose two natural signposting phrases for a presentation.",
        term: "to elaborate",
        meanings: [
          "to explain something in greater detail",
          "to avoid a question",
          "to summarise in one word",
          "to change the subject completely",
        ],
        select: [
          "Let me turn to the main implication.",
          "I'll come back to that point in a moment.",
          "Now slide because next.",
          "Question later no.",
        ],
        gap: "To put these figures ___ perspective, last year's total was half as high.",
        gapAnswers: ["into"],
        writingPl: "Poproś rozmówcę o doprecyzowanie trudnego pytania.",
        writingEn: "Ask the other person to clarify a challenging question.",
        modelAnswers: [
          "Could you clarify which aspect you would like me to address",
          "Would you mind clarifying what you mean by that",
        ],
        order: [
          "Before I conclude,",
          "I'd like to highlight",
          "the two implications",
          "that matter most.",
        ],
        audio:
          "Could you elaborate on how the projected savings were calculated?",
        replies: [
          "Certainly. They are based on a three-year cost comparison.",
          "Savings calculate because low.",
          "The presentation is a projector.",
          "I concluded yesterday.",
        ],
      }),
    ],
  },
  {
    slug: "b2-professional-english",
    title: "B2 · Professional English",
    position: 3,
    lessons: [
      b2Lesson(1, {
        slug: "negotiation-b2",
        titlePl: "Negocjowanie warunków",
        titleEn: "Negotiating terms",
        summary:
          "Make conditional offers, clarify constraints and seek compromise.",
        contextPl: "Wybierz dwa zdania, które pomagają osiągnąć kompromis.",
        contextEn: "Choose two statements that help reach a compromise.",
        term: "common ground",
        meanings: [
          "shared interests or beliefs",
          "a non-negotiable demand",
          "the final contract",
          "a hidden cost",
        ],
        select: [
          "We could agree to that provided the timeline remains unchanged.",
          "Is there any flexibility on the support period?",
          "Accept this now or leave.",
          "Your condition is impossible because no.",
        ],
        gap: "We would be prepared to reduce the fee ___ return for a longer contract.",
        gapAnswers: ["in"],
        writingPl: "Zaproponuj kompromis dotyczący ceny i terminu.",
        writingEn:
          "Propose a compromise involving the price and delivery date.",
        modelAnswers: [
          "We could accept the price if the delivery date were brought forward",
          "If you can meet the earlier deadline, we can agree to the proposed price",
        ],
        order: [
          "If you can extend",
          "the support period,",
          "we may be able to",
          "meet you halfway on price.",
        ],
        audio:
          "That figure is above our budget, but there may be room for movement if the scope is reduced.",
        replies: [
          "The speaker is open to a conditional compromise.",
          "The speaker accepts the figure immediately.",
          "The scope must increase.",
          "The negotiation has ended.",
        ],
      }),
      b2Lesson(2, {
        slug: "reports-and-recommendations-b2",
        titlePl: "Raporty i rekomendacje",
        titleEn: "Reports and recommendations",
        summary: "Summarise findings and write evidence-based recommendations.",
        contextPl: "Wybierz dwa formalne zdania pasujące do raportu.",
        contextEn: "Choose two formal statements suitable for a report.",
        term: "findings",
        meanings: [
          "results discovered through research or analysis",
          "future assumptions",
          "meeting invitations",
          "informal opinions",
        ],
        select: [
          "The findings indicate a significant reduction in processing time.",
          "It is therefore recommended that the trial be extended.",
          "We think it is cool and stuff.",
          "The findings says maybe yes.",
        ],
        gap: "The recommendation is based ___ feedback from over 500 users.",
        gapAnswers: ["on"],
        writingPl:
          "Napisz formalną rekomendację przeprowadzenia dalszych testów.",
        writingEn:
          "Write a formal recommendation that further testing be conducted.",
        modelAnswers: [
          "It is recommended that further testing be conducted",
          "We recommend conducting further tests before implementation",
        ],
        order: [
          "Based on these findings,",
          "the report recommends",
          "a phased implementation",
          "over the next six months.",
        ],
        audio:
          "The pilot met its primary objective, but the sample was too small to justify a full rollout.",
        replies: [
          "The pilot was promising but evidence is still limited.",
          "The pilot failed every objective.",
          "A full rollout has already begun.",
          "The sample was unusually large.",
        ],
      }),
      b2Lesson(3, {
        slug: "leadership-and-feedback-b2",
        titlePl: "Przywództwo i informacja zwrotna",
        titleEn: "Leadership and feedback",
        summary: "Set expectations and deliver balanced, actionable feedback.",
        contextPl: "Wybierz dwa przykłady konstruktywnej informacji zwrotnej.",
        contextEn: "Choose two examples of constructive feedback.",
        term: "actionable",
        meanings: [
          "specific enough to act on",
          "legally prohibited",
          "purely theoretical",
          "deliberately flattering",
        ],
        select: [
          "Your analysis was clear; adding sources would make it more persuasive.",
          "Let's agree on two specific improvements for the next draft.",
          "This is bad. Fix it.",
          "You always do everything wrong.",
        ],
        gap: "I was impressed ___ how clearly you handled the client's concerns.",
        gapAnswers: ["by", "with"],
        writingPl:
          "Pochwal mocną stronę i wskaż jeden konkretny obszar poprawy.",
        writingEn:
          "Praise one strength and identify one specific area for improvement.",
        modelAnswers: [
          "Your presentation was well structured; next time, try to support the conclusion with more data",
        ],
        order: [
          "You handled",
          "the discussion confidently;",
          "one area to develop",
          "is how you summarise decisions.",
        ],
        audio:
          "You've made strong progress. The next step is to delegate more consistently rather than taking every task on yourself.",
        replies: [
          "The speaker praises progress and suggests delegating more.",
          "The speaker wants all delegation to stop.",
          "No progress has been made.",
          "The listener should accept more tasks personally.",
        ],
      }),
    ],
  },
  {
    slug: "b2-real-world-comprehension",
    title: "B2 · Real-world comprehension",
    position: 4,
    lessons: [
      b2Lesson(1, {
        slug: "news-and-sources-b2",
        titlePl: "Wiadomości i wiarygodność źródeł",
        titleEn: "News and source credibility",
        summary: "Distinguish claims, evidence, bias and cautious reporting.",
        contextPl:
          "Wybierz dwa zdania ostrożnie opisujące niepotwierdzoną informację.",
        contextEn:
          "Choose two statements that report unconfirmed information cautiously.",
        term: "allegedly",
        meanings: [
          "according to claims that have not yet been proven",
          "with complete certainty",
          "in an official legal judgement",
          "as shown by several experiments",
        ],
        select: [
          "The company is reported to be considering a merger.",
          "The document allegedly came from an internal source.",
          "The rumour definitely proves the merger.",
          "Someone said it, so it is a fact.",
        ],
        gap: "The claim has not yet been independently ___.",
        gapAnswers: ["verified", "confirmed"],
        writingPl: "Zaznacz po angielsku, że raport może być stronniczy.",
        writingEn: "State that the report may present a biased account.",
        modelAnswers: [
          "The report may present a biased account",
          "The report appears to reflect the author's bias",
        ],
        order: [
          "Although the article",
          "raises important questions,",
          "it provides little evidence",
          "to support its central claim.",
        ],
        audio:
          "Officials have declined to comment, and the figures cited in the report have not been independently verified.",
        replies: [
          "The information should still be treated cautiously.",
          "Officials confirmed every figure.",
          "Independent verification is complete.",
          "The report contains no figures.",
        ],
      }),
      b2Lesson(2, {
        slug: "culture-and-perspective-b2",
        titlePl: "Kultura i różne perspektywy",
        titleEn: "Culture and different perspectives",
        summary:
          "Compare viewpoints and discuss cultural expectations sensitively.",
        contextPl:
          "Wybierz dwa wyważone sposoby mówienia o różnicach kulturowych.",
        contextEn: "Choose two balanced ways to discuss cultural differences.",
        term: "norm",
        meanings: [
          "a commonly accepted standard of behaviour",
          "a strict international law",
          "a personal exception",
          "a historic building",
        ],
        select: [
          "Expectations around punctuality vary across cultures.",
          "It is worth asking rather than assuming what is considered polite.",
          "Their culture is simply wrong.",
          "Everyone in that country behaves identically.",
        ],
        gap: "What is considered direct in one culture may come ___ as rude in another.",
        gapAnswers: ["across"],
        writingPl:
          "Wyjaśnij, że różnica jest kwestią oczekiwań, a nie braku szacunku.",
        writingEn:
          "Explain that the difference concerns expectations rather than disrespect.",
        modelAnswers: [
          "The difference is about cultural expectations rather than a lack of respect",
          "This reflects different expectations, not disrespect",
        ],
        order: [
          "Instead of assuming",
          "that our approach is universal,",
          "we should ask",
          "how local teams prefer to work.",
        ],
        audio:
          "Her response seemed indirect to me at first, but I later realised she was trying to preserve harmony in the group.",
        replies: [
          "The speaker revised an initial cultural interpretation.",
          "The response was intended to cause conflict.",
          "The group had no cultural differences.",
          "The speaker still sees the response as dishonest.",
        ],
      }),
      b2Lesson(3, {
        slug: "complex-problem-solving-b2",
        titlePl: "Rozwiązywanie złożonych problemów",
        titleEn: "Complex problem-solving",
        summary: "Analyse causes, compare options and justify a decision.",
        contextPl:
          "Wybierz dwa zdania pokazujące uporządkowaną analizę problemu.",
        contextEn:
          "Choose two statements that show structured problem analysis.",
        term: "root cause",
        meanings: [
          "the fundamental reason a problem occurs",
          "the first visible symptom",
          "a temporary workaround",
          "the person who reports an issue",
        ],
        select: [
          "We need to distinguish the symptom from the underlying cause.",
          "Let's evaluate each option against the same criteria.",
          "Choose the first solution and hope.",
          "The symptom must be the cause.",
        ],
        gap: "The short-term fix addresses the symptom rather ___ the underlying issue.",
        gapAnswers: ["than"],
        writingPl:
          "Uzasadnij wybór rozwiązania, odnosząc się do ryzyka i kosztu.",
        writingEn: "Justify a solution by referring to both risk and cost.",
        modelAnswers: [
          "This option offers the best balance between implementation cost and operational risk",
          "We chose this solution because it reduces risk without creating excessive cost",
        ],
        order: [
          "Having compared",
          "the cost, risk and impact,",
          "we concluded that",
          "a phased approach was the safest option.",
        ],
        audio:
          "The workaround will restore service quickly, but unless we address the underlying cause, the issue is likely to recur.",
        replies: [
          "A quick fix is not a permanent solution.",
          "The underlying cause has already disappeared.",
          "Restoring service is unnecessary.",
          "The issue cannot happen again.",
        ],
      }),
    ],
  },
];

const thaiVocabulary = richLesson({
  slug: "thai-workplace-vocabulary",
  title: l(
    "Tajskie słownictwo w pracy",
    "Thai workplace vocabulary",
    "คำศัพท์ภาษาไทยในที่ทำงาน",
  ),
  summary: "Learn high-frequency Thai words used at work.",
  context: l(
    "Wybierz dwa słowa związane ze spotkaniem.",
    "Choose two words connected with a meeting.",
    "เลือกสองคำที่เกี่ยวข้องกับการประชุม",
  ),
  choice: {
    term: "กำหนดส่ง",
    meanings: ["termin oddania", "hasło", "monitor", "urlop"],
    correct: 0,
  },
  select: {
    values: ["วาระการประชุม", "ผู้เข้าร่วม", "ร้านอาหาร", "ตั๋วรถไฟ"],
    correct: [0, 1],
  },
  gap: { sentence: "เรามี___ตอนสิบโมง", accepted: ["ประชุม", "การประชุม"] },
  typed: {
    source: l(
      "Napisz po tajsku: termin oddania",
      "Write in Thai: deadline",
      "เขียนคำว่า deadline เป็นภาษาไทย",
    ),
    accepted: ["กำหนดส่ง"],
  },
  order: ["พรุ่งนี้", "เรามี", "ประชุม", "ตอนสิบโมง"],
  listening: {
    prompt: l(
      "Odsłuchaj: กำหนดส่งคือวันศุกร์",
      "Listen: กำหนดส่งคือวันศุกร์",
      "ฟัง: กำหนดส่งคือวันศุกร์",
    ),
    replies: [
      "รับทราบครับ ผมจะส่งให้ทัน",
      "ฉันชอบกาแฟ",
      "วันศุกร์เป็นคอมพิวเตอร์",
      "ไม่ประชุมเมื่อวาน",
    ],
    correct: 0,
  },
});

const thaiPhrases = richLesson({
  slug: "thai-useful-phrases",
  title: l(
    "Przydatne zwroty po tajsku",
    "Useful Thai phrases",
    "วลีภาษาไทยที่ใช้บ่อย",
  ),
  summary: "Ask for help and clarification politely in Thai.",
  context: l(
    "Wybierz dwa uprzejme zwroty z prośbą.",
    "Choose two polite request phrases.",
    "เลือกสองวลีขอร้องที่สุภาพ",
  ),
  choice: {
    term: "ช่วยพูดอีกครั้งได้ไหมครับ/คะ",
    meanings: [
      "Czy możesz powtórzyć?",
      "Czy możesz poczekać?",
      "Czy już zapłaciłeś?",
      "Dokąd idziesz?",
    ],
    correct: 0,
  },
  select: {
    values: [
      "ช่วยอธิบายหน่อยได้ไหมครับ/คะ",
      "รบกวนช่วยดูให้หน่อยครับ/ค่ะ",
      "ทำเดี๋ยวนี้",
      "คุณผิด",
    ],
    correct: [0, 1],
  },
  gap: { sentence: "ช่วยพูดช้า___ได้ไหมครับ", accepted: ["หน่อย"] },
  typed: {
    source: l(
      "Napisz po tajsku: Nie rozumiem.",
      "Write in Thai: I don't understand.",
      "เขียนเป็นภาษาไทย: I don't understand.",
    ),
    accepted: ["ไม่เข้าใจครับ", "ไม่เข้าใจค่ะ", "ไม่เข้าใจ"],
  },
  order: ["ช่วย", "อธิบาย", "อีกครั้ง", "ได้ไหมครับ"],
  listening: {
    prompt: l(
      "Odsłuchaj: เข้าใจไหมครับ",
      "Listen: เข้าใจไหมครับ",
      "ฟัง: เข้าใจไหมครับ",
    ),
    replies: [
      "เกือบเข้าใจแล้ว ช่วยยกตัวอย่างได้ไหมครับ",
      "เข้าใจเมื่อวาน",
      "ฉันเป็นเข้าใจ",
      "ตัวอย่างสีฟ้า",
    ],
    correct: 0,
  },
});

const thaiBusiness = richLesson({
  slug: "thai-business-meeting",
  title: l(
    "Spotkanie służbowe po tajsku",
    "Thai business meeting",
    "การประชุมธุรกิจภาษาไทย",
  ),
  summary: "Give a concise status update and agree on next steps in Thai.",
  context: l(
    "Wybierz dwa profesjonalne zwroty do raportowania statusu.",
    "Choose two professional status-update phrases.",
    "เลือกสองวลีแบบมืออาชีพสำหรับรายงานสถานะ",
  ),
  choice: {
    term: "เป็นไปตามแผน",
    meanings: [
      "zgodnie z planem",
      "po terminie",
      "poza zakresem",
      "bez budżetu",
    ],
    correct: 0,
  },
  select: {
    values: [
      "งานเป็นไปตามแผนครับ",
      "มีความเสี่ยงหนึ่งเรื่องที่ต้องแจ้งครับ",
      "งานอาจดีอะไรสักอย่าง",
      "ไม่มีอัปเดต ลาก่อน",
    ],
    correct: [0, 1],
  },
  gap: {
    sentence: "เรากำลังรอ___จากลูกค้า",
    accepted: ["การอนุมัติ", "คำอนุมัติ"],
  },
  typed: {
    source: l(
      "Napisz po tajsku: Następny krok to testy.",
      "Write in Thai: The next step is testing.",
      "เขียนเป็นภาษาไทย: The next step is testing.",
    ),
    accepted: ["ขั้นตอนต่อไปคือการทดสอบ", "ขั้นตอนถัดไปคือการทดสอบ"],
  },
  order: ["ความเสี่ยงหลัก", "คือ", "ความคิดเห็นจากลูกค้า", "ล่าช้า"],
  listening: {
    prompt: l(
      "Odsłuchaj: งานยังเป็นไปตามแผนไหมครับ",
      "Listen: งานยังเป็นไปตามแผนไหมครับ",
      "ฟัง: งานยังเป็นไปตามแผนไหมครับ",
    ),
    replies: [
      "ยังเป็นไปตามแผนครับ แต่ต้องได้รับอนุมัติภายในวันพุธ",
      "แผนอยู่บนโต๊ะ",
      "ฉันเป็นวันศุกร์",
      "ไม่อนุมัติสีฟ้า",
    ],
    correct: 0,
  },
});

const thaiItA1 = richLesson({
  slug: "thai-it-support-a1",
  title: l(
    "Tajski IT A1: wsparcie",
    "Thai IT A1: support",
    "ภาษาไทยไอที A1: งานซัพพอร์ต",
  ),
  summary: "Report a basic technical problem in polite Thai.",
  context: l(
    "Wybierz dwa pytania pierwszej linii wsparcia.",
    "Choose two first-line support questions.",
    "เลือกสองคำถามสำหรับซัพพอร์ตเบื้องต้น",
  ),
  choice: {
    term: "รีสตาร์ต",
    meanings: ["uruchomić ponownie", "zainstalować", "usunąć", "wydrukować"],
    correct: 0,
  },
  select: {
    values: [
      "เห็นข้อความผิดพลาดอะไรครับ",
      "ปัญหาเริ่มเมื่อไรครับ",
      "คอมพิวเตอร์โกรธ",
      "ซื้อใหม่เลย",
    ],
    correct: [0, 1],
  },
  gap: {
    sentence: "กรุณา___แอปแล้วลองอีกครั้ง",
    accepted: ["รีสตาร์ต", "เปิดใหม่"],
  },
  typed: {
    source: l(
      "Napisz po tajsku: Nie mogę się zalogować.",
      "Write in Thai: I can't log in.",
      "เขียนเป็นภาษาไทย: I can't log in.",
    ),
    accepted: [
      "เข้าสู่ระบบไม่ได้ครับ",
      "เข้าสู่ระบบไม่ได้ค่ะ",
      "ฉันเข้าสู่ระบบไม่ได้",
    ],
  },
  order: ["ช่วย", "ส่งภาพหน้าจอ", "ข้อความผิดพลาด", "ให้หน่อยครับ"],
  listening: {
    prompt: l(
      "Odsłuchaj: แอปปิดเองตลอด",
      "Listen: แอปปิดเองตลอด",
      "ฟัง: แอปปิดเองตลอด",
    ),
    replies: [
      "ตอนนี้ใช้แอปเวอร์ชันอะไรครับ",
      "แอปเป็นรถยนต์",
      "ฉันปิดเมื่อวาน",
      "เวอร์ชันหิว",
    ],
    correct: 0,
  },
});

const thaiItA2 = richLesson({
  slug: "thai-it-delivery-a2",
  title: l(
    "Tajski IT A2: dostarczanie zmian",
    "Thai IT A2: delivery",
    "ภาษาไทยไอที A2: การส่งมอบงาน",
  ),
  summary: "Discuss testing, review and deployment in Thai.",
  context: l(
    "Wybierz dwa działania przed wdrożeniem.",
    "Choose two actions before deployment.",
    "เลือกสองขั้นตอนก่อน deploy",
  ),
  choice: {
    term: "ตรวจโค้ด",
    meanings: ["przegląd kodu", "kopia zapasowa", "incydent", "hasło"],
    correct: 0,
  },
  select: {
    values: [
      "รันการทดสอบ",
      "ขอให้เพื่อนตรวจโค้ด",
      "ซ่อนข้อผิดพลาด",
      "ลบ repository",
    ],
    correct: [0, 1],
  },
  gap: { sentence: "ticket นี้พร้อม___แล้ว", accepted: ["ตรวจ", "รีวิว"] },
  typed: {
    source: l(
      "Napisz po tajsku: Wdrożenie zostało przełożone.",
      "Write in Thai: The deployment was postponed.",
      "เขียนเป็นภาษาไทย: The deployment was postponed.",
    ),
    accepted: [
      "การ deploy ถูกเลื่อนออกไป",
      "การนำระบบขึ้นใช้งานถูกเลื่อนออกไป",
    ],
  },
  order: ["ผมเปิด", "pull request", "และขอ", "code review แล้ว"],
  listening: {
    prompt: l(
      "Odsłuchaj: pipeline ผ่านไหม",
      "Listen: pipeline ผ่านไหม",
      "ฟัง: pipeline ผ่านไหม",
    ),
    replies: [
      "ยังครับ integration test หนึ่งตัวยังไม่ผ่าน",
      "ท่ออยู่ในครัว",
      "ฉันคือผ่าน",
      "reviewer เป็นเก้าอี้",
    ],
    correct: 0,
  },
});

const thaiItB1 = richLesson({
  slug: "thai-it-incidents-b1",
  title: l(
    "Tajski IT B1: incydenty",
    "Thai IT B1: incidents",
    "ภาษาไทยไอที B1: การจัดการ incident",
  ),
  summary: "Communicate incident impact, mitigation and follow-up in Thai.",
  context: l(
    "Wybierz dwa elementy dobrego komunikatu o incydencie.",
    "Choose two elements of a good incident update.",
    "เลือกสององค์ประกอบของการอัปเดต incident ที่ดี",
  ),
  choice: {
    term: "สาเหตุหลัก",
    meanings: [
      "pierwotna przyczyna",
      "obejście",
      "czas odpowiedzi",
      "endpoint",
    ],
    correct: 0,
  },
  select: {
    values: [
      "แจ้งผลกระทบต่อผู้ใช้",
      "อธิบายวิธีลดผลกระทบ",
      "เดาโดยไม่มีหลักฐาน",
      "ซ่อนไทม์ไลน์",
    ],
    correct: [0, 1],
  },
  gap: {
    sentence: "เรา rollback release เพื่อ___ผลกระทบ",
    accepted: ["ลด", "จำกัด"],
  },
  typed: {
    source: l(
      "Napisz po tajsku: Usługa działa, ale nadal monitorujemy sytuację.",
      "Write in Thai: The service is back, but we are still monitoring.",
      "เขียนเป็นภาษาไทย: The service is back, but we are still monitoring.",
    ),
    accepted: [
      "บริการกลับมาใช้งานได้แล้ว แต่เรายังติดตามสถานการณ์อยู่",
      "ระบบกลับมาใช้งานได้แล้ว แต่เรายังเฝ้าระวังอยู่",
    ],
  },
  order: [
    "วิธีแก้ชั่วคราว",
    "ช่วยลดความเสี่ยง",
    "แต่เพิ่ม",
    "ความซับซ้อนในการดูแลระบบ",
  ],
  listening: {
    prompt: l(
      "Odsłuchaj: ตอนนี้ลูกค้าได้รับผลกระทบอย่างไร",
      "Listen: ตอนนี้ลูกค้าได้รับผลกระทบอย่างไร",
      "ฟัง: ตอนนี้ลูกค้าได้รับผลกระทบอย่างไร",
    ),
    replies: [
      "ประมาณสิบเปอร์เซ็นต์ของ request timeout ครับ",
      "ลูกค้าเป็น architecture",
      "สาเหตุอาจเป็นโต๊ะ",
      "ผลกระทบคือ code review",
    ],
    correct: 0,
  },
});

const track = (
  slug: string,
  language: "en" | "th",
  level: string,
  category: LearningTrack["category"],
  title: string,
  description: string,
  modules: LearningTrack["modules"],
): LearningTrack => ({
  slug,
  language,
  level,
  category,
  title,
  description,
  modules,
});

const englishPolishVocabularyDrill: TrackLesson = {
  slug: "english-polish-four-choice",
  position: 2,
  title: l(
    "Angielski ↔ polski · 4 odpowiedzi",
    "English ↔ Polish · four choices",
    "อังกฤษ ↔ โปแลนด์ · 4 ตัวเลือก",
  ),
  summary:
    "Recognise useful words in both directions using four plausible choices.",
  estimatedMinutes: 12,
  vocabulary: [
    {
      term: "deadline",
      definition: "termin",
      translations: l("termin", "deadline", "กำหนดเวลา"),
    },
    {
      term: "invoice",
      definition: "faktura",
      translations: l("faktura", "invoice", "ใบแจ้งหนี้"),
    },
    {
      term: "receipt",
      definition: "paragon",
      translations: l("paragon", "receipt", "ใบเสร็จ"),
    },
    {
      term: "safe",
      definition: "bezpieczny",
      translations: l("bezpieczny", "safe", "ปลอดภัย"),
    },
  ],
  exercises: [
    {
      type: "single_choice",
      prompt: l(
        "Wybierz polskie znaczenie słowa „deadline”.",
        "Choose the Polish meaning of “deadline”.",
        "เลือกความหมายภาษาโปแลนด์ของคำว่า “deadline”",
      ),
      instructions: "Choose one of four translations.",
      options: options("podróż", "termin", "spotkanie", "rachunek"),
      answer: { correct: "b" },
    },
    {
      type: "single_choice",
      prompt: l(
        "Wybierz polskie znaczenie słowa „invoice”.",
        "Choose the Polish meaning of “invoice”.",
        "เลือกความหมายภาษาโปแลนด์ของคำว่า “invoice”",
      ),
      instructions: "Choose one of four translations.",
      options: options("paragon", "podróż", "pomoc", "faktura"),
      answer: { correct: "d" },
    },
    {
      type: "single_choice",
      prompt: l(
        "Wybierz polskie znaczenie słowa „meeting”.",
        "Choose the Polish meaning of “meeting”.",
        "เลือกความหมายภาษาโปแลนด์ของคำว่า “meeting”",
      ),
      instructions: "Choose one of four translations.",
      options: options("spotkanie", "bezpieczny", "paragon", "termin"),
      answer: { correct: "a" },
    },
    {
      type: "single_choice",
      prompt: l(
        "Wybierz polskie znaczenie słowa „receipt”.",
        "Choose the Polish meaning of “receipt”.",
        "เลือกความหมายภาษาโปแลนด์ของคำว่า “receipt”",
      ),
      instructions: "Choose one of four translations.",
      options: options("pomoc", "faktura", "paragon", "podróż"),
      answer: { correct: "c" },
    },
    {
      type: "single_choice",
      prompt: l(
        "Wybierz angielskie tłumaczenie słowa „rachunek”.",
        "Choose the English translation of the Polish word “rachunek”.",
        "เลือกคำแปลภาษาอังกฤษของคำภาษาโปแลนด์ “rachunek”",
      ),
      instructions: "Choose one of four translations.",
      options: options("meeting", "bill", "journey", "help"),
      answer: { correct: "b" },
    },
    {
      type: "single_choice",
      prompt: l(
        "Wybierz angielskie tłumaczenie słowa „podróż”.",
        "Choose the English translation of the Polish word “podróż”.",
        "เลือกคำแปลภาษาอังกฤษของคำภาษาโปแลนด์ “podróż”",
      ),
      instructions: "Choose one of four translations.",
      options: options("deadline", "safe", "receipt", "journey"),
      answer: { correct: "d" },
    },
    {
      type: "single_choice",
      prompt: l(
        "Wybierz angielskie tłumaczenie słowa „pomoc”.",
        "Choose the English translation of the Polish word “pomoc”.",
        "เลือกคำแปลภาษาอังกฤษของคำภาษาโปแลนด์ “pomoc”",
      ),
      instructions: "Choose one of four translations.",
      options: options("invoice", "meeting", "help", "bill"),
      answer: { correct: "c" },
    },
    {
      type: "single_choice",
      prompt: l(
        "Wybierz angielskie tłumaczenie słowa „bezpieczny”.",
        "Choose the English translation of the Polish word “bezpieczny”.",
        "เลือกคำแปลภาษาอังกฤษของคำภาษาโปแลนด์ “bezpieczny”",
      ),
      instructions: "Choose one of four translations.",
      options: options("safe", "late", "busy", "cheap"),
      answer: { correct: "a" },
    },
  ],
};

const sentenceOrderingExercise = (
  sourcePl: string,
  words: string[],
): TrackExercise => ({
  type: "ordering",
  prompt: l(
    `Ułóż angielskie tłumaczenie zdania: „${sourcePl}”`,
    `Build the English translation of the Polish sentence: “${sourcePl}”`,
    `เรียงคำเป็นประโยคภาษาอังกฤษที่แปลจากภาษาโปแลนด์: “${sourcePl}”`,
  ),
  instructions: "Tap the words in sentence order.",
  options: words.map((text, index) => ({ id: `w${index + 1}`, text })),
  answer: { correct: words.map((_, index) => `w${index + 1}`) },
  explanation: l(
    `Poprawne tłumaczenie to „${words.join(" ")}”.`,
    `The correct translation is “${words.join(" ")}”.`,
    `คำแปลที่ถูกต้องคือ “${words.join(" ")}”`,
  ),
});

const englishSentenceBuilder: TrackLesson = {
  slug: "english-sentence-builder",
  position: 2,
  title: l(
    "Budowanie zdań z rozsypanki",
    "Build sentences from words",
    "เรียงคำเป็นประโยค",
  ),
  summary:
    "Reorder shuffled words to translate practical Polish sentences into English.",
  estimatedMinutes: 12,
  exercises: [
    sentenceOrderingExercise("Czy możesz mi pomóc?", [
      "Can",
      "you",
      "help",
      "me?",
    ]),
    sentenceOrderingExercise("Chciałbym zarezerwować stolik.", [
      "I",
      "would",
      "like",
      "to book",
      "a table.",
    ]),
    sentenceOrderingExercise("O której zaczyna się spotkanie?", [
      "What time",
      "does",
      "the meeting",
      "start?",
    ]),
    sentenceOrderingExercise("Nie rozumiem tego pytania.", [
      "I",
      "do not",
      "understand",
      "this question.",
    ]),
    sentenceOrderingExercise("Wyślę raport jutro.", [
      "I",
      "will send",
      "the report",
      "tomorrow.",
    ]),
    sentenceOrderingExercise("Czy możemy zmienić termin?", [
      "Can",
      "we",
      "change",
      "the deadline?",
    ]),
  ],
};

export const learningTracks: LearningTrack[] = [
  track(
    "english-general-b2",
    "en",
    "B2",
    "general",
    "English B2 · Upper-intermediate",
    "A complete B2 programme covering advanced grammar, fluent communication, professional English and real-world comprehension.",
    englishB2Modules,
  ),
  track(
    "english-vocabulary",
    "en",
    "A1–B1",
    "vocabulary",
    "English vocabulary",
    "Focused vocabulary practice.",
    [
      {
        slug: "workplace-words",
        title: "Workplace words",
        position: 1,
        lessons: [englishVocabulary, englishPolishVocabularyDrill],
      },
    ],
  ),
  track(
    "english-phrases",
    "en",
    "A1–B1",
    "phrases",
    "Useful English phrases",
    "Reusable phrases for real situations.",
    [
      {
        slug: "useful-phrases",
        title: "Useful phrases",
        position: 1,
        lessons: [englishPhrases, englishSentenceBuilder],
      },
    ],
  ),
  track(
    "english-business",
    "en",
    "A2–B1",
    "business",
    "Business English",
    "Meetings and professional communication.",
    [
      {
        slug: "business-conversations",
        title: "Business conversations",
        position: 1,
        lessons: [englishBusiness],
      },
    ],
  ),
  track(
    "english-for-it",
    "en",
    "A1–B2",
    "it",
    "English for IT",
    "Technical English at every supported level.",
    [
      {
        slug: "it-a1",
        title: "IT English · A1",
        position: 1,
        lessons: [englishItA1],
      },
      {
        slug: "it-a2",
        title: "IT English · A2",
        position: 2,
        lessons: [englishItA2],
      },
      {
        slug: "it-b1",
        title: "IT English · B1",
        position: 3,
        lessons: [englishItB1],
      },
      {
        slug: "it-b2",
        title: "IT English · B2",
        position: 4,
        lessons: [englishItB2],
      },
    ],
  ),
  track(
    "thai-vocabulary",
    "th",
    "A1–B1",
    "vocabulary",
    "Thai vocabulary",
    "Focused Thai vocabulary practice.",
    [
      {
        slug: "workplace-words",
        title: "คำศัพท์ในที่ทำงาน",
        position: 1,
        lessons: [thaiVocabulary],
      },
    ],
  ),
  track(
    "thai-phrases",
    "th",
    "A1–B1",
    "phrases",
    "Useful Thai phrases",
    "Reusable Thai phrases for real situations.",
    [
      {
        slug: "useful-phrases",
        title: "วลีที่ใช้บ่อย",
        position: 1,
        lessons: [thaiPhrases],
      },
    ],
  ),
  track(
    "thai-business",
    "th",
    "A2–B1",
    "business",
    "Business Thai",
    "Meetings and professional communication in Thai.",
    [
      {
        slug: "business-conversations",
        title: "การสนทนาทางธุรกิจ",
        position: 1,
        lessons: [thaiBusiness],
      },
    ],
  ),
  track(
    "thai-for-it",
    "th",
    "A1–B1",
    "it",
    "Thai for IT",
    "Practical Thai for IT at every supported level.",
    [
      {
        slug: "it-a1",
        title: "ภาษาไทยไอที · A1",
        position: 1,
        lessons: [thaiItA1],
      },
      {
        slug: "it-a2",
        title: "ภาษาไทยไอที · A2",
        position: 2,
        lessons: [thaiItA2],
      },
      {
        slug: "it-b1",
        title: "ภาษาไทยไอที · B1",
        position: 3,
        lessons: [thaiItB1],
      },
    ],
  ),
];
