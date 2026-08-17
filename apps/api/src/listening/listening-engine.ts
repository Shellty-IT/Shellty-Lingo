import type {
  CourseLanguage,
  InterfaceLocale,
  ListeningAttemptResponse,
  ListeningChallenge,
} from "@shellty/api-contracts";

import {
  c1ExamQuestions,
  localizeAssessmentQuestion,
  upperEnglishPlacementQuestions,
} from "../learning/advanced-assessment-bank";

export type ListeningLevel = "A1" | "A2" | "B1" | "B2" | "C1";
type Localized = Record<InterfaceLocale, string>;

interface ChallengeDefinition {
  id: string;
  language: CourseLanguage;
  level: ListeningLevel;
  title: Localized;
  instruction: Localized;
  audio: ListeningChallenge["audio"];
  options: ListeningChallenge["options"];
  correctOptionId: string;
  explanation: Localized;
}

const l = (pl: string, en: string, th: string): Localized => ({ pl, en, th });
const instruction = {
  en: l(
    "Posłuchaj nagrania i wybierz najlepszą odpowiedź.",
    "Listen to the recording and choose the best answer.",
    "ฟังเสียงแล้วเลือกคำตอบที่เหมาะสมที่สุด",
  ),
  th: l(
    "Posłuchaj nagrania po tajsku i wybierz najlepszą odpowiedź.",
    "Listen to the Thai recording and choose the best answer.",
    "ฟังเสียงภาษาไทยแล้วเลือกคำตอบที่เหมาะสมที่สุด",
  ),
} satisfies Record<CourseLanguage, Localized>;

