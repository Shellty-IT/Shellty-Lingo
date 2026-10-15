import type { CourseLanguage, InterfaceLocale } from "@shellty/api-contracts";

type Localized = Record<InterfaceLocale, string>;
export type TheoryLevel = "A1" | "A2" | "B1" | "B2" | "C1";
export type TheoryLesson = {
  id: string;
  language: CourseLanguage;
  level: TheoryLevel;
  title: Localized;
  introduction: Localized;
  rule: Localized;
  formula: string;
  examples: Array<{ sentence: string; meaning: Localized }>;
  pitfalls: Localized;
  practiceSlugs: string[];
};
const l = (pl: string, en: string, th: string): Localized => ({ pl, en, th });
const example = (sentence: string, pl: string, th: string) => ({
  sentence,
  meaning: l(pl, sentence, th),
});

/** Reading lessons ship with the app, so reading never requires an AI call or
 * a practice attempt. Examples are illustrative, not assessment answer keys. */
export const theoryLessons: TheoryLesson[] = [
  {
    id: "en-be",
    language: "en",
    level: "A1",
    title: l(
      "Budowa zdania i czasownik be",
      "Sentence structure and be",
      "โครงสร้างประโยคและ be",
    ),
    introduction: l(
      "Zacznij od podmiotu: kto lub co? Potem dodaj orzeczenie: co robi lub jaki jest? W angielskim zwykle nie pomijamy podmiotu.",
      "Start with the subject: who or what? Then add the predicate: what does it do or what is it like? English normally keeps the subject.",
      "เริ่มจากประธานว่าใครหรืออะไร แล้วเติมภาคแสดงว่าทำอะไรหรือเป็นอย่างไร ภาษาอังกฤษปกติไม่ละประธาน",
    ),
    rule: l(
      "Be opisuje tożsamość, stan lub miejsce. W teraźniejszości: I am, you/we/they are, he/she/it is. Przymiotnik wymaga łącznika be: I am ready. W pytaniu przesuń be przed podmiot. W przeczeniu dodaj not po be. Nie używaj do/does z takim be.",
      "Be describes identity, state or location. In the present: I am, you/we/they are, he/she/it is. Adjectives need linking be: I am ready. Questions put be before the subject; negatives add not after be. Do not use do/does with this be.",
      "be บอกตัวตน สภาพ หรือสถานที่ ปัจจุบันใช้ I am, you/we/they are, he/she/it is คุณศัพท์ต้องมีกริยาเชื่อม เช่น I am ready คำถามวาง be ก่อนประธาน ปฏิเสธเติม not หลัง be ไม่ใช้ do/does",
    ),
    formula:
      "+ I am ready.\n− I am not ready.\n? Are you ready?\nWh- Where is the office?",
    examples: [
      example(
        "The account is active.",
        "Konto jest aktywne.",
        "บัญชีใช้งานอยู่",
      ),
      example("Are they at home?", "Czy oni są w domu?", "พวกเขาอยู่บ้านไหม"),
    ],
    pitfalls: l(
      "Nie: „I ready” — brakuje am. Nie: „Does she is ready?” — przy be nie dodajemy does. Poprawnie: „Is she ready?” Your oznacza „twój”, a you — „ty”: „What is your name?”.",
      "Not “I ready”: am is missing. Not “Does she is ready?”: be does not need does. Use “Is she ready?” Your is possessive; you is a subject/object pronoun: “What is your name?”",
      "“I ready” ขาด am ส่วน “Does she is ready?” ไม่ต้องมี does ใช้ “Is she ready?” your แสดงเจ้าของ ต่างจาก you เช่น “What is your name?”",
    ),
    practiceSlugs: ["introducing-yourself", "it-access-and-devices-a1"],
  },
  {
    id: "en-present-simple",
    language: "en",
    level: "A1",
    title: l(
      "Present Simple: zwyczaje i fakty",
      "Present Simple: habits and facts",
      "Present Simple: กิจวัตรและข้อเท็จจริง",
    ),
    introduction: l(
      "Używaj tego czasu do rutyn, stałych stanów i ogólnych faktów. Often, usually i every day często wskazują regularność.",
      "Use this tense for routines, stable states and general facts. Often, usually and every day commonly mark regularity.",
      "ใช้กับกิจวัตร สภาพคงที่ และข้อเท็จจริงทั่วไป often, usually และ every day มักบอกความสม่ำเสมอ",
    ),
    rule: l(
      "Po I/you/we/they użyj formy podstawowej. Po he/she/it dodaj -s lub -es; have zmienia się na has. Pytanie tworzy do/does + podmiot + forma podstawowa. Przeczenie: don't/doesn't + forma podstawowa. Operator does przejmuje oznaczenie trzeciej osoby, więc drugi czasownik nie ma -s.",
      "I/you/we/they take the base verb. He/she/it adds -s or -es; have becomes has. Questions use do/does + subject + base verb. Negatives use don't/doesn't + base verb. Does already marks third person, so the main verb loses -s.",
      "I/you/we/they ใช้รูปพื้นฐาน he/she/it เติม -s หรือ -es และ have เปลี่ยนเป็น has คำถามใช้ do/does + ประธาน + รูปพื้นฐาน ปฏิเสธใช้ don't/doesn't + รูปพื้นฐาน does แสดงบุรุษที่สามแล้ว กริยาหลักจึงไม่เติม -s",
    ),
    formula:
      "+ She works here.\n− She doesn't work here.\n? Does she work here?\nWh- Where does she work?",
    examples: [
      example(
        "I check my email every morning.",
        "Sprawdzam pocztę każdego ranka.",
        "ฉันตรวจอีเมลทุกเช้า",
      ),
      example(
        "The server sends a report every day.",
        "Serwer wysyła raport codziennie.",
        "เซิร์ฟเวอร์ส่งรายงานทุกวัน",
      ),
    ],
    pitfalls: l(
      "Nie: „Does he works?” ani „He doesn't works”. Poprawnie: „Does he work?” i „He doesn't work”. Be ma osobny schemat: „Is he busy?”, a nie „Does he be busy?”.",
      "Avoid “Does he works?” and “He doesn't works”. Use “Does he work?” and “He doesn't work”. Be follows its own pattern: “Is he busy?”, not “Does he be busy?”.",
      "ไม่ใช้ “Does he works?” หรือ “He doesn't works” ใช้ “Does he work?” และ “He doesn't work” ส่วน be ใช้ “Is he busy?”",
    ),
    practiceSlugs: ["describing-your-day", "it-support-basics-a1"],
  },
  {
    id: "en-requests",
    language: "en",
    level: "A1",
    title: l(
      "Prośby, polecenia i czasowniki modalne",
      "Requests, instructions and modals",
      "คำขอ คำสั่ง และกริยาช่วย modal",
    ),
    introduction: l(
      "To samo działanie można wyrazić jako polecenie albo uprzejmą prośbę. Dobierz formę do relacji z rozmówcą.",
      "The same action can be a command or a polite request. Choose a form that fits your relationship with the listener.",
      "การกระทำเดียวกันพูดเป็นคำสั่งหรือคำขอสุภาพได้ เลือกรูปให้เหมาะกับผู้ฟัง",
    ),
    rule: l(
      "Tryb rozkazujący zaczyna się od formy podstawowej, zwykle bez you. Can/could + osoba + czasownik też wymaga formy podstawowej bez to. Could jest tu uprzejmą prośbą, nie opisem przeszłości. Would like łączy się z to + czasownik, natomiast would you mind — z -ing.",
      "Imperatives start with a base verb, usually without you. Can/could + subject + verb also takes a base form without to. Could expresses politeness here, not past time. Would like takes to + verb; would you mind takes -ing.",
      "คำสั่งเริ่มด้วยกริยารูปพื้นฐานและมักละ you ส่วน can/could + ประธาน + กริยาก็ใช้รูปพื้นฐานไม่มี to could ในคำขอบอกความสุภาพ ไม่ใช่อดีต would like ตามด้วย to + กริยา แต่ would you mind ตามด้วย -ing",
    ),
    formula:
      "Open the window.\nCould you open the window, please?\nI would like to ask a question.\nWould you mind opening the window?",
    examples: [
      example(
        "Could you repeat the address, please?",
        "Czy możesz powtórzyć adres?",
        "ช่วยทวนที่อยู่อีกครั้งได้ไหม",
      ),
      example(
        "Please save your work before closing the app.",
        "Zapisz proszę pracę przed zamknięciem aplikacji.",
        "โปรดบันทึกงานก่อนปิดแอป",
      ),
    ],
    pitfalls: l(
      "Nie: „Could you to help?” — po could nie ma to. Nie: „Would you mind help?” — po mind użyj helping. „Do it now” jest gramatyczne, ale może brzmieć rozkazująco.",
      "Not “Could you to help?”: could takes no to. Not “Would you mind help?”: mind requires helping. “Do it now” is grammatical but may sound abrupt.",
      "“Could you to help?” ไม่ใช้ to หลัง could ส่วน “Would you mind help?” ต้องเป็น helping คำสั่ง “Do it now” ถูกไวยากรณ์แต่อาจห้วน",
    ),
    practiceSlugs: ["polite-requests", "it-troubleshooting-steps-a1"],
  },
  {
    id: "en-continuous",
    language: "en",
    level: "A2",
    title: l(
      "Present Continuous: co dzieje się teraz",
      "Present Continuous: happening now",
      "Present Continuous: สิ่งที่กำลังเกิด",
    ),
    introduction: l(
      "Ten czas opisuje czynność w toku teraz lub w bieżącym, tymczasowym okresie. Porównaj rutynę z działaniem w tej chwili.",
      "This tense describes an action in progress now or during a temporary current period. Compare a routine with what is happening at the moment.",
      "ใช้บอกสิ่งที่กำลังดำเนินตอนนี้หรือในช่วงปัจจุบันชั่วคราว เปรียบเทียบกิจวัตรกับสิ่งที่กำลังทำ",
    ),
    rule: l(
      "Potrzebujesz dwóch elementów: am/is/are oraz czasownika z -ing. W pytaniu przesuń be przed podmiot; w przeczeniu dodaj not. Czasowniki stanów, np. know, need, understand, zwykle występują w Present Simple, gdy opisują stan.",
      "You need both am/is/are and a verb ending in -ing. Questions move be before the subject; negatives add not. State verbs such as know, need and understand usually use Present Simple when describing a state.",
      "ต้องมีทั้ง am/is/are และกริยา -ing คำถามย้าย be ก่อนประธาน ปฏิเสธเติม not กริยาสภาพเช่น know, need, understand มักใช้ Present Simple เมื่อบอกสภาพ",
    ),
    formula:
      "+ They are testing the app.\n− They aren't testing the app.\n? Are they testing the app?",
    examples: [
      example(
        "I work from home every Friday.",
        "Pracuję z domu w każdy piątek.",
        "ฉันทำงานจากบ้านทุกวันศุกร์",
      ),
      example(
        "I am working from home today.",
        "Dzisiaj pracuję z domu.",
        "วันนี้ฉันกำลังทำงานจากบ้าน",
      ),
    ],
    pitfalls: l(
      "Nie: „She working” — brakuje is. Nie: „She is work” — potrzebne working. „I am knowing” zwykle zastąp „I know”, jeśli mówisz o posiadanej wiedzy.",
      "Not “She working”: is is missing. Not “She is work”: use working. For knowledge as a state, normally use “I know”, not “I am knowing”.",
      "“She working” ขาด is และ “She is work” ต้องเป็น working หากหมายถึงความรู้ที่มีใช้ “I know” ไม่ใช่ “I am knowing”",
    ),
    practiceSlugs: ["english-sentence-builder", "talking-about-weather"],
  },
  {
    id: "en-past-simple",
    language: "en",
    level: "A2",
    title: l(
      "Past Simple: zakończona przeszłość",
      "Past Simple: finished past events",
      "Past Simple: เหตุการณ์อดีตที่จบแล้ว",
    ),
    introduction: l(
      "Używaj Past Simple, gdy opowiadasz o zakończonych wydarzeniach, np. yesterday, last week, two hours ago.",
      "Use Past Simple for completed events, often with yesterday, last week or two hours ago.",
      "ใช้ Past Simple กับเหตุการณ์จบแล้ว มักมี yesterday, last week หรือ two hours ago",
    ),
    rule: l(
      "Twierdzenie ma II formę czasownika: regularne -ed lub formę nieregularną, np. go → went. W pytaniu i przeczeniu operator did/didn't łączy się z formą podstawową. Be ma was/were i nie potrzebuje did.",
      "Affirmatives use the past form: regular -ed or an irregular form such as go → went. Questions and negatives use did/didn't + base verb. Be has was/were and does not need did.",
      "บอกเล่าใช้กริยาอดีต เติม -ed หรือรูปไม่ปกติเช่น go → went คำถามและปฏิเสธใช้ did/didn't + รูปพื้นฐาน ส่วน be ใช้ was/were ไม่ต้องมี did",
    ),
    formula:
      "+ We sent the report yesterday.\n− We didn't send it.\n? Did you send it?\nBe: Were you busy?",
    examples: [
      example(
        "The meeting started at nine.",
        "Spotkanie zaczęło się o dziewiątej.",
        "การประชุมเริ่มตอนเก้าโมง",
      ),
      example(
        "When did the error appear?",
        "Kiedy pojawił się błąd?",
        "ข้อผิดพลาดปรากฏเมื่อไร",
      ),
    ],
    pitfalls: l(
      "Nie: „Did you sent?” — did już wskazuje przeszłość, więc użyj send. Nie: „I had went” — po had potrzebna jest III forma gone, a to już konstrukcja Past Perfect.",
      "Not “Did you sent?”: did already marks the past, so use send. Not “I had went”: had requires past participle gone, which belongs to Past Perfect.",
      "“Did you sent?” ใช้ send เพราะ did บอกอดีตแล้ว ส่วน “I had went” ต้องใช้ gone หลัง had ซึ่งเป็น Past Perfect",
    ),
    practiceSlugs: ["english-sentence-builder", "it-version-control-a2"],
  },
  {
    id: "en-future",
    language: "en",
    level: "A2",
    title: l(
      "Przyszłość: will, going to i określenia czasu",
      "Future: will, going to and time clauses",
      "อนาคต: will, going to และอนุประโยคเวลา",
    ),
    introduction: l(
      "Angielski ma kilka sposobów mówienia o przyszłości. Will często służy decyzjom w chwili mówienia, obietnicom i przewidywaniom. Going to opisuje zamiar lub przewidywanie na podstawie obecnych oznak.",
      "English has several ways to express the future. Will often marks immediate decisions, promises and predictions. Going to expresses intentions or predictions based on current evidence.",
      "ภาษาอังกฤษบอกอนาคตได้หลายแบบ will มักใช้ตัดสินใจทันที สัญญา หรือคาดการณ์ going to ใช้บอกความตั้งใจหรือคาดจากหลักฐานปัจจุบัน",
    ),
    rule: l(
      "Po will/won't użyj formy podstawowej bez to. Going to potrzebuje be: am/is/are going to + czasownik. Po when, before i after w typowej klauzuli czasowej dotyczącej przyszłości stosuj Present Simple, nie will.",
      "Will/won't takes a base verb without to. Going to needs be: am/is/are going to + verb. Typical future time clauses with when, before or after use Present Simple rather than will.",
      "หลัง will/won't ใช้รูปพื้นฐานไม่มี to ส่วน going to ต้องมี be: am/is/are going to + กริยา อนุประโยคเวลาอนาคตทั่วไปหลัง when, before, after ใช้ Present Simple ไม่ใช้ will",
    ),
    formula:
      "I will call you. / I won't call today.\nWe are going to test it.\nWe will publish it after the review finishes.",
    examples: [
      example(
        "I'll send the file after the meeting ends.",
        "Wyślę plik, gdy spotkanie się skończy.",
        "ฉันจะส่งไฟล์หลังประชุมจบ",
      ),
      example(
        "We are going to update the documentation.",
        "Zamierzamy zaktualizować dokumentację.",
        "เราตั้งใจจะอัปเดตเอกสาร",
      ),
    ],
    pitfalls: l(
      "Nie: „will moved”, „will to send” ani „will sends”. Użyj will move/send. Nie pomijaj be w „We are going to …”.",
      "Avoid “will moved”, “will to send” and “will sends”. Use will move/send. Keep be in “We are going to …”.",
      "ไม่ใช้ “will moved”, “will to send” หรือ “will sends” ใช้ will move/send และอย่าละ be ใน “We are going to …”",
    ),
    practiceSlugs: ["it-testing-and-release-a2", "english-sentence-builder"],
  },
  {
    id: "en-present-perfect",
    language: "en",
    level: "B1",
    title: l(
      "Present Perfect a Past Simple",
      "Present Perfect versus Past Simple",
      "Present Perfect เทียบกับ Past Simple",
    ),
    introduction: l(
      "Present Perfect łączy przeszłość z teraźniejszością: rezultat teraz, doświadczenie do dziś lub stan trwający od pewnego momentu.",
      "Present Perfect connects past and present: a current result, experience up to now, or a state continuing from an earlier time.",
      "Present Perfect เชื่อมอดีตกับปัจจุบัน เช่น ผลตอนนี้ ประสบการณ์จนถึงวันนี้ หรือสภาพที่ต่อเนื่องจากอดีต",
    ),
    rule: l(
      "Budowa: have/has + III forma (past participle). Since wskazuje początek, for — długość okresu. Past Simple wybieramy dla zakończonego momentu, np. yesterday; Present Perfect dla rezultatu lub okresu obejmującego teraz. W pytaniu have/has staje przed podmiotem.",
      "Form: have/has + past participle. Since gives the starting point; for gives duration. Past Simple fits a finished time such as yesterday; Present Perfect fits current results or a period including now. Questions invert have/has and the subject.",
      "รูปคือ have/has + ช่อง 3 since บอกจุดเริ่ม for บอกระยะเวลา Past Simple ใช้เวลาที่จบแล้วเช่น yesterday ส่วน Present Perfect ใช้ผลปัจจุบันหรือช่วงเวลารวมตอนนี้ คำถามสลับ have/has กับประธาน",
    ),
    formula:
      "She has fixed the bug.\nHas she fixed it? / She hasn't fixed it.\nShe fixed it yesterday.",
    examples: [
      example(
        "We have used this tool for two years.",
        "Używamy tego narzędzia od dwóch lat.",
        "เราใช้เครื่องมือนี้มาสองปีแล้ว",
      ),
      example(
        "I sent the message an hour ago.",
        "Wysłałem wiadomość godzinę temu.",
        "ฉันส่งข้อความเมื่อหนึ่งชั่วโมงก่อน",
      ),
    ],
    pitfalls: l(
      "Nie: „has went” — III forma to gone. Standardowo nie łącz „I have sent it” z zakończonym yesterday; powiedz „I sent it yesterday”. Since 2024, ale for two years.",
      "Not “has went”: the participle is gone. Normally do not combine “I have sent it” with finished-time yesterday; say “I sent it yesterday”. Since 2024, but for two years.",
      "ไม่ใช้ “has went” ต้องเป็น gone ปกติ yesterday ใช้ “I sent it yesterday” ไม่ใช่ have sent ใช้ since 2024 แต่ for two years",
    ),
    practiceSlugs: ["business-status-meeting", "it-incidents-b1"],
  },
  {
    id: "en-real-conditionals",
    language: "en",
    level: "B1",
    title: l(
      "Zerowy i pierwszy okres warunkowy",
      "Zero and first conditionals",
      "เงื่อนไขแบบศูนย์และแบบที่หนึ่ง",
    ),
    introduction: l(
      "Najpierw zdecyduj: czy opisujesz ogólną prawidłowość, czy możliwą sytuację w przyszłości? To rozróżnienie wybiera konstrukcję.",
      "First decide whether you mean a general rule or a possible future situation. This determines the structure.",
      "ก่อนเลือกโครงสร้าง ให้แยกว่าพูดถึงกฎทั่วไปหรือสถานการณ์อนาคตที่เป็นไปได้",
    ),
    rule: l(
      "Zerowy okres: if + Present Simple, Present Simple — stały skutek. Pierwszy: if + Present Simple, will + forma podstawowa — realna możliwość w przyszłości. W części wynikowej możliwe są też can/may lub polecenie. Przy warunku na początku zwykle stawiamy przecinek.",
      "Zero: if + Present Simple, Present Simple, for a regular result. First: if + Present Simple, will + base verb, for a real future possibility. The result can also use can/may or an imperative. An initial if-clause is normally followed by a comma.",
      "แบบศูนย์ใช้ if + Present Simple, Present Simple บอกผลประจำ แบบหนึ่งใช้ if + Present Simple, will + รูปพื้นฐาน บอกอนาคตที่เป็นไปได้ ส่วนผลใช้ can/may หรือคำสั่งได้ ถ้า if อยู่ต้นมักมีจุลภาคคั่น",
    ),
    formula:
      "0: If water freezes, it expands.\n1: If it rains tomorrow, we will stay inside.\nIf you need help, call me.",
    examples: [
      example(
        "If a request fails, the system retries it.",
        "Jeśli żądanie się nie powiedzie, system je ponawia.",
        "หากคำขอล้มเหลว ระบบจะลองใหม่",
      ),
      example(
        "If we finish early, we will send the results today.",
        "Jeśli skończymy wcześniej, wyślemy wyniki dzisiaj.",
        "ถ้าเราเสร็จเร็ว เราจะส่งผลวันนี้",
      ),
    ],
    pitfalls: l(
      "W zwykłym warunku przyszłym nie: „If it will rain …”, lecz „If it rains …”. Nie myl „if” (jeśli) z „when” (kiedy): when sugeruje oczekiwane zdarzenie, if — warunek.",
      "For an ordinary future condition, use “If it rains …”, not “If it will rain …”. If states a condition; when presents an event as expected.",
      "เงื่อนไขอนาคตทั่วไปใช้ “If it rains …” ไม่ใช่ “If it will rain …” if บอกเงื่อนไข ส่วน when มองว่าเหตุการณ์จะเกิด",
    ),
    practiceSlugs: ["it-incident-response-b1", "it-api-observability-b1"],
  },
  {
    id: "en-second-conditional",
    language: "en",
    level: "B2",
    title: l(
      "Drugi okres warunkowy: gdyby teraz…",
      "Second conditional: imagining now",
      "เงื่อนไขแบบที่สอง: สมมติปัจจุบัน",
    ),
    introduction: l(
      "Wyobrażasz sobie sytuację inną niż obecna albo mało prawdopodobną przyszłość. Forma przeszła nie oznacza tu automatycznie czasu przeszłego — sygnalizuje dystans od rzeczywistości.",
      "Imagine a different present or an unlikely future. The past form does not automatically mean past time here: it marks distance from reality.",
      "ใช้สมมติปัจจุบันที่ต่างจากจริงหรืออนาคตที่ไม่น่าเกิด รูปอดีตไม่ได้หมายถึงอดีตเสมอ แต่แสดงความห่างจากความจริง",
    ),
    rule: l(
      "If + Past Simple, would + forma podstawowa. Dla be w starannym stylu używamy were przy każdej osobie; was występuje w mowie potocznej. Skutek w toku można wyrazić przez would be + -ing. Przykład z capacity mówi o hipotetycznych zasobach teraz, więc wynik wymaga would + czasownik, np. would complete.",
      "If + Past Simple, would + base verb. Formal hypothetical be uses were for all persons; was occurs informally. An ongoing result can use would be + -ing. A capacity condition imagines resources now, so its result needs would + verb, such as would complete.",
      "ใช้ if + Past Simple, would + รูปพื้นฐาน be แบบสมมติทางการใช้ were ทุกบุรุษ ภาษาพูดพบ was ได้ ผลที่กำลังดำเนินใช้ would be + -ing เงื่อนไขเรื่อง capacity สมมติทรัพยากรตอนนี้ ผลจึงใช้ would + กริยา เช่น would complete",
    ),
    formula:
      "If + Past Simple, would + V1\nIf we had more time, we would test another version.\nIf I were you, I would ask for help.",
    examples: [
      example(
        "If the office were closer, I would walk to work.",
        "Gdyby biuro było bliżej, chodziłbym do pracy pieszo.",
        "ถ้าสำนักงานอยู่ใกล้กว่านี้ ฉันคงเดินไปทำงาน",
      ),
      example(
        "If the connection were faster, we would be downloading the file now.",
        "Gdyby połączenie było szybsze, pobieralibyśmy teraz plik.",
        "ถ้าการเชื่อมต่อเร็วกว่านี้ เราคงกำลังดาวน์โหลดไฟล์อยู่ตอนนี้",
      ),
    ],
    pitfalls: l(
      "Nie: „If I would have time …” w zwykłym warunku; użyj „If I had time …”. Nie: „we will moved” — po modalnym potrzebna forma podstawowa, a hipotetyczny wynik to „we would move”. Had w „If we had more time” jest Past Simple od have, nie Past Perfect.",
      "For an ordinary condition use “If I had time …”, not “If I would have time …”. Never “we will moved”: modals need a base verb, and the hypothetical result is “we would move”. Had in “If we had more time” is Past Simple of have, not Past Perfect.",
      "เงื่อนไขทั่วไปใช้ “If I had time …” ไม่ใช่ “If I would have time …” ไม่ใช้ “we will moved” เพราะ modal ต้องตามด้วยรูปพื้นฐาน ผลสมมติใช้ “we would move” had ใน “If we had more time” เป็น Past Simple ของ have ไม่ใช่ Past Perfect",
    ),
    practiceSlugs: ["conditionals-and-regrets-b2"],
  },
];

