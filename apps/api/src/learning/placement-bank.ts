import type {
  CourseLanguage,
  InterfaceLocale,
  PlacementQuestion,
} from "@shellty/api-contracts";

type Skill = PlacementQuestion["skill"];
type Localized = Record<InterfaceLocale, string>;

export type PlacementBankQuestion = {
  id: string;
  skill: Skill;
  prompt: Localized;
  options: Array<{ id: string; text: Localized }>;
  correct: string;
};

const localized = (pl: string, en: string, th: string): Localized => ({
  pl,
  en,
  th,
});
const option = (id: string, pl: string, en: string, th: string) => ({
  id,
  text: localized(pl, en, th),
});
const question = (
  id: string,
  skill: Skill,
  correct: string,
  prompt: Localized,
  options: PlacementBankQuestion["options"],
): PlacementBankQuestion => ({ id, skill, correct, prompt, options });

export const additionalPlacementQuestions: Record<
  CourseLanguage,
  PlacementBankQuestion[]
> = {
  en: [
    question(
      "en-grammar-9",
      "grammar",
      "c",
      localized(
        "Do czasu przyjazdu pociągu czekaliśmy już godzinę: We ___ for an hour.",
        "By the time the train arrived, we ___ for an hour.",
        "เมื่อรถไฟมาถึง เรารอมาแล้วหนึ่งชั่วโมง: We ___ for an hour.",
      ),
      [
        option("a", "waited", "waited", "waited"),
        option("b", "have waited", "have waited", "have waited"),
        option("c", "had been waiting", "had been waiting", "had been waiting"),
        option("d", "are waiting", "are waiting", "are waiting"),
      ],
    ),
    question(
      "en-grammar-10",
      "grammar",
      "b",
      localized(
        "Wybierz poprawny okres warunkowy: If she had known, she ___ us.",
        "Complete the conditional: If she had known, she ___ us.",
        "เติมประโยคเงื่อนไข: If she had known, she ___ us.",
      ),
      [
        option("a", "will tell", "will tell", "will tell"),
        option("b", "would have told", "would have told", "would have told"),
        option("c", "would tell", "would tell", "would tell"),
        option("d", "told", "told", "told"),
      ],
    ),
    question(
      "en-grammar-11",
      "grammar",
      "d",
      localized(
        "Wybierz poprawne zdanie w stronie biernej.",
        "Choose the correct passive sentence.",
        "เลือกประโยค passive voice ที่ถูกต้อง",
      ),
      [
        option(
          "a",
          "They delivered the update yesterday.",
          "They delivered the update yesterday.",
          "They delivered the update yesterday.",
        ),
        option(
          "b",
          "The update delivered yesterday.",
          "The update delivered yesterday.",
          "The update delivered yesterday.",
        ),
        option(
          "c",
          "The update was deliver yesterday.",
          "The update was deliver yesterday.",
          "The update was deliver yesterday.",
        ),
        option(
          "d",
          "The update was delivered yesterday.",
          "The update was delivered yesterday.",
          "The update was delivered yesterday.",
        ),
      ],
    ),
    question(
      "en-grammar-12",
      "grammar",
      "a",
      localized(
        "Wybierz poprawny przedimek: She is ___ engineer.",
        "Choose the correct article: She is ___ engineer.",
        "เลือก article ที่ถูกต้อง: She is ___ engineer.",
      ),
      [
        option("a", "an", "an", "an"),
        option("b", "a", "a", "a"),
        option("c", "the", "the", "the"),
        option("d", "bez przedimka", "no article", "ไม่ใช้ article"),
      ],
    ),
    question(
      "en-grammar-13",
      "grammar",
      "c",
      localized(
        "Wybierz właściwy czasownik modalny: You ___ have backed up the database first.",
        "Choose the modal: You ___ have backed up the database first.",
        "เลือก modal verb: You ___ have backed up the database first.",
      ),
      [
        option("a", "can", "can", "can"),
        option("b", "will", "will", "will"),
        option("c", "should", "should", "should"),
        option("d", "may", "may", "may"),
      ],
    ),
    question(
      "en-vocabulary-9",
      "vocabulary",
      "b",
      localized(
        "Co znaczy „deadline”?",
        "What does “deadline” mean?",
        "deadline หมายถึงอะไร",
      ),
      [
        option(
          "a",
          "spotkanie wstępne",
          "an introductory meeting",
          "การประชุมแนะนำ",
        ),
        option(
          "b",
          "ostateczny termin",
          "the final due date",
          "กำหนดส่งสุดท้าย",
        ),
        option("c", "zakres projektu", "the project scope", "ขอบเขตโครงการ"),
        option("d", "urlop", "annual leave", "วันลาพักร้อน"),
      ],
    ),
    question(
      "en-vocabulary-10",
      "vocabulary",
      "d",
      localized(
        "Co w IT znaczy „deploy”?",
        "In IT, what does “deploy” mean?",
        "ในงานไอที deploy หมายถึงอะไร",
      ),
      [
        option("a", "usunąć kod", "delete code", "ลบโค้ด"),
        option(
          "b",
          "zaprojektować makietę",
          "design a mock-up",
          "ออกแบบต้นแบบ",
        ),
        option(
          "c",
          "zatrudnić programistę",
          "hire a developer",
          "จ้างนักพัฒนา",
        ),
        option(
          "d",
          "wdrożyć wersję do środowiska",
          "release a version to an environment",
          "นำเวอร์ชันขึ้นสู่ระบบ",
        ),
      ],
    ),
    question(
      "en-vocabulary-11",
      "vocabulary",
      "a",
      localized(
        "Co znaczy „reliable”?",
        "What does “reliable” mean?",
        "reliable หมายถึงอะไร",
      ),
      [
        option(
          "a",
          "niezawodny / godny zaufania",
          "dependable or trustworthy",
          "เชื่อถือได้",
        ),
        option("b", "tymczasowy", "temporary", "ชั่วคราว"),
        option("c", "kosztowny", "expensive", "ราคาแพง"),
        option("d", "nieprzewidywalny", "unpredictable", "คาดเดาไม่ได้"),
      ],
    ),
    question(
      "en-vocabulary-12",
      "vocabulary",
      "c",
      localized(
        "Co znaczy „to reschedule”?",
        "What does “to reschedule” mean?",
        "to reschedule หมายถึงอะไร",
      ),
      [
        option(
          "a",
          "odwołać bez nowego terminu",
          "cancel without a new date",
          "ยกเลิกโดยไม่กำหนดวันใหม่",
        ),
        option(
          "b",
          "potwierdzić obecność",
          "confirm attendance",
          "ยืนยันการเข้าร่วม",
        ),
        option(
          "c",
          "ustalić inny termin",
          "arrange a different time",
          "เปลี่ยนกำหนดเวลา",
        ),
        option("d", "spóźnić się", "arrive late", "มาสาย"),
      ],
    ),
    question(
      "en-vocabulary-13",
      "vocabulary",
      "b",
      localized(
        "Co znaczy „workaround”?",
        "What does “workaround” mean?",
        "workaround หมายถึงอะไร",
      ),
      [
        option(
          "a",
          "trwałe rozwiązanie źródłowe",
          "a permanent root fix",
          "การแก้ที่ต้นเหตุแบบถาวร",
        ),
        option(
          "b",
          "tymczasowy sposób obejścia problemu",
          "a temporary way around a problem",
          "วิธีเลี่ยงปัญหาชั่วคราว",
        ),
        option("c", "opis stanowiska", "a job description", "รายละเอียดงาน"),
        option("d", "raport czasu pracy", "a timesheet", "ใบบันทึกเวลา"),
      ],
    ),
    question(
      "en-listening-5",
      "listening",
      "c",
      localized(
        "Wybierz naturalną odpowiedź na: “Would you mind sending that again?”",
        "Choose the natural reply to: “Would you mind sending that again?”",
        "เลือกคำตอบที่เป็นธรรมชาติ: “Would you mind sending that again?”",
      ),
      [
        option(
          "a",
          "Yes, I would mind it.",
          "Yes, I would mind it.",
          "Yes, I would mind it.",
        ),
        option(
          "b",
          "I send yesterday.",
          "I send yesterday.",
          "I send yesterday.",
        ),
        option(
          "c",
          "Of course, I’ll resend it now.",
          "Of course, I’ll resend it now.",
          "Of course, I’ll resend it now.",
        ),
        option("d", "No send.", "No send.", "No send."),
      ],
    ),
    question(
      "en-listening-6",
      "listening",
      "a",
      localized(
        "Które zdanie naturalnie rozpoczyna spotkanie?",
        "Which sentence naturally opens a meeting?",
        "ประโยคใดใช้เริ่มประชุมได้อย่างเป็นธรรมชาติ",
      ),
      [
        option(
          "a",
          "Shall we get started?",
          "Shall we get started?",
          "Shall we get started?",
        ),
        option("b", "We start, yes?", "We start, yes?", "We start, yes?"),
        option("c", "Start us now.", "Start us now.", "Start us now."),
        option("d", "Meeting do.", "Meeting do.", "Meeting do."),
      ],
    ),
    question(
      "en-listening-7",
      "listening",
      "d",
      localized(
        "Wybierz uprzejmą prośbę o wyjaśnienie.",
        "Choose a polite request for clarification.",
        "เลือกประโยคขอคำอธิบายอย่างสุภาพ",
      ),
      [
        option("a", "Explain.", "Explain.", "Explain."),
        option("b", "What you mean?", "What you mean?", "What you mean?"),
        option("c", "You are unclear.", "You are unclear.", "You are unclear."),
        option(
          "d",
          "Could you clarify what you mean?",
          "Could you clarify what you mean?",
          "Could you clarify what you mean?",
        ),
      ],
    ),
    question(
      "en-listening-8",
      "listening",
      "b",
      localized(
        "Jak naturalnie zgłosić problem techniczny?",
        "How do you naturally report a technical issue?",
        "จะแจ้งปัญหาทางเทคนิคอย่างเป็นธรรมชาติได้อย่างไร",
      ),
      [
        option("a", "System no work.", "System no work.", "System no work."),
        option(
          "b",
          "I’m unable to log in after the update.",
          "I’m unable to log in after the update.",
          "I’m unable to log in after the update.",
        ),
        option(
          "c",
          "Login is bad thing.",
          "Login is bad thing.",
          "Login is bad thing.",
        ),
        option(
          "d",
          "Update broke maybe all.",
          "Update broke maybe all.",
          "Update broke maybe all.",
        ),
      ],
    ),
    question(
      "en-listening-9",
      "listening",
      "a",
      localized(
        "Wybierz naturalny sposób wyrażenia częściowej zgody.",
        "Choose a natural way to partly agree.",
        "เลือกวิธีแสดงความเห็นด้วยบางส่วนอย่างเป็นธรรมชาติ",
      ),
      [
        option(
          "a",
          "That’s a fair point, although I see one risk.",
          "That’s a fair point, although I see one risk.",
          "That’s a fair point, although I see one risk.",
        ),
        option("b", "You half right.", "You half right.", "You half right."),
        option("c", "I agree no.", "I agree no.", "I agree no."),
        option(
          "d",
          "Point fair but wrong.",
          "Point fair but wrong.",
          "Point fair but wrong.",
        ),
      ],
    ),
    question(
      "en-listening-10",
      "listening",
      "c",
      localized(
        "Która odpowiedź pasuje do “How soon can you fix it?”",
        "Which reply fits “How soon can you fix it?”",
        "คำตอบใดเหมาะกับ “How soon can you fix it?”",
      ),
      [
        option(
          "a",
          "For two hours ago.",
          "For two hours ago.",
          "For two hours ago.",
        ),
        option("b", "Since tomorrow.", "Since tomorrow.", "Since tomorrow."),
        option(
          "c",
          "I should have an update within two hours.",
          "I should have an update within two hours.",
          "I should have an update within two hours.",
        ),
        option("d", "At quick.", "At quick.", "At quick."),
      ],
    ),
  ],
  th: [
    question(
      "th-vocabulary-11",
      "vocabulary",
      "c",
      localized(
        "Co znaczy „ประชุม”?",
        "What does “ประชุม” mean?",
        "คำว่า “ประชุม” หมายถึงอะไร",
      ),
      [
        option("a", "odpoczywać", "rest", "พักผ่อน"),
        option("b", "programować", "program", "เขียนโปรแกรม"),
        option(
          "c",
          "spotkanie / obradować",
          "meeting / meet",
          "การประชุม / ประชุม",
        ),
        option("d", "podróżować", "travel", "เดินทาง"),
      ],
    ),
    question(
      "th-vocabulary-12",
      "vocabulary",
      "a",
      localized(
        "Co znaczy „รหัสผ่าน”?",
        "What does “รหัสผ่าน” mean?",
        "คำว่า “รหัสผ่าน” หมายถึงอะไร",
      ),
      [
        option("a", "hasło", "password", "พาสเวิร์ด"),
        option("b", "serwer", "server", "เซิร์ฟเวอร์"),
        option("c", "plik", "file", "ไฟล์"),
        option("d", "ekran", "screen", "หน้าจอ"),
      ],
    ),
    question(
      "th-vocabulary-13",
      "vocabulary",
      "d",
      localized(
        "Co znaczy „แก้ไข”?",
        "What does “แก้ไข” mean?",
        "คำว่า “แก้ไข” หมายถึงอะไร",
      ),
      [
        option("a", "drukować", "print", "พิมพ์"),
        option("b", "zamykać", "close", "ปิด"),
        option("c", "kupować", "buy", "ซื้อ"),
        option("d", "poprawiać / naprawiać", "edit or fix", "ปรับปรุงหรือซ่อม"),
      ],
    ),
    question(
      "th-vocabulary-14",
      "vocabulary",
      "b",
      localized(
        "Co znaczy „กำหนดส่ง”?",
        "What does “กำหนดส่ง” mean?",
        "คำว่า “กำหนดส่ง” หมายถึงอะไร",
      ),
      [
        option("a", "budżet", "budget", "งบประมาณ"),
        option("b", "termin oddania", "deadline", "วันครบกำหนด"),
        option("c", "umowa", "contract", "สัญญา"),
        option("d", "urlop", "holiday", "วันหยุด"),
      ],
    ),
    question(
      "th-vocabulary-15",
      "vocabulary",
      "a",
      localized(
        "Co znaczy „เชื่อมต่อ”?",
        "What does “เชื่อมต่อ” mean?",
        "คำว่า “เชื่อมต่อ” หมายถึงอะไร",
      ),
      [
        option("a", "łączyć się", "connect", "ต่อเข้าด้วยกัน"),
        option("b", "usuwać", "delete", "ลบ"),
        option("c", "zapisywać", "save", "บันทึก"),
        option("d", "wyszukiwać", "search", "ค้นหา"),
      ],
    ),
    question(
      "th-grammar-7",
      "grammar",
      "b",
      localized(
        "Które słowo oznacza dokonanie czynności i zwykle stoi po czasowniku?",
        "Which word marks a completed action and usually follows the verb?",
        "คำใดแสดงว่าการกระทำเสร็จแล้วและมักอยู่หลังคำกริยา",
      ),
      [
        option("a", "จะ", "จะ", "จะ"),
        option("b", "แล้ว", "แล้ว", "แล้ว"),
        option("c", "กำลัง", "กำลัง", "กำลัง"),
        option("d", "ยัง", "ยัง", "ยัง"),
      ],
    ),
    question(
      "th-grammar-8",
      "grammar",
      "c",
      localized(
        "Uzupełnij: ฉัน ___ ทำงานอยู่ (właśnie pracuję).",
        "Complete: ฉัน ___ ทำงานอยู่ (I am working now).",
        "เติมคำ: ฉัน ___ ทำงานอยู่",
      ),
      [
        option("a", "เคย", "เคย", "เคย"),
        option("b", "จะ", "จะ", "จะ"),
        option("c", "กำลัง", "กำลัง", "กำลัง"),
        option("d", "ได้", "ได้", "ได้"),
      ],
    ),
    question(
      "th-grammar-9",
      "grammar",
      "a",
      localized(
        "Które słowo przeczące zwykle stoi przed czasownikiem?",
        "Which negative word usually comes before a verb?",
        "คำปฏิเสธใดมักอยู่หน้าคำกริยา",
      ),
      [
        option("a", "ไม่", "ไม่", "ไม่"),
        option("b", "ไหม", "ไหม", "ไหม"),
        option("c", "มาก", "มาก", "มาก"),
        option("d", "ด้วย", "ด้วย", "ด้วย"),
      ],
    ),
    question(
      "th-grammar-10",
      "grammar",
      "d",
      localized(
        "Wybierz naturalny szyk: „Jutro pójdę do biura”.",
        "Choose the natural order: “Tomorrow I will go to the office.”",
        "เลือกประโยคที่เรียงคำเป็นธรรมชาติ",
      ),
      [
        option(
          "a",
          "สำนักงาน พรุ่งนี้ ฉัน ไป",
          "สำนักงาน พรุ่งนี้ ฉัน ไป",
          "สำนักงาน พรุ่งนี้ ฉัน ไป",
        ),
        option(
          "b",
          "ไป ฉัน สำนักงาน พรุ่งนี้",
          "ไป ฉัน สำนักงาน พรุ่งนี้",
          "ไป ฉัน สำนักงาน พรุ่งนี้",
        ),
        option(
          "c",
          "ฉัน สำนักงาน ไป พรุ่งนี้",
          "ฉัน สำนักงาน ไป พรุ่งนี้",
          "ฉัน สำนักงาน ไป พรุ่งนี้",
        ),
        option(
          "d",
          "พรุ่งนี้ฉันจะไปสำนักงาน",
          "พรุ่งนี้ฉันจะไปสำนักงาน",
          "พรุ่งนี้ฉันจะไปสำนักงาน",
        ),
      ],
    ),
    question(
      "th-grammar-11",
      "grammar",
      "b",
      localized(
        "Który klasyfikator jest często używany do urządzeń i maszyn?",
        "Which classifier is often used for devices and machines?",
        "ลักษณนามใดมักใช้กับอุปกรณ์และเครื่องจักร",
      ),
      [
        option("a", "คน", "คน", "คน"),
        option("b", "เครื่อง", "เครื่อง", "เครื่อง"),
        option("c", "เล่ม", "เล่ม", "เล่ม"),
        option("d", "ตัว", "ตัว", "ตัว"),
      ],
    ),
    question(
      "th-listening-5",
      "listening",
      "a",
      localized(
        "Wybierz uprzejme pytanie: „Czy możesz wysłać plik?”",
        "Choose the polite question: “Can you send the file?”",
        "เลือกคำถามที่สุภาพว่า “ส่งไฟล์ได้ไหม”",
      ),
      [
        option(
          "a",
          "ช่วยส่งไฟล์ให้หน่อยได้ไหมครับ/คะ",
          "ช่วยส่งไฟล์ให้หน่อยได้ไหมครับ/คะ",
          "ช่วยส่งไฟล์ให้หน่อยได้ไหมครับ/คะ",
        ),
        option("b", "ส่งไฟล์เดี๋ยวนี้", "ส่งไฟล์เดี๋ยวนี้", "ส่งไฟล์เดี๋ยวนี้"),
        option("c", "ไฟล์ส่งคุณ", "ไฟล์ส่งคุณ", "ไฟล์ส่งคุณ"),
        option("d", "คุณไฟล์ไหม", "คุณไฟล์ไหม", "คุณไฟล์ไหม"),
      ],
    ),
    question(
      "th-listening-6",
      "listening",
      "d",
      localized(
        "Która odpowiedź znaczy „Jeszcze nie skończyłem”?",
        "Which reply means “I haven’t finished yet”?",
        "คำตอบใดหมายถึง “ยังทำไม่เสร็จ”",
      ),
      [
        option("a", "เสร็จแล้วครับ", "เสร็จแล้วครับ", "เสร็จแล้วครับ"),
        option("b", "ไม่ทำครับ", "ไม่ทำครับ", "ไม่ทำครับ"),
        option(
          "c",
          "จะเริ่มเมื่อวานครับ",
          "จะเริ่มเมื่อวานครับ",
          "จะเริ่มเมื่อวานครับ",
        ),
        option(
          "d",
          "ยังทำไม่เสร็จครับ",
          "ยังทำไม่เสร็จครับ",
          "ยังทำไม่เสร็จครับ",
        ),
      ],
    ),
    question(
      "th-listening-7",
      "listening",
      "b",
      localized(
        "Jak grzecznie poprosić o powtórzenie?",
        "How do you politely ask someone to repeat?",
        "จะขอให้อีกฝ่ายพูดซ้ำอย่างสุภาพได้อย่างไร",
      ),
      [
        option("a", "พูดอีก", "พูดอีก", "พูดอีก"),
        option(
          "b",
          "ช่วยพูดอีกครั้งได้ไหมครับ/คะ",
          "ช่วยพูดอีกครั้งได้ไหมครับ/คะ",
          "ช่วยพูดอีกครั้งได้ไหมครับ/คะ",
        ),
        option("c", "ฉันไม่ฟัง", "ฉันไม่ฟัง", "ฉันไม่ฟัง"),
        option("d", "คุณพูดผิด", "คุณพูดผิด", "คุณพูดผิด"),
      ],
    ),
    question(
      "th-listening-8",
      "listening",
      "c",
      localized(
        "Które zdanie naturalnie zgłasza problem z logowaniem?",
        "Which sentence naturally reports a login problem?",
        "ประโยคใดใช้แจ้งปัญหาการเข้าสู่ระบบได้เป็นธรรมชาติ",
      ),
      [
        option("a", "ล็อกอินไม่ฉัน", "ล็อกอินไม่ฉัน", "ล็อกอินไม่ฉัน"),
        option(
          "b",
          "ระบบฉันเสียทั้งหมด",
          "ระบบฉันเสียทั้งหมด",
          "ระบบฉันเสียทั้งหมด",
        ),
        option(
          "c",
          "ฉันเข้าสู่ระบบไม่ได้ครับ/ค่ะ",
          "ฉันเข้าสู่ระบบไม่ได้ครับ/ค่ะ",
          "ฉันเข้าสู่ระบบไม่ได้ครับ/ค่ะ",
        ),
        option("d", "รหัสผ่านไป", "รหัสผ่านไป", "รหัสผ่านไป"),
      ],
    ),
    question(
      "th-listening-9",
      "listening",
      "a",
      localized(
        "Wybierz naturalne rozpoczęcie spotkania.",
        "Choose a natural way to open a meeting.",
        "เลือกประโยคเปิดการประชุมที่เป็นธรรมชาติ",
      ),
      [
        option(
          "a",
          "เราเริ่มประชุมกันเลยดีไหมครับ/คะ",
          "เราเริ่มประชุมกันเลยดีไหมครับ/คะ",
          "เราเริ่มประชุมกันเลยดีไหมครับ/คะ",
        ),
        option("b", "ประชุมทำ", "ประชุมทำ", "ประชุมทำ"),
        option("c", "คุณเริ่มฉัน", "คุณเริ่มฉัน", "คุณเริ่มฉัน"),
        option("d", "ตอนนี้ประชุมใช่", "ตอนนี้ประชุมใช่", "ตอนนี้ประชุมใช่"),
      ],
    ),
    question(
      "th-listening-10",
      "listening",
      "d",
      localized(
        "Które zdanie oznacza „Wyślę aktualizację do końca dnia”?",
        "Which sentence means “I’ll send an update by the end of the day”?",
        "ประโยคใดหมายถึง “จะส่งข้อมูลอัปเดตภายในวันนี้”",
      ),
      [
        option("a", "ฉันส่งเมื่อวาน", "ฉันส่งเมื่อวาน", "ฉันส่งเมื่อวาน"),
        option("b", "ฉันไม่อัปเดต", "ฉันไม่อัปเดต", "ฉันไม่อัปเดต"),
        option("c", "วันนี้ส่งฉัน", "วันนี้ส่งฉัน", "วันนี้ส่งฉัน"),
        option(
          "d",
          "ฉันจะส่งข้อมูลอัปเดตภายในวันนี้",
          "ฉันจะส่งข้อมูลอัปเดตภายในวันนี้",
          "ฉันจะส่งข้อมูลอัปเดตภายในวันนี้",
        ),
      ],
    ),
  ],
};

export const localizeAdditionalQuestion = (
  item: PlacementBankQuestion,
  locale: InterfaceLocale,
): PlacementQuestion & { correct: string } => ({
  id: item.id,
  skill: item.skill,
  prompt: item.prompt[locale],
  options: item.options.map(({ id, text }) => ({ id, text: text[locale] })),
  correct: item.correct,
});