const q = (
  id: string,
  language: CourseLanguage,
  level: ListeningLevel,
  title: Localized,
  audioText: string,
  answers: [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
  explanation: Localized,
): ChallengeDefinition => ({
  id,
  language,
  level,
  title,
  instruction: instruction[language],
  audio: {
    text: audioText,
    locale: language === "en" ? "en-GB" : "th-TH",
    rate: language === "en" ? 0.86 : 0.76,
  },
  options: answers.map((text, index) => ({
    id: String.fromCharCode(97 + index),
    text,
  })),
  correctOptionId: String.fromCharCode(97 + correctIndex),
  explanation,
});

const baseChallenges: ChallengeDefinition[] = [
  q(
    "en-a1-cafe-order",
    "en",
    "A1",
    l("W kawiarni", "At the café", "ที่ร้านกาแฟ"),
    "Could I have a cup of tea, please?",
    [
      "Could I have a cup of tea, please?",
      "Can I see the dinner menu?",
      "I would like a glass of water.",
      "Could I pay by card?",
    ],
    0,
    l(
      "Mówiący uprzejmie prosi o filiżankę herbaty.",
      "The speaker politely asks for a cup of tea.",
      "ผู้พูดขอชาหนึ่งถ้วยอย่างสุภาพ",
    ),
  ),
  q(
    "en-a1-introduction",
    "en",
    "A1",
    l("Przedstawianie się", "Introductions", "การแนะนำตัว"),
    "Hello, my name is Maya. Nice to meet you.",
    [
      "Maya is saying goodbye.",
      "Maya is introducing herself.",
      "Maya is asking for help.",
      "Maya is ordering food.",
    ],
    1,
    l(
      "Maya podaje swoje imię i wita rozmówcę.",
      "Maya gives her name and greets the listener.",
      "มายาบอกชื่อและทักทายผู้ฟัง",
    ),
  ),
  q(
    "en-a1-time",
    "en",
    "A1",
    l("Godzina zajęć", "Class time", "เวลาเรียน"),
    "The lesson starts at half past six.",
    ["6:15", "5:30", "7:30", "6:30"],
    3,
    l(
      "Half past six oznacza 6:30.",
      "Half past six means 6:30.",
      "half past six หมายถึง 6:30 น.",
    ),
  ),
  q(
    "en-a1-directions",
    "en",
    "A1",
    l("Proste wskazówki", "Simple directions", "การบอกทางง่าย ๆ"),
    "Turn left at the bank. The shop is next to the hotel.",
    [
      "The shop is opposite the bank.",
      "The shop is inside the hotel.",
      "The shop is next to the hotel.",
      "The shop is behind the station.",
    ],
    2,
    l(
      "Sklep znajduje się obok hotelu.",
      "The shop is next to the hotel.",
      "ร้านค้าอยู่ถัดจากโรงแรม",
    ),
  ),
  q(
    "en-a2-station-platform",
    "en",
    "A2",
    l("Na stacji", "At the station", "ที่สถานีรถไฟ"),
    "The train to Bristol leaves from platform fourteen.",
    [
      "Platform four",
      "Platform fourteen",
      "Platform forty",
      "Platform fifteen",
    ],
    1,
    l(
      "Pociąg odjeżdża z peronu czternastego.",
      "The train leaves from platform fourteen.",
      "รถไฟออกจากชานชาลาที่สิบสี่",
    ),
  ),
  q(
    "en-a2-doctor-appointment",
    "en",
    "A2",
    l("Wizyta u lekarza", "Doctor's appointment", "นัดพบแพทย์"),
    "I've had a sore throat since Monday, but I don't have a fever.",
    [
      "The speaker has a fever.",
      "The speaker became ill today.",
      "The speaker has had a sore throat since Monday.",
      "The speaker has a headache only.",
    ],
    2,
    l(
      "Ból gardła trwa od poniedziałku, ale nie ma gorączki.",
      "The sore throat started on Monday, and there is no fever.",
      "ผู้พูดเจ็บคอมาตั้งแต่วันจันทร์แต่ไม่มีไข้",
    ),
  ),
  q(
    "en-a2-hotel-change",
    "en",
    "A2",
    l("Zmiana rezerwacji", "Changing a booking", "การเปลี่ยนการจอง"),
    "I'd like to stay one more night, if the room is still available.",
    [
      "The guest wants to leave early.",
      "The guest wants a different room.",
      "The guest is cancelling the booking.",
      "The guest wants to extend the stay by one night.",
    ],
    3,
    l(
      "Gość chce przedłużyć pobyt o jedną noc.",
      "The guest wants to extend the stay by one night.",
      "แขกต้องการพักต่ออีกหนึ่งคืน",
    ),
  ),
  q(
    "en-a2-delivery",
    "en",
    "A2",
    l("Opóźniona dostawa", "A delayed delivery", "การจัดส่งล่าช้า"),
    "Your parcel was due today, but it won't arrive until Thursday.",
    [
      "The parcel will arrive on Thursday.",
      "The parcel arrived today.",
      "The parcel has been returned.",
      "The parcel will arrive tomorrow morning.",
    ],
    0,
    l(
      "Przesyłka jest opóźniona do czwartku.",
      "The parcel has been delayed until Thursday.",
      "พัสดุล่าช้าและจะมาถึงวันพฤหัสบดี",
    ),
  ),
  q(
    "en-a2-work-update",
    "en",
    "A2",
    l("Krótki status", "A short status update", "รายงานสถานะสั้น ๆ"),
    "I've finished the report, but I still need to check the figures.",
    [
      "The report has not been started.",
      "The figures have already been approved.",
      "The report is finished, but the figures need checking.",
      "The report and figures are both complete.",
    ],
    2,
    l(
      "Raport jest gotowy, lecz liczby wymagają sprawdzenia.",
      "The report is done, but the figures still need checking.",
      "รายงานเสร็จแล้วแต่ยังต้องตรวจสอบตัวเลข",
    ),
  ),
  q(
    "en-a2-weekend-plan",
    "en",
    "A2",
    l("Plany na weekend", "Weekend plans", "แผนวันหยุดสุดสัปดาห์"),
    "If it doesn't rain, we're going to cycle around the lake.",
    [
      "They will cycle whatever the weather.",
      "They will cycle if the weather is dry.",
      "They have already cycled around the lake.",
      "They are planning to swim in the lake.",
    ],
    1,
    l(
      "Wycieczka rowerowa odbędzie się, jeśli nie będzie padać.",
      "They plan to cycle only if it does not rain.",
      "พวกเขาจะปั่นจักรยานถ้าฝนไม่ตก",
    ),
  ),
  q(
    "en-a2-restaurant-problem",
    "en",
    "A2",
    l("Problem w restauracji", "A restaurant problem", "ปัญหาในร้านอาหาร"),
    "Excuse me, I ordered the soup, not the salad.",
    [
      "The customer wants both dishes.",
      "The customer ordered a salad.",
      "The customer no longer wants food.",
      "The customer received the wrong dish.",
    ],
    3,
    l(
      "Klient zamówił zupę, ale otrzymał sałatkę.",
      "The customer ordered soup but received a salad.",
      "ลูกค้าสั่งซุปแต่ได้รับสลัด",
    ),
  ),
  q(
    "en-a2-phone-message",
    "en",
    "A2",
    l("Wiadomość telefoniczna", "A phone message", "ข้อความทางโทรศัพท์"),
    "Could you ask Nina to call me back before three o'clock?",
    [
      "Nina should call back before three.",
      "Nina should arrive at three.",
      "The caller will phone again after three.",
      "The listener should call Nina tomorrow.",
    ],
    0,
    l(
      "Nina ma oddzwonić przed trzecią.",
      "The caller wants Nina to return the call before three.",
      "ผู้โทรต้องการให้นีน่าโทรกลับก่อนบ่ายสาม",
    ),
  ),
  q(
    "en-a2-course-registration",
    "en",
    "A2",
    l("Zapis na kurs", "Course registration", "การสมัครหลักสูตร"),
    "The evening class is full, but there are two places left in the morning group.",
    [
      "Both groups are full.",
      "Only the evening group has places.",
      "The morning group still has two places.",
      "The morning class has been cancelled.",
    ],
    2,
    l(
      "Dwa miejsca zostały w grupie porannej.",
      "Two places remain in the morning group.",
      "กลุ่มตอนเช้ายังเหลือที่ว่างสองที่",
    ),
  ),
  q(
    "en-b1-meeting-delay",
    "en",
    "B1",
    l("Opóźnione spotkanie", "A delayed meeting", "การประชุมล่าช้า"),
    "The meeting has been put back by half an hour because Sam's train is delayed.",
    [
      "The meeting will start thirty minutes later.",
      "The meeting has been cancelled.",
      "Sam will join online at the original time.",
      "The train is leaving half an hour early.",
    ],
    0,
    l(
      "Spotkanie rozpocznie się pół godziny później.",
      "The meeting has been moved thirty minutes later.",
      "การประชุมเลื่อนออกไปสามสิบนาที",
    ),
  ),
  q(
    "en-b1-project-risk",
    "en",
    "B1",
    l("Ryzyko projektu", "A project risk", "ความเสี่ยงของโครงการ"),
    "Unless we receive the data by Friday, we won't be able to meet the deadline.",
    [
      "The deadline has already been met.",
      "The data is no longer needed.",
      "Friday's deadline has been cancelled.",
      "Missing Friday's data may delay the work.",
    ],
    3,
    l(
      "Brak danych do piątku zagrozi terminowi.",
      "The deadline is at risk if the data does not arrive by Friday.",
      "หากไม่ได้รับข้อมูลภายในวันศุกร์ งานอาจล่าช้า",
    ),
  ),
  q(
    "en-b1-customer-feedback",
    "en",
    "B1",
    l("Opinia klienta", "Customer feedback", "ความคิดเห็นของลูกค้า"),
    "The app is easier to use now, although finding old invoices still takes too long.",
    [
      "The app has become harder to use.",
      "The app improved, but invoice search is still slow.",
      "Old invoices have disappeared.",
      "The customer dislikes every change.",
    ],
    1,
    l(
      "Obsługa się poprawiła, lecz wyszukiwanie faktur nadal jest wolne.",
      "Usability improved, but finding invoices remains slow.",
      "แอปใช้ง่ายขึ้นแต่การค้นหาใบแจ้งหนี้ยังช้า",
    ),
  ),
  q(
    "en-b1-technical-fix",
    "en",
    "B1",
    l("Rozwiązanie techniczne", "A technical fix", "การแก้ไขทางเทคนิค"),
    "Restarting the server fixed the immediate problem, but we still need to find the cause.",
    [
      "The cause has been found and removed.",
      "Restarting made the problem worse.",
      "The service works now, but the root cause is unknown.",
      "The server cannot be restarted.",
    ],
    2,
    l(
      "Usługa działa, ale przyczyna problemu nie jest znana.",
      "The immediate issue is fixed, but its root cause is unknown.",
      "ระบบกลับมาใช้งานได้แต่ยังไม่ทราบสาเหตุที่แท้จริง",
    ),
  ),
  q(
    "th-a1-cafe-order",
    "th",
    "A1",
    l("Zamawianie kawy", "Ordering coffee", "สั่งกาแฟ"),
    "ขอกาแฟหนึ่งแก้วครับ",
    [
      "ขอน้ำหนึ่งแก้วค่ะ",
      "ขอกาแฟหนึ่งแก้วครับ",
      "ขอชาเย็นสองแก้วครับ",
      "ขอข้าวหนึ่งจานครับ",
    ],
    1,
    l(
      "กาแฟ oznacza kawę, a หนึ่งแก้ว — jedną filiżankę.",
      "กาแฟ means coffee and หนึ่งแก้ว means one cup.",
      "กาแฟหมายถึง coffee และหนึ่งแก้วหมายถึง one cup",
    ),
  ),
  q(
    "th-a1-greeting",
    "th",
    "A1",
    l("Powitanie", "A greeting", "คำทักทาย"),
    "สวัสดีครับ ยินดีที่ได้รู้จัก",
    [
      "ขอบคุณมากครับ",
      "แล้วพบกันใหม่ครับ",
      "สวัสดีครับ ยินดีที่ได้รู้จัก",
      "ขอโทษครับ ไม่เข้าใจ",
    ],
    2,
    l(
      "ยินดีที่ได้รู้จัก oznacza „miło cię poznać”.",
      "ยินดีที่ได้รู้จัก means “nice to meet you”.",
      "ยินดีที่ได้รู้จักเป็นคำที่ใช้เมื่อพบกันครั้งแรก",
    ),
  ),
  q(
    "th-a1-price",
    "th",
    "A1",
    l("Pytanie o cenę", "Asking the price", "ถามราคา"),
    "อันนี้ราคาเท่าไหร่ครับ",
    [
      "Gdzie to jest?",
      "Ile to kosztuje?",
      "Która jest godzina?",
      "Jak masz na imię?",
    ],
    1,
    l(
      "ราคาเท่าไหร่ to pytanie o cenę.",
      "ราคาเท่าไหร่ asks how much something costs.",
      "ราคาเท่าไหร่ใช้ถามว่าสิ่งของมีราคาเท่าใด",
    ),
  ),
  q(
    "th-a1-number",
    "th",
    "A1",
    l("Liczba osób", "Number of people", "จำนวนคน"),
    "โต๊ะสำหรับสามคนครับ",
    [
      "Stolik dla jednej osoby",
      "Stolik dla dwóch osób",
      "Stolik dla czterech osób",
      "Stolik dla trzech osób",
    ],
    3,
    l(
      "สามคน oznacza trzy osoby.",
      "สามคน means three people.",
      "สามคนหมายถึงคนจำนวนสามคน",
    ),
  ),
  q(
    "th-a2-taxi",
    "th",
    "A2",
    l("Przejazd taksówką", "A taxi ride", "นั่งแท็กซี่"),
    "ช่วยไปส่งที่สถานีรถไฟได้ไหมครับ",
    [
      "Prośba o kurs na lotnisko",
      "Prośba o kurs na dworzec",
      "Pytanie o rozkład jazdy",
      "Prośba o zatrzymanie tutaj",
    ],
    1,
    l(
      "สถานีรถไฟ oznacza dworzec kolejowy.",
      "สถานีรถไฟ means railway station.",
      "ผู้พูดขอให้ไปส่งที่สถานีรถไฟ",
    ),
  ),
  q(
    "th-a2-appointment",
    "th",
    "A2",
    l("Zmiana terminu", "Changing an appointment", "เปลี่ยนเวลานัด"),
    "ขอเลื่อนนัดเป็นวันศุกร์ได้ไหมคะ",
    [
      "Odwołanie bez nowego terminu",
      "Potwierdzenie spotkania dziś",
      "Prośba o przełożenie na piątek",
      "Prośba o spotkanie w poniedziałek",
    ],
    2,
    l(
      "Osoba prosi o przełożenie spotkania na piątek.",
      "The speaker asks to move the appointment to Friday.",
      "ผู้พูดขอเลื่อนนัดไปเป็นวันศุกร์",
    ),
  ),
  q(
    "th-a2-directions",
    "th",
    "A2",
    l("Droga do banku", "Directions to the bank", "ทางไปธนาคาร"),
    "เดินตรงไปแล้วเลี้ยวซ้าย ธนาคารอยู่ข้างร้านกาแฟ",
    [
      "Bank jest za hotelem",
      "Bank jest naprzeciw stacji",
      "Bank jest obok kawiarni",
      "Bank jest po prawej stronie",
    ],
    2,
    l(
      "Bank znajduje się obok kawiarni, po skręcie w lewo.",
      "The bank is next to the café after a left turn.",
      "ธนาคารอยู่ข้างร้านกาแฟหลังจากเลี้ยวซ้าย",
    ),
  ),
  q(
    "th-a2-work-status",
    "th",
    "A2",
    l("Status pracy", "Work status", "สถานะงาน"),
    "รายงานเสร็จแล้ว แต่ยังไม่ได้ส่งให้ลูกค้า",
    [
      "Raport jest gotowy, ale nie został wysłany",
      "Klient zatwierdził raport",
      "Raport nie został rozpoczęty",
      "Raport trzeba napisać od nowa",
    ],
    0,
    l(
      "Raport jest ukończony, lecz klient jeszcze go nie otrzymał.",
      "The report is complete, but it has not been sent to the client.",
      "รายงานเสร็จแล้วแต่ยังไม่ได้ส่งให้ลูกค้า",
    ),
  ),
  q(
    "th-b1-project-risk",
    "th",
    "B1",
    l("Ryzyko projektu", "A project risk", "ความเสี่ยงของโครงการ"),
    "ถ้าไม่ได้ข้อมูลภายในวันศุกร์ โครงการอาจล่าช้า",
    [
      "Projekt zakończy się wcześniej",
      "Brak danych może opóźnić projekt",
      "Dane nie są już potrzebne",
      "Termin przesunięto na dziś",
    ],
    1,
    l(
      "Brak danych do piątku może spowodować opóźnienie.",
      "The project may be delayed if the data does not arrive by Friday.",
      "โครงการอาจล่าช้าหากไม่ได้ข้อมูลภายในวันศุกร์",
    ),
  ),
  q(
    "th-b1-customer-feedback",
    "th",
    "B1",
    l("Opinia klienta", "Customer feedback", "ความคิดเห็นของลูกค้า"),
    "ระบบใหม่ใช้ง่ายขึ้น แต่ยังทำงานช้าในโทรศัพท์รุ่นเก่า",
    [
      "System jest wolny na każdym telefonie",
      "Klient odrzuca cały system",
      "System jest łatwiejszy, ale wolny na starszych telefonach",
      "Starsze telefony działają szybciej",
    ],
    2,
    l(
      "System jest łatwiejszy, ale starsze telefony działają wolno.",
      "The system is easier to use but remains slow on older phones.",
      "ระบบใช้ง่ายขึ้นแต่ยังช้าในโทรศัพท์รุ่นเก่า",
    ),
  ),
  q(
    "th-b1-meeting",
    "th",
    "B1",
    l("Przełożone spotkanie", "A rescheduled meeting", "การเลื่อนประชุม"),
    "การประชุมถูกเลื่อนไปเป็นบ่ายสามโมงเพราะผู้จัดการยังมาไม่ถึง",
    [
      "Spotkanie odwołano",
      "Spotkanie zacznie się o 13:00",
      "Menedżer już przyjechał",
      "Spotkanie przeniesiono na 15:00",
    ],
    3,
    l(
      "Spotkanie przesunięto na 15:00.",
      "The meeting moved to 3 p.m.",
      "การประชุมเลื่อนไปเวลา 15.00 น.",
    ),
  ),
  q(
    "th-b1-support",
    "th",
    "B1",
    l("Pomoc techniczna", "Technical support", "ฝ่ายสนับสนุนด้านเทคนิค"),
    "รีสตาร์ตเครื่องแล้วใช้งานได้ แต่ยังไม่ทราบสาเหตุของปัญหา",
    [
      "Problem rozwiązano i znaleziono przyczynę",
      "Po restarcie działa, lecz przyczyna jest nieznana",
      "Restart pogorszył sytuację",
      "Urządzenia nie można uruchomić ponownie",
    ],
    1,
    l(
      "Restart przywrócił działanie, ale przyczyna pozostaje nieznana.",
      "Restarting restored service, but the cause is still unknown.",
      "รีสตาร์ตแล้วใช้งานได้แต่ยังไม่ทราบสาเหตุ",
    ),
  ),
];

const advancedEnglishChallenges = (): ChallengeDefinition[] =>
  [...upperEnglishPlacementQuestions, ...c1ExamQuestions]
    .filter((question) => question.skill === "listening" && question.audioText)
    .map((question) => {
      const localized = localizeAssessmentQuestion(question, "en");
      const level: ListeningLevel = question.id.startsWith("c1-") ? "C1" : "B2";
      return {
        id: question.id,
        language: "en",
        level,
        title: l(
          `Rozumienie ze słuchu · ${level}`,
          `Listening comprehension · ${level}`,
          `การฟังเพื่อความเข้าใจ · ${level}`,
        ),
        instruction: {
          pl: localizeAssessmentQuestion(question, "pl").prompt,
          en: localized.prompt,
          th: localizeAssessmentQuestion(question, "th").prompt,
        },
        audio: { text: question.audioText!, locale: "en-GB", rate: 0.9 },
        options: localized.options,
        correctOptionId: localized.correct,
        explanation: l(
          "Odsłuchaj ponownie i porównaj kluczowe słowa z poprawną odpowiedzią.",
          "Listen again and compare the key phrases with the correct answer.",
          "ฟังอีกครั้งแล้วเปรียบเทียบวลีสำคัญกับคำตอบที่ถูกต้อง",
        ),
      };
    });

const definitions = (): ChallengeDefinition[] => [
  ...baseChallenges,
  ...advancedEnglishChallenges(),
];

const shuffle = <T>(items: T[], random: () => number): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
};