theoryLessons.push(
  {
    id: "en-narrative",
    language: "en",
    level: "B2",
    title: l(
      "Czasy narracyjne: kolejność i trwanie",
      "Narrative tenses: order and duration",
      "กาลเล่าเรื่อง: ลำดับและระยะเวลา",
    ),
    introduction: l(
      "W opowieści o przeszłości odróżnij główne wydarzenie, jego tło i to, co stało się wcześniej. Nie wybieraj czasu wyłącznie po polskim tłumaczeniu.",
      "In a past narrative, distinguish the main event, its background and what happened earlier. Do not choose tense solely from a translation.",
      "เมื่อเล่าอดีต ให้แยกเหตุการณ์หลัก ฉากหลัง และสิ่งที่เกิดก่อน อย่าเลือกกาลจากคำแปลอย่างเดียว",
    ),
    rule: l(
      "Past Simple przesuwa akcję do przodu. Past Continuous (was/were + -ing) daje trwające tło. Past Perfect (had + III forma) pokazuje wydarzenie wcześniejsze niż inny punkt w przeszłości. Past Perfect Continuous (had been + -ing) podkreśla trwanie do tego punktu, często z for/since. III forma to np. gone, seen, known, written.",
      "Past Simple moves the story forward. Past Continuous (was/were + -ing) gives ongoing background. Past Perfect (had + participle) places an event before another past point. Past Perfect Continuous (had been + -ing) stresses duration up to it, often with for/since. Participles include gone, seen, known and written.",
      "Past Simple เล่าเหตุการณ์ต่อไป Past Continuous (was/were + -ing) บอกฉากหลังที่กำลังเกิด Past Perfect (had + ช่อง 3) บอกสิ่งที่เกิดก่อนอีกจุดในอดีต Past Perfect Continuous (had been + -ing) เน้นระยะเวลาถึงจุดนั้น มักใช้ for/since ช่อง 3 เช่น gone, seen, known, written",
    ),
    formula:
      "I was reading when the phone rang.\nThey had left before I arrived.\nShe had been working for two hours when we called.",
    examples: [
      example(
        "The backup had finished before the server stopped.",
        "Kopia zapasowa została ukończona, zanim serwer przestał działać.",
        "การสำรองข้อมูลเสร็จก่อนเซิร์ฟเวอร์หยุดทำงาน",
      ),
      example(
        "We had been waiting for twenty minutes when the train arrived.",
        "Czekaliśmy już dwadzieścia minut, gdy przyjechał pociąg.",
        "เรารอมาแล้วยี่สิบนาทีเมื่อรถไฟมาถึง",
      ),
    ],
    pitfalls: l(
      "Nie: „had went” — użyj had gone. Nie: „had been wait” — użyj had been waiting. Samo yesterday nie wymaga Past Perfect: „I went there yesterday” wystarcza bez drugiego punktu odniesienia.",
      "Not “had went”: use had gone. Not “had been wait”: use had been waiting. Yesterday alone does not require Past Perfect; “I went there yesterday” is enough without another past reference.",
      "ไม่ใช้ “had went” แต่ใช้ had gone ไม่ใช้ “had been wait” แต่ใช้ had been waiting yesterday อย่างเดียวไม่ต้องเป็น Past Perfect ใช้ “I went there yesterday” ได้",
    ),
    practiceSlugs: ["narrative-tenses-b2"],
  },
  {
    id: "en-third-conditional",
    language: "en",
    level: "B2",
    title: l(
      "Trzeci okres warunkowy i żal o przeszłość",
      "Third conditional and past regrets",
      "เงื่อนไขแบบที่สามและความเสียดายอดีต",
    ),
    introduction: l(
      "Mówisz o zakończonej przeszłości, której nie możesz zmienić: warunek nie został spełniony, więc wyobrażasz sobie inny skutek.",
      "You are imagining a different outcome in a finished past that cannot be changed: the condition was not fulfilled.",
      "ใช้จินตนาการผลต่างในอดีตที่แก้ไม่ได้ เพราะเงื่อนไขไม่ได้เกิดขึ้น",
    ),
    rule: l(
      "Warunek: if + had + III forma. Skutek: would have + III forma; could have oznacza możliwość, a might have mniej pewny skutek. W formalnym stylu można opuścić if i przestawić had przed podmiot: Had we known = If we had known. To nadal warunek, nie pytanie. Po wish + Past Perfect wyrażamy żal dotyczący przeszłości.",
      "Condition: if + had + past participle. Result: would have + participle; could have marks possibility and might have a less certain result. Formal style can omit if and invert had and the subject: Had we known = If we had known. This remains a condition, not a question. Wish + Past Perfect expresses past regret.",
      "เงื่อนไขใช้ if + had + ช่อง 3 ผลใช้ would have + ช่อง 3 ส่วน could have บอกความเป็นไปได้และ might have ผลที่ไม่แน่ใจ แบบทางการละ if แล้ววาง had ก่อนประธานได้: Had we known = If we had known ยังเป็นเงื่อนไข ไม่ใช่คำถาม wish + Past Perfect บอกความเสียดายอดีต",
    ),
    formula:
      "If + had + V3, would have + V3\nIf we had left earlier, we would have caught the train.\nHad we left earlier, we would have caught the train.\nI wish I had left earlier.",
    examples: [
      example(
        "If we had checked the address, we would have found the building.",
        "Gdybyśmy sprawdzili adres, znaleźlibyśmy budynek.",
        "ถ้าเราตรวจที่อยู่ก่อน เราก็คงหาอาคารพบแล้ว",
      ),
      example(
        "Had I saved the file, I would not have lost my work.",
        "Gdybym zapisał plik, nie straciłbym swojej pracy.",
        "ถ้าฉันบันทึกไฟล์ไว้ ฉันก็คงไม่สูญเสียงานไป",
      ),
    ],
    pitfalls: l(
      "Nie: „If I would have known” w zwykłym warunku — użyj „If I had known”. Nie: „would have went” — użyj „would have gone”. Odróżnij II okres (hipoteza teraz: had time → would help) od III (nierealna przeszłość: had had time → would have helped).",
      "For an ordinary condition use “If I had known”, not “If I would have known”. Use “would have gone”, not “would have went”. Distinguish second conditional (had time → would help, now) from third (had had time → would have helped, past).",
      "เงื่อนไขทั่วไปใช้ “If I had known” ไม่ใช่ “If I would have known” ใช้ “would have gone” ไม่ใช่ went แบบที่สองสมมติตอนนี้ had time → would help แบบที่สามอดีต had had time → would have helped",
    ),
    practiceSlugs: ["conditionals-and-regrets-b2"],
  },
  {
    id: "en-inversion",
    language: "en",
    level: "B2",
    title: l(
      "Inwersja i podkreślanie informacji",
      "Inversion and emphasis",
      "การสลับลำดับคำเพื่อเน้น",
    ),
    introduction: l(
      "W formalnej wypowiedzi można zacząć od ograniczającego lub przeczącego wyrażenia, aby podkreślić informację: never, rarely, not only, only then.",
      "Formal writing can begin with a negative or restrictive expression to emphasise information: never, rarely, not only, only then.",
      "ภาษาเป็นทางการขึ้นต้นด้วยคำปฏิเสธหรือจำกัดเพื่อเน้นได้ เช่น never, rarely, not only, only then",
    ),
    rule: l(
      "Po takim elemencie w stosownych konstrukcjach stawiamy operator przed podmiotem. Jeśli czas już ma have/has/had, be lub modalny — wykorzystaj go. W Present/Past Simple dodaj do/does/did i wróć z głównym czasownikiem do formy podstawowej. W not only … but also inwersja dotyczy pierwszej części, gdy not only zaczyna tę klauzulę.",
      "These fronted expressions trigger auxiliary-before-subject order in the relevant constructions. Reuse an existing have/has/had, be or modal. Present/Past Simple adds do/does/did and restores the main verb to base form. In not only … but also, the first clause inverts when not only fronts that clause.",
      "โครงสร้างเหล่านี้วางกริยาช่วยก่อนประธาน ใช้ have/has/had, be หรือ modal ที่มีอยู่ ถ้าเป็น Present/Past Simple เพิ่ม do/does/did และกริยาหลักกลับรูปพื้นฐาน not only … but also สลับเฉพาะส่วนแรกเมื่อขึ้นต้นด้วย not only",
    ),
    formula:
      "Never have I seen this before.\nRarely does she arrive late.\nNot only did he explain it, but he also gave an example.",
    examples: [
      example(
        "Only then did we understand the problem.",
        "Dopiero wtedy zrozumieliśmy problem.",
        "ตอนนั้นเองเราจึงเข้าใจปัญหา",
      ),
      example(
        "What I need is a clear explanation.",
        "Potrzebuję przede wszystkim jasnego wyjaśnienia.",
        "สิ่งที่ฉันต้องการคือคำอธิบายที่ชัดเจน",
      ),
    ],
    pitfalls: l(
      "Nie: „Never I have seen …” — poprawnie „Never have I seen …”. Nie: „Not only did he explained …” — po did musi być explain. Zdanie What I need is … podkreśla informację inaczej i nie wymaga tego samego przestawienia.",
      "Not “Never I have seen …”: use “Never have I seen …”. Not “Not only did he explained …”: did requires explain. What I need is … is another emphasis pattern and does not use that inversion.",
      "ไม่ใช้ “Never I have seen …” แต่ใช้ “Never have I seen …” หลัง did ใช้ explain ไม่ใช่ explained ส่วน What I need is … เป็นโครงสร้างเน้นอีกแบบ ไม่สลับเช่นเดียวกัน",
    ),
    practiceSlugs: ["emphasis-and-inversion-b2"],
  },
  {
    id: "en-passive",
    language: "en",
    level: "B2",
    title: l(
      "Strona bierna i formalne zalecenia",
      "Passive voice and formal recommendations",
      "รูปถูกกระทำและคำแนะนำทางการ",
    ),
    introduction: l(
      "Strona bierna skupia uwagę na działaniu lub jego odbiorcy zamiast wykonawcy. Przydaje się w raportach, procedurach i opisie procesów.",
      "The passive focuses on an action or its recipient rather than the agent. It is useful in reports, procedures and process descriptions.",
      "รูปถูกกระทำเน้นการกระทำหรือผู้รับแทนผู้ทำ เหมาะกับรายงาน ขั้นตอน และกระบวนการ",
    ),
    rule: l(
      "Be niesie informację o czasie, a czasownik główny jest w III formie: is checked, was checked, has been checked, will be checked. Wykonawcę można dodać przez by. Po recommend that formalny tryb łączący używa formy podstawowej: that the plan be reviewed. Możliwe jest też that the plan should be reviewed.",
      "Be carries tense; the main verb is a participle: is checked, was checked, has been checked, will be checked. By can introduce the agent. After recommend that, the formal subjunctive uses a base form: that the plan be reviewed. That the plan should be reviewed is also possible.",
      "be แสดงกาล กริยาหลักเป็นช่อง 3 เช่น is checked, was checked, has been checked, will be checked ระบุผู้ทำด้วย by ได้ หลัง recommend that ใช้ subjunctive รูปพื้นฐาน เช่น that the plan be reviewed หรือใช้ should be reviewed ได้",
    ),
    formula:
      "They reviewed the plan. → The plan was reviewed.\nThe change has been approved.\nIt is recommended that the test be repeated.",
    examples: [
      example(
        "All requests are logged automatically.",
        "Wszystkie żądania są automatycznie rejestrowane.",
        "คำขอทั้งหมดถูกบันทึกโดยอัตโนมัติ",
      ),
      example(
        "The report should be updated before publication.",
        "Raport powinien zostać zaktualizowany przed publikacją.",
        "รายงานควรได้รับการอัปเดตก่อนเผยแพร่",
      ),
    ],
    pitfalls: l(
      "Nie: „The report was write” — write trzeba zmienić na written. „The test be repeated” po formalnym recommended that nie jest brakiem is: to poprawny tryb łączący.",
      "Not “The report was write”: use written. “The test be repeated” after formal recommended that does not lack is; it is a valid subjunctive.",
      "ไม่ใช้ “The report was write” ต้องเป็น written ส่วน “The test be repeated” หลัง recommended that แบบทางการเป็น subjunctive ที่ถูกต้อง ไม่ได้ขาด is",
    ),
    practiceSlugs: [
      "reports-and-recommendations-b2",
      "it-distributed-reliability-b2",
    ],
  },
  {
    id: "en-linking",
    language: "en",
    level: "B2",
    title: l(
      "Łączenie zdań i formy -ing",
      "Linking clauses and -ing forms",
      "การเชื่อมประโยคและรูป -ing",
    ),
    introduction: l(
      "Dłuższe zdanie pozostaje czytelne, gdy wiadomo, co jest przyczyną, kontrastem, warunkiem lub wcześniejszą czynnością.",
      "A longer sentence stays clear when cause, contrast, condition and earlier actions are explicit.",
      "ประโยคยาวยังชัดเจนได้เมื่อบอกเหตุ ความต่าง เงื่อนไข และลำดับก่อนหลัง",
    ),
    rule: l(
      "Although + podmiot + czasownik tworzy klauzulę kontrastu. Despite/instead of/without zwykle poprzedzają rzeczownik lub -ing. Having + III forma skraca wcześniejszą czynność tego samego podmiotu: Having checked …, we decided … . Nie zmieniaj przypadkiem wykonawcy między tymi częściami.",
      "Although + subject + verb introduces contrast. Despite/instead of/without usually takes a noun or -ing. Having + participle compresses an earlier action by the same subject: Having checked …, we decided … . Keep the agent consistent between the two parts.",
      "although + ประธาน + กริยาบอกความต่าง despite/instead of/without มักตามด้วยนามหรือ -ing ส่วน having + ช่อง 3 ย่อเหตุการณ์ก่อนหน้าของประธานเดียวกัน เช่น Having checked …, we decided … อย่าเปลี่ยนผู้ทำระหว่างสองส่วน",
    ),
    formula:
      "Although it was late, we continued.\nDespite being tired, we continued.\nHaving read the report, we changed the plan.",
    examples: [
      example(
        "Instead of guessing, we should check the evidence.",
        "Zamiast zgadywać, powinniśmy sprawdzić dowody.",
        "แทนที่จะเดา เราควรตรวจหลักฐาน",
      ),
      example(
        "Having tested both options, she chose the simpler one.",
        "Po przetestowaniu obu opcji wybrała prostszą.",
        "หลังทดสอบทั้งสองทางเลือก เธอเลือกแบบที่ง่ายกว่า",
      ),
    ],
    pitfalls: l(
      "Nie: „despite it was late” w tej formie — użyj „although it was late” lub „despite the late hour”. Nie: „without check” — poprawnie „without checking”.",
      "Not “despite it was late” in that form: use “although it was late” or “despite the late hour”. Use “without checking”, not “without check”.",
      "ไม่ใช้ “despite it was late” ในรูปนี้ ใช้ “although it was late” หรือ “despite the late hour” และใช้ “without checking” ไม่ใช่ “without check”",
    ),
    practiceSlugs: [
      "complex-problem-solving-b2",
      "culture-and-perspective-b2",
      "news-and-sources-b2",
    ],
  },
  {
    id: "en-mixed-conditionals",
    language: "en",
    level: "C1",
    title: l(
      "Mieszane okresy warunkowe",
      "Mixed conditionals",
      "เงื่อนไขแบบผสม",
    ),
    introduction: l(
      "Czas warunku i czas skutku nie muszą być takie same. Najpierw ustal, kiedy miało zajść każde z nich, dopiero potem dobierz formy.",
      "The condition and its result need not belong to the same time. Establish each time reference before choosing the forms.",
      "เงื่อนไขกับผลไม่จำเป็นต้องอยู่เวลาเดียวกัน ระบุเวลาก่อนจึงเลือกรูป",
    ),
    rule: l(
      "Przeszły warunek z obecnym skutkiem: if + Past Perfect, would + forma podstawowa. Obecna stała cecha z przeszłym skutkiem: if + Past Simple, would have + III forma. Przysłówki now, yesterday pomagają odczytać znaczenie. To świadome mieszanie punktów czasowych, nie dowolne łączenie czasów.",
      "Past condition with present result: if + Past Perfect, would + base verb. A continuing present characteristic with past result: if + Past Simple, would have + participle. Now and yesterday clarify reference. This deliberately combines time frames, not arbitrary tense forms.",
      "เงื่อนไขอดีตกับผลปัจจุบันใช้ if + Past Perfect, would + รูปพื้นฐาน คุณลักษณะปัจจุบันที่ต่อเนื่องกับผลอดีตใช้ if + Past Simple, would have + ช่อง 3 now และ yesterday ช่วยชี้เวลา เป็นการผสมตามความหมาย ไม่ใช่เลือกกาลตามใจ",
    ),
    formula:
      "If I had slept longer, I would feel better now.\nIf she were more careful, she wouldn't have missed that detail yesterday.",
    examples: [
      example(
        "If we had booked earlier, we would have a room now.",
        "Gdybyśmy zarezerwowali wcześniej, mielibyśmy teraz pokój.",
        "ถ้าเราจองก่อนหน้านี้ ตอนนี้เราคงมีห้อง",
      ),
      example(
        "If I spoke Italian, I would have understood yesterday's talk.",
        "Gdybym znał włoski, zrozumiałbym wczorajszy wykład.",
        "ถ้าฉันพูดอิตาลีได้ ฉันก็คงเข้าใจการบรรยายเมื่อวานแล้ว",
      ),
    ],
    pitfalls: l(
      "Nie uznawaj każdego połączenia czasów za błąd: oceń znaczenie. Would have + III forma dotyczy skutku w przeszłości; would + czasownik może dotyczyć teraz. Nadal nie używamy would po if w zwykłym neutralnym warunku.",
      "Do not reject every mixed time frame: check the intended meaning. Would have + participle gives a past result; would + verb can refer to now. Ordinary neutral conditions still do not put would after if.",
      "อย่าตัดสินการผสมเวลาว่าผิดเสมอ ต้องดูความหมาย would have + ช่อง 3 บอกผลอดีต ส่วน would + กริยาบอกปัจจุบันได้ เงื่อนไขทั่วไปยังไม่ใช้ would หลัง if",
    ),
    practiceSlugs: [],
  },
  {
    id: "en-hedging",
    language: "en",
    level: "C1",
    title: l(
      "Stopień pewności i ostrożne wnioski",
      "Degrees of certainty and cautious claims",
      "ระดับความมั่นใจและข้อสรุปอย่างระมัดระวัง",
    ),
    introduction: l(
      "Poprawność gramatyczna nie wystarcza do rzetelnej wypowiedzi. Dobierz stopień pewności do dowodów, zwłaszcza w raportach i dyskusji.",
      "Grammatical correctness is not enough for a reliable claim. Match certainty to evidence, especially in reports and discussions.",
      "ไวยากรณ์ถูกต้องยังไม่พอสำหรับข้ออ้างน่าเชื่อถือ ต้องให้ความมั่นใจสอดคล้องหลักฐาน โดยเฉพาะรายงานและการอภิปราย",
    ),
    rule: l(
      "May/might/could + forma podstawowa sygnalizuje możliwość. May have + III forma ocenia możliwość w przeszłości. Appears to have + III forma ostrożnie ocenia wcześniejszy skutek. Is reported to … przypisuje wiadomość relacji; allegedly oznacza „rzekomo”. Częściowość wyrażają partly, in some cases, tends to.",
      "May/might/could + base verb marks possibility. May have + participle assesses a past possibility. Appears to have + participle tentatively describes an earlier result. Is reported to … attributes a claim to reports; allegedly marks an unverified claim. Partly, in some cases and tends to limit generalisation.",
      "may/might/could + รูปพื้นฐานบอกความเป็นไปได้ may have + ช่อง 3 ประเมินอดีต appears to have + ช่อง 3 ประเมินผลก่อนหน้าอย่างระมัดระวัง is reported to … อ้างถึงรายงาน allegedly บอกว่ายังไม่ยืนยัน partly, in some cases, tends to จำกัดการเหมารวม",
    ),
    formula:
      "It may improve performance.\nIt may have improved performance.\nThe policy appears to have helped.\nThe team is reported to be reviewing the results.",
    examples: [
      example(
        "The delay may have been caused by heavy traffic.",
        "Opóźnienie mogło być spowodowane dużym ruchem.",
        "ความล่าช้าอาจเกิดจากปริมาณการใช้งานมาก",
      ),
      example(
        "The evidence suggests a possible link.",
        "Dowody wskazują na możliwy związek.",
        "หลักฐานบ่งชี้ความเชื่อมโยงที่เป็นไปได้",
      ),
    ],
    pitfalls: l(
      "Nie: „may improved” — użyj may improve lub may have improved, zależnie od czasu. Definitely i always mogą tworzyć gramatyczne zdanie, ale bez dowodów nadmiernie wzmacniają wniosek.",
      "Not “may improved”: use may improve or may have improved according to time. Definitely and always can be grammatical yet overstate a claim without evidence.",
      "ไม่ใช้ “may improved” ใช้ may improve หรือ may have improved ตามเวลา definitely และ always ถูกไวยากรณ์ได้แต่ทำให้ข้อสรุปแรงเกินหลักฐาน",
    ),
    practiceSlugs: [],
  },
);

