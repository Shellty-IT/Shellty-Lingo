type Locale = "pl" | "en" | "th";
type Translation = { source: string; translations: Record<Locale, string> };
const en = (source: string, pl: string, th: string): Translation => ({
  source,
  translations: { pl, en: source, th },
});
const th = (source: string, pl: string, english: string): Translation => ({
  source,
  translations: { pl, en: english, th: source },
});

/** Full-sentence translations, including the conditional meaning. Never
 * translate tiles independently: their meaning depends on the complete order. */
export const orderingTranslations: Translation[] = [
  en(
    "We had been investigating the incident for two hours when the monitoring team found the root cause.",
    "Badaliśmy incydent już od dwóch godzin, gdy zespół monitorujący znalazł jego główną przyczynę.",
    "เราได้ตรวจสอบเหตุขัดข้องมาเป็นเวลาสองชั่วโมงแล้ว เมื่อทีมเฝ้าระวังพบสาเหตุหลัก",
  ),
  en(
    "Had we anticipated the increase in traffic, we would have scaled the service in advance.",
    "Gdybyśmy przewidzieli wzrost ruchu, wcześniej zwiększylibyśmy wydajność usługi.",
    "หากเราคาดการณ์การเพิ่มขึ้นของปริมาณการใช้งานไว้ เราก็คงขยายขีดความสามารถของบริการล่วงหน้าแล้ว",
  ),
  en(
    "Not only did the team restore the service, but it also documented the recovery procedure.",
    "Zespół nie tylko przywrócił działanie usługi, lecz także udokumentował procedurę jej przywracania.",
    "ทีมไม่เพียงกู้คืนบริการ แต่ยังบันทึกขั้นตอนการกู้คืนไว้ด้วย",
  ),
  en(
    "There is some evidence to suggest that the intervention has had a positive effect.",
    "Istnieją pewne dowody wskazujące, że podjęte działanie przyniosło pozytywny skutek.",
    "มีหลักฐานบางส่วนที่บ่งชี้ว่าการดำเนินการนั้นส่งผลในทางบวก",
  ),
  en(
    "I can see where you're coming from, but we may be overlooking the long-term impact.",
    "Rozumiem twój punkt widzenia, ale być może pomijamy długofalowe skutki.",
    "ฉันเข้าใจมุมมองของคุณ แต่เราอาจกำลังมองข้ามผลกระทบระยะยาว",
  ),
  en(
    "Before I conclude, I'd like to highlight the two implications that matter most.",
    "Zanim zakończę, chciałbym zwrócić uwagę na dwie najważniejsze konsekwencje.",
    "ก่อนจบ ฉันอยากเน้นผลที่ตามมาสองประการที่สำคัญที่สุด",
  ),
  en(
    "If you can extend the support period, we may be able to meet you halfway on price.",
    "Jeśli możecie wydłużyć okres wsparcia, być może będziemy mogli wypracować kompromis w sprawie ceny.",
    "หากคุณขยายระยะเวลาสนับสนุนได้ เราอาจสามารถประนีประนอมเรื่องราคาได้",
  ),
  en(
    "Based on these findings, the report recommends a phased implementation over the next six months.",
    "Na podstawie tych ustaleń raport zaleca etapowe wdrożenie w ciągu najbliższych sześciu miesięcy.",
    "จากข้อค้นพบเหล่านี้ รายงานแนะนำให้ดำเนินการเป็นระยะในช่วงหกเดือนข้างหน้า",
  ),
  en(
    "You handled the discussion confidently; one area to develop is how you summarise decisions.",
    "Pewnie poprowadziłeś dyskusję; jednym z obszarów do poprawy jest sposób, w jaki podsumowujesz decyzje.",
    "คุณดำเนินการอภิปรายอย่างมั่นใจ สิ่งหนึ่งที่ควรพัฒนาคือวิธีสรุปการตัดสินใจ",
  ),
  en(
    "Although the article raises important questions, it provides little evidence to support its central claim.",
    "Chociaż artykuł porusza ważne kwestie, przedstawia niewiele dowodów na poparcie swojej głównej tezy.",
    "แม้บทความจะตั้งคำถามสำคัญ แต่ให้หลักฐานเพียงเล็กน้อยเพื่อสนับสนุนข้ออ้างหลัก",
  ),
  en(
    "Instead of assuming that our approach is universal, we should ask how local teams prefer to work.",
    "Zamiast zakładać, że nasze podejście jest uniwersalne, powinniśmy zapytać, jak wolą pracować lokalne zespoły.",
    "แทนที่จะคิดว่าแนวทางของเราใช้ได้ทุกที่ เราควรถามว่าทีมในพื้นที่ชอบทำงานอย่างไร",
  ),
  en(
    "Having compared the cost, risk and impact, we concluded that a phased approach was the safest option.",
    "Po porównaniu kosztów, ryzyka i skutków uznaliśmy, że podejście etapowe jest najbezpieczniejszym rozwiązaniem.",
    "หลังจากเปรียบเทียบต้นทุน ความเสี่ยง และผลกระทบ เราสรุปว่าแนวทางแบบเป็นระยะเป็นทางเลือกที่ปลอดภัยที่สุด",
  ),
  en(
    "Could you explain that again, please?",
    "Czy możesz wyjaśnić to jeszcze raz?",
    "ช่วยอธิบายเรื่องนั้นอีกครั้งได้ไหม",
  ),
  en("Can you help me?", "Czy możesz mi pomóc?", "คุณช่วยฉันได้ไหม"),
  en(
    "I would like to book a table.",
    "Chciałbym zarezerwować stolik.",
    "ฉันอยากจองโต๊ะ",
  ),
  en(
    "What time does the meeting start?",
    "O której godzinie zaczyna się spotkanie?",
    "การประชุมเริ่มกี่โมง",
  ),
  en(
    "I do not understand this question.",
    "Nie rozumiem tego pytania.",
    "ฉันไม่เข้าใจคำถามนี้",
  ),
  en(
    "I will send the report tomorrow.",
    "Wyślę raport jutro.",
    "ฉันจะส่งรายงานพรุ่งนี้",
  ),
  en(
    "Can we change the deadline?",
    "Czy możemy zmienić termin?",
    "เราเปลี่ยนกำหนดส่งได้ไหม",
  ),
  en(
    "The main risk is the delayed client feedback.",
    "Głównym ryzykiem jest opóźniona informacja zwrotna od klienta.",
    "ความเสี่ยงหลักคือความคิดเห็นจากลูกค้าที่ล่าช้า",
  ),
  en(
    "Could you send me a screenshot of the error?",
    "Czy możesz przesłać mi zrzut ekranu z błędem?",
    "ช่วยส่งภาพหน้าจอของข้อผิดพลาดให้ฉันได้ไหม",
  ),
  en(
    "The monitor is on but the screen is blank.",
    "Monitor jest włączony, ale ekran jest pusty.",
    "จอภาพเปิดอยู่แต่หน้าจอว่างเปล่า",
  ),
  en(
    "First, close the app and then open it again.",
    "Najpierw zamknij aplikację, a następnie otwórz ją ponownie.",
    "ก่อนอื่นให้ปิดแอป แล้วเปิดใหม่อีกครั้ง",
  ),
  en(
    "I’ve opened a pull request and assigned two reviewers.",
    "Otworzyłem pull request i wyznaczyłem dwie osoby do przeglądu kodu.",
    "ฉันเปิด pull request และมอบหมายผู้ตรวจสองคนแล้ว",
  ),
  en(
    "Please review my changes before we merge the branch.",
    "Sprawdź proszę moje zmiany, zanim scalimy gałąź.",
    "โปรดตรวจการเปลี่ยนแปลงของฉันก่อนที่เราจะรวม branch",
  ),
  en(
    "We will release the update after the final staging check.",
    "Wydamy aktualizację po końcowym sprawdzeniu w środowisku testowym.",
    "เราจะเผยแพร่การอัปเดตหลังตรวจครั้งสุดท้ายในสภาพแวดล้อม staging",
  ),
  en(
    "The immediate fix reduces risk but increases operational complexity.",
    "Doraźna poprawka zmniejsza ryzyko, ale zwiększa złożoność utrzymania systemu.",
    "การแก้ไขทันทีช่วยลดความเสี่ยง แต่เพิ่มความซับซ้อนในการดำเนินงาน",
  ),
  en(
    "The incident commander assigned an owner to each recovery task.",
    "Osoba kierująca reakcją na incydent przypisała odpowiedzialną osobę do każdego zadania naprawczego.",
    "ผู้บัญชาการเหตุขัดข้องมอบหมายผู้รับผิดชอบให้แต่ละงานกู้คืน",
  ),
  en(
    "The trace shows that most of the delay comes from an external dependency.",
    "Ślad żądania pokazuje, że większość opóźnienia wynika z zewnętrznej zależności.",
    "ข้อมูลติดตามแสดงว่าความล่าช้าส่วนใหญ่มาจากส่วนที่พึ่งพาภายนอก",
  ),
  en(
    "The proposed architecture removes a single point of failure while keeping operational costs manageable.",
    "Proponowana architektura eliminuje pojedynczy punkt awarii, jednocześnie utrzymując koszty operacyjne na rozsądnym poziomie.",
    "สถาปัตยกรรมที่เสนอขจัดจุดล้มเหลวเพียงจุดเดียว โดยยังควบคุมต้นทุนการดำเนินงานได้",
  ),
  en(
    "If the primary region fails, traffic is redirected to the standby region within two minutes.",
    "Jeśli region główny ulegnie awarii, ruch jest przekierowywany do regionu zapasowego w ciągu dwóch minut.",
    "หากภูมิภาคหลักขัดข้อง ปริมาณการใช้งานจะถูกเปลี่ยนเส้นทางไปยังภูมิภาคสำรองภายในสองนาที",
  ),
  en(
    "Before approving the design, we need to document the trust boundaries and abuse scenarios.",
    "Przed zatwierdzeniem projektu musimy udokumentować granice zaufania i scenariusze nadużyć.",
    "ก่อนอนุมัติการออกแบบ เราต้องบันทึกขอบเขตความเชื่อถือและสถานการณ์การใช้งานในทางที่ผิด",
  ),
  th(
    "ช่วยอธิบาย อีกครั้ง ได้ไหมครับ",
    "Czy możesz wyjaśnić to jeszcze raz?",
    "Could you explain it again, please?",
  ),
  th(
    "ความเสี่ยงหลักคือ ความคิดเห็นจากลูกค้าล่าช้า",
    "Głównym ryzykiem jest opóźniona informacja zwrotna od klienta.",
    "The main risk is delayed client feedback.",
  ),
  th(
    "ช่วยส่งภาพหน้าจอ ข้อความผิดพลาด ให้หน่อยครับ",
    "Prześlij proszę zrzut ekranu z komunikatem błędu.",
    "Please send a screenshot of the error message.",
  ),
  th(
    "ผมเปิด pull request และขอ code review แล้ว",
    "Otworzyłem pull request i poprosiłem o przegląd kodu.",
    "I have opened a pull request and requested a code review.",
  ),
  th(
    "วิธีแก้ชั่วคราว ช่วยลดความเสี่ยง แต่เพิ่มความซับซ้อนในการดูแลระบบ",
    "Tymczasowe rozwiązanie zmniejsza ryzyko, ale zwiększa złożoność utrzymania systemu.",
    "The temporary fix reduces risk but increases maintenance complexity.",
  ),
  en(
    "Could I have the menu, please?",
    "Czy mogę prosić o menu?",
    "ขอเมนูหน่อยได้ไหม",
  ),
  en(
    "What would you like to drink?",
    "Czego chciałbyś się napić?",
    "คุณอยากดื่มอะไร",
  ),
  en(
    "They will bring it soon.",
    "Wkrótce to przyniosą.",
    "พวกเขาจะนำมาให้ในไม่ช้า",
  ),
  en(
    "Does this dish contain meat?",
    "Czy to danie zawiera mięso?",
    "อาหารจานนี้มีเนื้อสัตว์ไหม",
  ),
  en("What's your name?", "Jak masz na imię?", "คุณชื่ออะไร"),
  en(
    "Pretty good, thanks. You?",
    "Całkiem dobrze, dzięki. A u ciebie?",
    "ค่อนข้างดี ขอบคุณ แล้วคุณล่ะ",
  ),
  en("It's very close.", "To jest bardzo blisko.", "อยู่ใกล้มาก"),
  en("What time is it?", "Która jest godzina?", "กี่โมงแล้ว"),
  en("Sounds good to me!", "Brzmi dobrze!", "ฟังดูดีสำหรับฉัน"),
];

const normalized = (text: string) =>
  text
    .normalize("NFKC")
    .replace(/[’]/g, "'")
    .replace(/\s+([,.;!?])/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();
export const orderingTranslation = (
  sentence: string,
  locale: Locale,
): string | undefined =>
  orderingTranslations.find(
    (item) => normalized(item.source) === normalized(sentence),
  )?.translations[locale];

export const orderingSentence = (options: unknown, answer: unknown): string => {
  if (!Array.isArray(options) || !answer || typeof answer !== "object")
    return "";
  const ids = (answer as { correct?: unknown }).correct;
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string"))
    return "";
  const parts = ids.map(
    (id) =>
      options.find(
        (option: unknown) =>
          option &&
          typeof option === "object" &&
          (option as { id?: unknown }).id === id,
      ) as { text?: unknown } | undefined,
  );
  if (!parts.every((part) => typeof part?.text === "string")) return "";
  return parts
    .map((part) => part!.text as string)
    .join(" ")
    .replace(/\s+([,.;!?])/gu, "$1")
    .trim();
};