export function listeningChallenges(
  language: CourseLanguage,
  level?: ListeningLevel,
  locale: InterfaceLocale = "pl",
  random: () => number = Math.random,
): ListeningChallenge[] {
  return shuffle(
    definitions().filter(
      (challenge) =>
        challenge.language === language &&
        (level === undefined || challenge.level === level),
    ),
    random,
  ).map((challenge) => ({
    id: challenge.id,
    language: challenge.language,
    level: challenge.level,
    title: challenge.title[locale],
    instruction: challenge.instruction[locale],
    audio: challenge.audio,
    options: shuffle(challenge.options, random),
  }));
}

export function listeningChallengeLanguage(
  challengeId: string,
): CourseLanguage | undefined {
  return definitions().find((item) => item.id === challengeId)?.language;
}

export function gradeListeningChallenge(
  challengeId: string,
  optionId: string,
  locale: InterfaceLocale = "pl",
): ListeningAttemptResponse | null {
  const all = definitions();
  const challenge = all.find((item) => item.id === challengeId);
  if (!challenge || !challenge.options.some((option) => option.id === optionId))
    return null;
  const siblings = all.filter(
    (item) =>
      item.language === challenge.language && item.level === challenge.level,
  );
  const position = siblings.findIndex((item) => item.id === challenge.id);
  return {
    challengeId,
    correct: optionId === challenge.correctOptionId,
    transcript: challenge.audio.text,
    explanation: challenge.explanation[locale],
    nextChallengeId: siblings[position + 1]?.id ?? null,
  };
}