const thaiExample = (sentence: string, pl: string, en: string) => ({
  sentence,
  meaning: l(pl, en, sentence),
});
theoryLessons.push(
  {
    id: "th-basics",
    language: "th",
    level: "A1",
    title: l(
      "Tajskie zdanie: szyk i brak odmiany czasu",
      "Thai sentences: order and uninflected verbs",
      "ประโยคไทย: ลำดับคำและกริยาไม่ผัน",
    ),
    introduction: l(
      "Tajski nie kopiuje angielskiej odmiany czasowników. Zrozumienie podstawowego szyku pomaga uniknąć dodawania niepotrzebnych odpowiedników am/is/are.",
      "Thai does not copy English verb inflection. Understanding its basic order helps avoid adding unnecessary equivalents of am/is/are.",
      "ภาษาไทยไม่ผันกริยาเหมือนอังกฤษ เข้าใจลำดับพื้นฐานแล้วจะไม่เติมคำเทียบ am/is/are โดยไม่จำเป็น",
    ),
    rule: l(
      "Typowy szyk to podmiot + czasownik + dopełnienie. Czasownik nie zmienia formy przez osobę ani liczbę. Słowa opisujące cechę często są samodzielnym orzeczeniem, bez เป็น. Przeczenie ไม่ stawiamy przed orzeczeniem. Określenia czasu i kontekst pokazują, kiedy coś się dzieje.",
      "Typical order is subject + verb + object. Verbs do not change for person or number. Property words often predicate directly without เป็น. ไม่ precedes the predicate to negate it. Time expressions and context establish when an event happens.",
      "ลำดับทั่วไปคือประธาน + กริยา + กรรม กริยาไม่เปลี่ยนตามบุคคลหรือจำนวน คำบอกลักษณะเป็นภาคแสดงได้โดยไม่ต้องมีเป็น ไม่วางหน้าภาคแสดงเพื่อปฏิเสธ เวลาบอกด้วยบริบทและคำบอกเวลา",
    ),
    formula: "ฉัน + อ่าน + หนังสือ\nฉันไม่เข้าใจ\nเขายุ่ง / เขาไม่ยุ่ง",
    examples: [
      thaiExample("ฉันอ่านหนังสือ", "Czytam książkę.", "I read a book."),
      thaiExample(
        "คอมพิวเตอร์ไม่ทำงาน",
        "Komputer nie działa.",
        "The computer does not work.",
      ),
    ],
    pitfalls: l(
      "Nie dodawaj automatycznie เป็น przed każdą cechą: เขายุ่ง jest naturalne. Nie przenoś angielskiego -s/-ed do tajskiego. Wypowiedź może pomijać znany podmiot, ale początkującemu pomaga jawne wskazanie wykonawcy.",
      "Do not automatically insert เป็น before every property: เขายุ่ง is natural. Do not transfer English -s/-ed to Thai. Context can allow a subject to be omitted, but explicit subjects help beginners.",
      "อย่าเติมเป็นหน้าลักษณะทุกคำ เขายุ่งเป็นธรรมชาติ ไม่ใช้ส่วนเติม -s/-ed แบบอังกฤษ บริบทอาจละประธานได้ แต่ผู้เริ่มเรียนระบุประธานให้ชัดจะง่ายกว่า",
    ),
    practiceSlugs: ["thai-it-support-a1"],
  },
  {
    id: "th-questions",
    language: "th",
    level: "A1",
    title: l(
      "Pytania i partykuły grzecznościowe",
      "Questions and polite particles",
      "คำถามและคำลงท้ายสุภาพ",
    ),
    introduction: l(
      "Tajskie pytanie często zachowuje szyk oznajmienia. Zamiast przestawiać czasownik, dodaj słowo pytające lub partykułę.",
      "Thai questions often retain statement order. Instead of moving a verb, add a question word or particle.",
      "คำถามไทยมักคงลำดับบอกเล่า ไม่ย้ายกริยา แต่เพิ่มคำถามหรือคำลงท้าย",
    ),
    rule: l(
      "ไหม tworzy pytanie tak/nie na końcu treści. อะไร pyta „co”, ที่ไหน — „gdzie”, เมื่อไร — „kiedy”; pozostają przy pytanej informacji. ครับ jest uprzejmą końcówką męską; คะ to żeńska końcówka pytania, ค่ะ zwykle oznajmienia. Partykuła uprzejmości sama nie zastępuje pytania.",
      "ไหม follows the proposition to form a yes/no question. อะไร asks what, ที่ไหน where, เมื่อไร when; they stay near the requested information. ครับ is a masculine polite ending; คะ is feminine for questions, ค่ะ typically for statements. Politeness alone does not replace a question marker.",
      "ไหมอยู่ท้ายเนื้อหาเพื่อถามใช่/ไม่ใช่ อะไรถามสิ่งของ ที่ไหนถามสถานที่ เมื่อไรถามเวลา ครับเป็นคำสุภาพแบบผู้ชาย คะใช้ถามแบบผู้หญิง ค่ะมักใช้บอกเล่า คำสุภาพอย่างเดียวไม่แทนคำถาม",
    ),
    formula: "คุณเข้าใจไหมครับ/คะ\nคุณทำอะไร\nคุณอยู่ที่ไหน",
    examples: [
      thaiExample(
        "ปัญหาเริ่มเมื่อไรครับ",
        "Kiedy zaczął się problem?",
        "When did the problem start?",
      ),
      thaiExample(
        "ช่วยอธิบายได้ไหมคะ",
        "Czy możesz wyjaśnić?",
        "Could you explain, please?",
      ),
    ],
    pitfalls: l(
      "Nie dodawaj angielskiego do/did. Nie myl อะไร z ที่ไหน: pytają o inne informacje. U kobiety w pytaniu zwykle คะ, nie ค่ะ.",
      "Do not add English do/did. Do not confuse อะไร with ที่ไหน: they ask different things. Feminine questions normally use คะ, not ค่ะ.",
      "ไม่เติม do/did แบบอังกฤษ อะไรกับที่ไหนถามคนละข้อมูล คำถามแบบผู้หญิงปกติใช้คะ ไม่ใช่ค่ะ",
    ),
    practiceSlugs: [
      "asking-questions",
      "polite-particles",
      "thai-it-support-a1",
    ],
  },
  {
    id: "th-time",
    language: "th",
    level: "A2",
    title: l(
      "Czas, trwanie i zakończenie w tajskim",
      "Time, duration and completion in Thai",
      "เวลา ความต่อเนื่อง และความเสร็จสิ้น",
    ),
    introduction: l(
      "Brak odmiany czasownika nie oznacza braku informacji o czasie. Tajski wykorzystuje określenia czasu i elementy opisujące przebieg zdarzenia.",
      "Uninflected verbs do not mean there is no time information. Thai uses time expressions and markers describing how an event unfolds.",
      "กริยาไม่ผันไม่ได้แปลว่าไม่มีข้อมูลเวลา ภาษาไทยใช้คำบอกเวลาและคำบอกลักษณะการเกิดเหตุการณ์",
    ),
    rule: l(
      "เมื่อวาน — wczoraj, วันนี้ — dziś, พรุ่งนี้ — jutro. กำลัง przed czasownikiem wskazuje trwającą czynność. จะ przed czasownikiem często wskazuje zamiar lub przyszłość. แล้ว po treści może sygnalizować zakończenie lub zmianę stanu. Nie jest automatycznym tłumaczeniem każdego angielskiego czasu przeszłego.",
      "เมื่อวาน means yesterday, วันนี้ today, พรุ่งนี้ tomorrow. กำลัง before a verb marks an ongoing action. จะ before a verb often marks intention or future. แล้ว after the content can signal completion or a changed state; it is not an automatic translation of every English past tense.",
      "เมื่อวาน วันนี้ พรุ่งนี้บอกเวลา กำลังก่อนกริยาเน้นสิ่งที่กำลังทำ จะก่อนกริยามักบอกเจตนาหรืออนาคต แล้วหลังเนื้อหาอาจบอกเสร็จสิ้นหรือเปลี่ยนสภาพ ไม่ได้แทนอดีตภาษาอังกฤษทุกกรณี",
    ),
    formula: "กำลัง + verb\nจะ + verb\nverb + แล้ว",
    examples: [
      thaiExample(
        "ฉันกำลังอ่านรายงาน",
        "Czytam teraz raport.",
        "I am reading the report.",
      ),
      thaiExample(
        "ผมส่งไฟล์แล้ว",
        "Wysłałem już plik.",
        "I have sent the file.",
      ),
    ],
    pitfalls: l(
      "Nie traktuj แล้ว jak końcówki -ed. Dobierz je do zakończenia lub zmiany, a czas doprecyzuj kontekstem. Nie odmieniaj czasownika po zmianie podmiotu.",
      "Do not treat แล้ว as an -ed suffix. Use it for completion or change, with context clarifying time. A different subject does not require a new verb form.",
      "อย่ามองแล้วเป็นส่วนเติม -ed เลือกใช้เมื่อสื่อเสร็จสิ้นหรือเปลี่ยนแปลง และให้บริบทชี้เวลา เปลี่ยนประธานแล้วไม่ต้องเปลี่ยนรูปกริยา",
    ),
    practiceSlugs: ["thai-it-delivery-a2", "thai-useful-phrases"],
  },
  {
    id: "th-linking",
    language: "th",
    level: "B1",
    title: l(
      "Przyczyna, skutek i kontrast po tajsku",
      "Cause, result and contrast in Thai",
      "เหตุ ผล และความขัดแย้ง",
    ),
    introduction: l(
      "W dłuższej wypowiedzi zaznacz, dlaczego coś się stało, jaki jest skutek i co mu się przeciwstawia.",
      "In longer statements, make the reason, consequence and contrast explicit.",
      "ในข้อความยาว ควรบอกสาเหตุ ผล และประเด็นที่ขัดกันให้ชัด",
    ),
    rule: l(
      "เพราะ wprowadza przyczynę, จึง często łączy ją ze skutkiem, ale nie musi pojawić się w każdym zdaniu. แต่ znaczy „ale”, และ — „i”. มี oznacza istnienie czegoś; ไม่มี — brak. Zdania o ryzyku stają się jaśniejsze, gdy po มี nazwiesz konkretny problem, a potem skutek.",
      "เพราะ introduces a reason; จึง often links it to a consequence but is not mandatory in every sentence. แต่ means but; และ means and. มี expresses existence and ไม่มี its absence. A risk update is clearer when มี introduces a specific issue followed by its consequence.",
      "เพราะนำสาเหตุ จึงมักเชื่อมผลแต่ไม่จำเป็นทุกประโยค แต่แสดงความขัดแย้ง และเชื่อมข้อมูล มีบอกการมี ไม่มีบอกการไม่มี การรายงานความเสี่ยงชัดขึ้นเมื่อระบุปัญหาหลังมีแล้วบอกผล",
    ),
    formula: "เพราะ … จึง …\n… แต่ …\nมี + noun / ไม่มี + noun",
    examples: [
      thaiExample(
        "ระบบช้าเพราะมีผู้ใช้จำนวนมาก",
        "System działa wolno, ponieważ korzysta z niego wielu użytkowników.",
        "The system is slow because there are many users.",
      ),
      thaiExample(
        "วิธีนี้เร็วแต่มีความเสี่ยง",
        "Ta metoda jest szybka, ale wiąże się z ryzykiem.",
        "This method is fast but carries a risk.",
      ),
    ],
    pitfalls: l(
      "Nie używaj แต่ („ale”), jeśli chcesz tylko dodać informację — do tego służy และ. Nie nazywaj zdania niegramatycznym tylko dlatego, że opisuje złą decyzję: to osobny problem sensu i kontekstu.",
      "Do not use แต่ (but) merely to add information; use และ. An unwise decision can still be expressed grammatically: meaning and context are separate issues.",
      "ถ้าแค่เพิ่มข้อมูลใช้และ ไม่ใช่แต่ การตัดสินใจไม่ดีอาจพูดด้วยไวยากรณ์ถูกต้องได้ ต้องแยกความหมายกับบริบท",
    ),
    practiceSlugs: ["thai-business-meeting", "thai-it-incidents-b1"],
  },
  {
    id: "th-conditions",
    language: "th",
    level: "B2",
    title: l(
      "Warunki i stopień pewności po tajsku",
      "Conditions and certainty in Thai",
      "เงื่อนไขและระดับความมั่นใจ",
    ),
    introduction: l(
      "Tajski i angielski inaczej kodują hipotetyczność. Nie przenoś mechanicznie wzoru if + Past Simple do tajskiego.",
      "Thai and English encode hypothetical situations differently. Do not mechanically transfer if + Past Simple into Thai.",
      "ไทยกับอังกฤษแสดงสมมติต่างกัน อย่านำสูตร if + Past Simple มาใช้กับไทยตรง ๆ",
    ),
    rule: l(
      "ถ้า wprowadza warunek; ก็ może łączyć go z wynikiem. จะ wskazuje przyszły lub zamierzony skutek, อาจ — możliwość, คง — przypuszczenie. Czas i nierealność wynikają z kontekstu oraz wyrażeń, nie z odmiany czasownika na Past Simple/Past Perfect. W raportach oddzielaj fakt od przypuszczenia.",
      "ถ้า introduces a condition; ก็ can link it to a result. จะ signals a future or intended result, อาจ possibility, and คง a supposition. Time and counterfactual meaning come from context and expressions, not Past Simple/Past Perfect inflection. Reports should distinguish fact from inference.",
      "ถ้านำเงื่อนไข ก็อาจเชื่อมผล จะบอกอนาคตหรือเจตนา อาจบอกความเป็นไปได้ คงบอกการคาดการณ์ เวลาและสิ่งไม่จริงอาศัยบริบท ไม่ผันกริยาเป็น Past Simple/Past Perfect รายงานควรแยกข้อเท็จจริงจากการคาด",
    ),
    formula: "ถ้า … ก็ …\nอาจ + verb\nจะ + verb",
    examples: [
      thaiExample(
        "ถ้าฝนตกเราจะอยู่บ้าน",
        "Jeśli będzie padać, zostaniemy w domu.",
        "If it rains, we will stay home.",
      ),
      thaiExample(
        "ปัญหานี้อาจเกิดจากเครือข่าย",
        "Ten problem może wynikać z sieci.",
        "This problem may be caused by the network.",
      ),
    ],
    pitfalls: l(
      "Nie utożsamiaj อาจ z pewnym faktem. Nie szukaj końcówki „czasu przeszłego” w tajskim czasowniku; sprawdź kontekst i określenia czasu. Jeśli mowa o niewykonanej przeszłej czynności, trzeba to jasno zaznaczyć kontekstem.",
      "Do not treat อาจ as certainty. Do not look for a past-tense ending on a Thai verb; read the context and time expressions. An unreal past event must be made clear by context.",
      "อาจไม่ใช่ความแน่นอน ไม่ต้องหาส่วนเติมอดีตในกริยาไทย ให้ดูบริบทและคำบอกเวลา หากพูดถึงอดีตที่ไม่ได้เกิดต้องให้บริบทชัด",
    ),
    practiceSlugs: [],
  },
);
