/** Authored teaching content. Match the whole option set and answer key, never
 * infer grammatical correctness from a learner's selection or a sentence alone.
 * Shared by demo seeds and feedback for existing revisions. */
type Locale = "pl" | "en" | "th";
type Localized = Record<Locale, string>;
type Choice = { text: string; correct: boolean; reason: Localized };
type Lesson = { rule: Localized; choices: Choice[] };
const l = (pl: string, en: string, th: string): Localized => ({ pl, en, th });
const c = (
  text: string,
  correct: boolean,
  pl: string,
  en: string,
  th: string,
): Choice => ({ text, correct, reason: l(pl, en, th) });

export const choiceTeaching: Lesson[] = [
  {
    rule: l(
      "Past Perfect (had + III forma) wskazuje czynność wcześniejszą niż inny moment w przeszłości. Past Perfect Continuous (had been + -ing) podkreśla jej trwanie do tego momentu. Past Simple opisuje późniejsze wydarzenie.",
      "Past Perfect (had + past participle) places an action before another past moment. Past Perfect Continuous (had been + -ing) stresses its duration up to that moment. Past Simple describes the later event.",
      "Past Perfect (had + กริยาช่อง 3) บอกเหตุการณ์ที่เกิดก่อนอีกจุดในอดีต ส่วน Past Perfect Continuous (had been + -ing) เน้นระยะเวลาจนถึงจุดนั้น และ Past Simple ใช้กับเหตุการณ์ภายหลัง",
    ),
    choices: [
      c(
        "By the time I arrived, they had already left.",
        true,
        "„Had left” to wcześniejsze wyjście; „arrived” to późniejsze przybycie. Already oznacza „już”.",
        "Had left is the earlier departure; arrived is the later arrival. Already stresses that the departure was complete.",
        "had left คือการออกไปก่อน ส่วน arrived คือการมาถึงภายหลัง already เน้นว่าออกไปแล้ว",
      ),
      c(
        "She had been waiting for an hour when he called.",
        true,
        "„Had been waiting” podkreśla godzinę oczekiwania do chwili telefonu („called”). For an hour określa długość trwania.",
        "Had been waiting stresses the hour spent waiting before he called. For an hour gives the duration.",
        "had been waiting เน้นการรอเป็นเวลาหนึ่งชั่วโมงก่อนเขาโทรมา for an hour บอกระยะเวลา",
      ),
      c(
        "I had went there yesterday.",
        false,
        "Po had potrzebna jest III forma gone, nie went (Past Simple). Poprawnie: „I had gone there before she called yesterday.” Bez drugiego punktu w przeszłości naturalne jest „I went there yesterday.”",
        "Had requires gone, not the Past Simple went. Use “I had gone there before she called yesterday.” Without another past reference, “I went there yesterday” is natural.",
        "หลัง had ต้องใช้ gone ไม่ใช่ went เช่น “I had gone there before she called yesterday.” หากเล่าเพียงเหตุการณ์เมื่อวาน ใช้ “I went there yesterday.”",
      ),
      c(
        "They were finished before we had arrive.",
        false,
        "„Had arrive” jest błędne: po had musi być arrived. Dla zamierzonej kolejności zdarzeń: „They had finished before we arrived.” Were finished może opisywać stan zakończenia, ale nie naprawia błędu po had.",
        "Had arrive is invalid: had needs arrived. For the intended sequence use “They had finished before we arrived.” Were finished can describe a completed state, but cannot repair had arrive.",
        "had arrive ผิด เพราะหลัง had ต้องใช้ arrived ลำดับเหตุการณ์ที่ต้องการคือ “They had finished before we arrived.” ส่วน were finished อาจบอกสภาพที่เสร็จแล้วได้",
      ),
    ],
  },
  {
    rule: l(
      "III okres warunkowy: if + Past Perfect, would have + III forma — nierealna przeszłość. II okres: if + Past Simple, would + bezokolicznik — hipotetyczna teraźniejszość lub przyszłość. Would be + -ing podkreśla trwanie hipotetycznej czynności. Po will/would używamy formy podstawowej czasownika.",
      "Third conditional: if + Past Perfect, would have + past participle, for an unreal past. Second conditional: if + Past Simple, would + base verb, for a hypothetical present or future. Would be + -ing describes an ongoing hypothetical action. Will/would take a base verb.",
      "เงื่อนไขแบบที่ 3 ใช้ if + Past Perfect, would have + กริยาช่อง 3 สำหรับอดีตที่ไม่ได้เกิดขึ้น แบบที่ 2 ใช้ if + Past Simple, would + กริยารูปพื้นฐาน สำหรับสมมติปัจจุบันหรืออนาคต would be + -ing เน้นการกระทำที่กำลังดำเนินอยู่ และหลัง will/would ใช้กริยารูปพื้นฐาน",
    ),
    choices: [
      c(
        "If I had known, I would have prepared differently.",
        true,
        "Had known i would have prepared tworzą III okres warunkowy: wtedy nie wiedziałem, więc nie przygotowałem się inaczej. Known to III forma know.",
        "Had known and would have prepared form a third conditional: I did not know then, so I did not prepare differently. Known is the participle of know.",
        "had known กับ would have prepared เป็นเงื่อนไขแบบที่ 3 ตอนนั้นไม่รู้จึงไม่ได้เตรียมตัวต่างออกไป known เป็นกริยาช่อง 3 ของ know",
      ),
      c(
        "If the process were simpler, we would be moving faster.",
        true,
        "Were wyraża hipotetyczny stan teraz. Would be moving opisuje jego trwający skutek. To II okres warunkowy z formą ciągłą w części wynikowej.",
        "Were marks a hypothetical present state; would be moving expresses its ongoing result. This is a second conditional with a progressive result clause.",
        "were บอกสภาพสมมติในปัจจุบัน would be moving บอกผลที่กำลังดำเนินอยู่ เป็นเงื่อนไขแบบที่ 2 ที่ใช้รูปต่อเนื่องในส่วนผล",
      ),
      c(
        "If I would know, I had prepared.",
        false,
        "W tym zwykłym warunku nie stawiamy would po if, a had prepared nie wyraża hipotetycznego skutku. O przeszłości: „If I had known, I would have prepared.” O teraźniejszości: „If I knew, I would prepare.”",
        "In this ordinary condition would does not belong after if, and had prepared does not express the hypothetical result. Past: “If I had known, I would have prepared.” Present: “If I knew, I would prepare.”",
        "เงื่อนไขทั่วไปนี้ไม่ใช้ would หลัง if และ had prepared ไม่ใช่ผลสมมติ อดีตใช้ “If I had known, I would have prepared.” ปัจจุบันใช้ “If I knew, I would prepare.”",
      ),
      c(
        "If it was easier, we will moved faster.",
        false,
        "Will moved jest niegramatyczne: po will musi być move. Dla hipotetycznej sytuacji użyj „If it were easier, we would move faster.” Dla realnej przyszłości: „If it is easier, we will move faster.” Samo was bywa dopuszczalne w potocznym II okresie; nie jest tu głównym błędem.",
        "Will moved is ungrammatical: will needs move. Hypothetical: “If it were easier, we would move faster.” Real future: “If it is easier, we will move faster.” Was can occur in informal second conditionals; it is not the main error here.",
        "will moved ผิด ต้องใช้ will move ถ้าเป็นสมมติใช้ “If it were easier, we would move faster.” ถ้าเป็นอนาคตที่เป็นไปได้ใช้ “If it is easier, we will move faster.” was พบได้ในภาษาพูดของเงื่อนไขแบบที่ 2 จึงไม่ใช่ข้อผิดหลัก",
      ),
    ],
  },
  {
    rule: l(
      "Po przeczącym never na początku zdania stosujemy inwersję: operator + podmiot + czasownik. Present Perfect ma formę have/has + III forma i może obejmować doświadczenie do teraz. Konstrukcja What … is … wyróżnia ważną informację.",
      "Initial negative never triggers inversion: auxiliary + subject + verb. Present Perfect uses have/has + past participle for experience up to now. What … is … highlights important information.",
      "เมื่อขึ้นต้นด้วย never ใช้การสลับลำดับเป็นกริยาช่วย + ประธาน + กริยา Present Perfect ใช้ have/has + กริยาช่อง 3 สำหรับประสบการณ์จนถึงปัจจุบัน What … is … ใช้เน้นข้อมูล",
    ),
    choices: [
      c(
        "Never have I seen such a rapid recovery.",
        true,
        "Have stoi przed I po początkowym never. Seen to III forma see; a poprzedza pojedynczy policzalny rzeczownik recovery w tym użyciu.",
        "Have precedes I after initial never. Seen is the participle of see; a introduces the singular countable use of recovery.",
        "have อยู่ก่อน I หลัง never และ seen เป็นช่อง 3 ของ see ส่วน a นำหน้า recovery ที่ใช้เป็นนามนับได้เอกพจน์",
      ),
      c(
        "What we need is a clearer decision process.",
        true,
        "Całe What we need jest podmiotem; is łączy je z jednym procesem („a … process”). Clearer to stopień wyższy clear.",
        "What we need is the subject; is links it to one process (a … process). Clearer is the comparative of clear.",
        "What we need เป็นประธาน is เชื่อมกับกระบวนการหนึ่งอย่าง a … process ส่วน clearer เป็นขั้นกว่าของ clear",
      ),
      c(
        "Never I have seen such recovery.",
        false,
        "Brakuje inwersji po never. Poprawnie: „Never have I seen such a recovery.” Przy zwykłym szyku: „I have never seen such a recovery.”",
        "Initial never requires inversion. Use “Never have I seen such a recovery.” With ordinary word order: “I have never seen such a recovery.”",
        "หลัง never ต้นประโยคต้องสลับลำดับ ใช้ “Never have I seen such a recovery.” หรือ “I have never seen such a recovery.”",
      ),
      c(
        "What we need are a clearer decision process.",
        false,
        "Are nie pasuje tu do pojedynczego a … process. Poprawnie: „What we need is a clearer decision process.” Przy dopełnieniu mnogim możliwa jest inna zgoda, ale tu mowa o jednym procesie.",
        "Are does not fit the singular a … process here. Use “What we need is a clearer decision process.” Plural complements may allow different agreement, but this complement is singular.",
        "are ไม่เข้ากับ a … process ที่เป็นเอกพจน์ ใช้ “What we need is a clearer decision process.” กรณีส่วนเติมเต็มพหูพจน์อาจใช้การสอดคล้องต่างกันได้",
      ),
    ],
  },
];

choiceTeaching.push(
  {
    rule: l(
      "Wszystkie zdania są gramatyczne, ale zadanie wymaga ostrożnej opinii. May + bezokolicznik oznacza możliwość. Appear to have + III forma odnosi ostrożną ocenę do wcześniejszego zdarzenia; Present Perfect łączy jego skutek z teraźniejszością.",
      "All options are grammatical, but the task asks for a cautious opinion. May + base verb expresses possibility. Appear to have + past participle tentatively describes an earlier event; Present Perfect connects a past event with its present result.",
      "ทุกข้อถูกไวยากรณ์ แต่โจทย์ต้องการความเห็นอย่างระมัดระวัง may + กริยารูปพื้นฐานบอกความเป็นไปได้ appear to have + ช่อง 3 ประเมินเหตุการณ์ก่อนหน้าอย่างไม่ฟันธง Present Perfect เชื่อมเหตุการณ์กับผลในปัจจุบัน",
    ),
    choices: [
      c(
        "The change appears to have improved retention.",
        true,
        "Appears łagodzi pewność; to have improved wskazuje poprawę wcześniejszą niż obecna ocena.",
        "Appears hedges the claim; to have improved places the improvement before the current assessment.",
        "appears ลดความมั่นใจ ส่วน to have improved บอกว่าดีขึ้นก่อนการประเมินขณะนี้",
      ),
      c(
        "This may be partly due to seasonal demand.",
        true,
        "May be oznacza „może być”, partly — „częściowo”. Due to wprowadza możliwą przyczynę.",
        "May be marks possibility, partly limits the claim, and due to introduces a possible cause.",
        "may be บอกความเป็นไปได้ partly จำกัดขอบเขต และ due to นำหน้าสาเหตุ",
      ),
      c(
        "This definitely proves everything.",
        false,
        "Gramatyka jest poprawna (this + proves), lecz definitely i everything wyrażają nieuzasadnioną pewność. Lepiej: „This may support our hypothesis.”",
        "This + proves agrees correctly, but definitely and everything overstate certainty. Try “This may support our hypothesis.”",
        "this + proves สอดคล้องกัน แต่ definitely และ everything มั่นใจเกินไป ใช้ “This may support our hypothesis.”",
      ),
      c(
        "The results prove that the change will always work.",
        false,
        "Prove zgadza się z results, a will work ma poprawną formę. Błąd dotyczy sensu: always obiecuje sukces zawsze. Lepiej: „The results suggest that the change may work.”",
        "Results + prove and will work are grammatical. Always makes an absolute claim. Try “The results suggest that the change may work.”",
        "results + prove และ will work ถูกต้อง แต่ always อ้างว่าได้ผลเสมอ ลอง “The results suggest that the change may work.”",
      ),
    ],
  },
  {
    rule: l(
      "Profesjonalna polemika uznaje argument rozmówcy i dodaje zastrzeżenie za pomocą but lub however. Present Simple opisuje obecną opinię lub stan; nie każde gramatyczne zdanie jest uprzejme.",
      "Professional disagreement acknowledges a point before adding a reservation with but or however. Present Simple describes a current view or state; grammatical sentences can still be impolite.",
      "การแย้งอย่างมืออาชีพยอมรับประเด็นก่อนเสริมข้อโต้แย้งด้วย but หรือ however Present Simple บอกความเห็นหรือสภาพปัจจุบัน ประโยคถูกไวยากรณ์อาจไม่สุภาพได้",
    ),
    choices: [
      c(
        "I take your point, but there is another factor to consider.",
        true,
        "I take your point uznaje argument; but wprowadza inny czynnik. There is pasuje do pojedynczego factor.",
        "I take your point acknowledges the argument; but adds another factor. There is agrees with singular factor.",
        "I take your point ยอมรับเหตุผล but เสริมอีกปัจจัย และ there is ใช้กับ factor เอกพจน์",
      ),
      c(
        "That's a fair point; however, the data suggests otherwise.",
        true,
        "However sygnalizuje kontrast bez ataku. Data może być rzeczownikiem zbiorowym z suggests; w stylu naukowym spotkasz też data suggest.",
        "However introduces respectful contrast. Data can be a mass noun with suggests; scientific usage also permits plural data suggest.",
        "however แสดงความต่างอย่างสุภาพ data ใช้เป็นนามมวลรวมกับ suggests ได้ ในงานวิทยาศาสตร์พบ data suggest แบบพหูพจน์ด้วย",
      ),
      c(
        "You are simply wrong.",
        false,
        "You are + przymiotnik jest poprawne, ale zdanie atakuje ocenę rozmówcy bez uzasadnienia. Lepiej: „I see your point, but the evidence suggests otherwise.”",
        "You are + adjective is grammatical, but dismisses the other person's view without evidence. Try “I see your point, but the evidence suggests otherwise.”",
        "you are + คุณศัพท์ถูกต้อง แต่ปฏิเสธความเห็นโดยไม่ให้เหตุผล ใช้ “I see your point, but the evidence suggests otherwise.”",
      ),
      c(
        "Your evidence does not matter, so the discussion is over.",
        false,
        "Does not + matter ma poprawną formę podstawową. Wypowiedź odrzuca dowody i zamyka rozmowę. Lepiej: „Could we examine that evidence together?”",
        "Does not correctly takes base-form matter. The sentence dismisses evidence and closes discussion. Try “Could we examine that evidence together?”",
        "does not ตามด้วย matter รูปพื้นฐานถูกต้อง แต่ปิดการสนทนา ใช้ “Could we examine that evidence together?”",
      ),
    ],
  },
  {
    rule: l(
      "Zwroty porządkujące prezentację zapowiadają kolejny temat lub powrót do pytania. Po let + osoba używamy bezokolicznika bez to; po will i cannot także formy podstawowej. Wszystkie opcje są gramatyczne, ale różnią się funkcją.",
      "Presentation signposts introduce a topic or promise to return to it. Let + person takes a bare infinitive, as do will and cannot. All options are grammatical but serve different purposes.",
      "คำเชื่อมการนำเสนอบอกหัวข้อถัดไปหรือสัญญาจะกลับมาประเด็นเดิม หลัง let + บุคคล และ will/cannot ใช้กริยารูปพื้นฐาน ทุกข้อถูกไวยากรณ์แต่หน้าที่ต่างกัน",
    ),
    choices: [
      c(
        "Let me turn to the main implication.",
        true,
        "Let me turn (bez to przed turn) zapowiada przejście do głównego wniosku.",
        "Let me turn, with no to before turn, introduces the main implication.",
        "Let me turn ไม่ใส่ to ก่อน turn ใช้เปลี่ยนเข้าสู่ผลสำคัญ",
      ),
      c(
        "I'll come back to that point in a moment.",
        true,
        "I'll = I will. Come back zapowiada powrót do tematu za chwilę.",
        "I'll means I will. Come back promises to return to the point shortly.",
        "I'll ย่อจาก I will และ come back สัญญาจะกลับมาประเด็นนั้นในไม่ช้า",
      ),
      c(
        "I will ignore the main result and end the presentation.",
        false,
        "Will ignore i end są poprawne, ale zapowiedź pominięcia wyniku nie porządkuje wywodu. Lepiej: „I will now explain the main result.”",
        "Will ignore and end are correct forms, but ignoring the result does not guide the audience. Try “I will now explain the main result.”",
        "will ignore และ end ถูกต้อง แต่การละผลหลักไม่ช่วยผู้ฟัง ใช้ “I will now explain the main result.”",
      ),
      c(
        "I cannot discuss any questions today.",
        false,
        "Cannot discuss jest poprawne. Zdanie odmawia dyskusji zamiast wskazać jej miejsce. Lepiej: „I'll take questions at the end.”",
        "Cannot discuss is grammatical, but refuses discussion instead of scheduling it. Try “I'll take questions at the end.”",
        "cannot discuss ถูกต้อง แต่ปฏิเสธคำถาม ใช้ “I'll take questions at the end.” เพื่อจัดลำดับ",
      ),
    ],
  },
  {
    rule: l(
      "Could + bezokolicznik łagodzi propozycję. Provided (that) znaczy „pod warunkiem że”; przy realnym warunku dotyczącym przyszłości używamy tu Present Simple. Pytanie z be ma szyk is/are + podmiot.",
      "Could + base verb softens a proposal. Provided (that) means on condition that; a real future condition uses Present Simple here. Questions with be invert is/are and the subject.",
      "could + กริยารูปพื้นฐานทำให้ข้อเสนอนุ่มนวล provided (that) แปลว่ามีเงื่อนไขว่า โดยเงื่อนไขอนาคตที่เป็นจริงใช้ Present Simple คำถาม be วาง is/are ก่อนประธาน",
    ),
    choices: [
      c(
        "We could agree to that provided the timeline remains unchanged.",
        true,
        "Could agree proponuje kompromis; remains zgadza się z pojedynczym timeline i określa warunek.",
        "Could agree offers compromise; remains agrees with singular timeline and states the condition.",
        "could agree เสนอการประนีประนอม remains สอดคล้องกับ timeline เอกพจน์และบอกเงื่อนไข",
      ),
      c(
        "Is there any flexibility on the support period?",
        true,
        "Is there …? to poprawne pytanie o możliwość zmiany. Any jest naturalne w pytaniach tego typu.",
        "Is there …? correctly asks about scope for change. Any is natural in this question.",
        "Is there …? ถามถึงโอกาสปรับเปลี่ยนได้ถูกต้อง และ any ใช้ในคำถามนี้ได้เป็นธรรมชาติ",
      ),
      c(
        "Accept this now or leave.",
        false,
        "Rozkaz accept/leave jest gramatyczny, ale stanowi ultimatum. Lepiej: „Could we discuss an alternative?”",
        "The imperatives accept/leave are grammatical but deliver an ultimatum. Try “Could we discuss an alternative?”",
        "คำสั่ง accept/leave ถูกไวยากรณ์แต่เป็นคำขาด ใช้ “Could we discuss an alternative?”",
      ),
      c(
        "The price is fixed and cannot be discussed.",
        false,
        "Is fixed i cannot be discussed to poprawne formy bierne, lecz zamykają negocjacje. Lepiej: „Could we discuss the price?”",
        "Is fixed and cannot be discussed are valid passive forms but rule out negotiation. Try “Could we discuss the price?”",
        "is fixed และ cannot be discussed เป็นรูปถูกกระทำที่ถูกต้อง แต่ไม่เปิดการเจรจา ใช้ “Could we discuss the price?”",
      ),
    ],
  },
  {
    rule: l(
      "Raport oddziela wyniki od zaleceń i nie wyciąga nieuzasadnionych wniosków. Present Simple opisuje znaczenie wyników. Po recommend that można użyć trybu łączącego: podmiot + forma podstawowa, np. the trial be extended (strona bierna).",
      "Reports separate findings from recommendations and avoid unsupported conclusions. Present Simple states what findings indicate. Recommend that can take the subjunctive: subject + base form, as in the trial be extended (passive).",
      "รายงานแยกผลจากคำแนะนำและไม่สรุปเกินหลักฐาน Present Simple บอกความหมายของผล หลัง recommend that ใช้ subjunctive ประธาน + รูปพื้นฐานได้ เช่น the trial be extended ในรูปถูกกระทำ",
    ),
    choices: [
      c(
        "The findings indicate a significant reduction in processing time.",
        true,
        "Mnogie findings łączy się z indicate. Zdanie wskazuje konkretny wynik: skrócenie czasu przetwarzania.",
        "Plural findings takes indicate. The claim identifies a specific reduction in processing time.",
        "findings พหูพจน์ใช้ indicate และระบุผลที่ชัดเจนว่าลดเวลาในการประมวลผล",
      ),
      c(
        "It is therefore recommended that the trial be extended.",
        true,
        "Is recommended wprowadza zalecenie. Be extended (nie musi być is extended) to poprawny tryb łączący w stronie biernej.",
        "Is recommended introduces advice. Be extended is a valid passive subjunctive; it need not be is extended.",
        "is recommended นำคำแนะนำ be extended เป็น passive subjunctive ที่ถูกต้อง ไม่จำเป็นต้องใช้ is extended",
      ),
      c(
        "These results guarantee that the approach will work in every setting.",
        false,
        "Gramatyka jest poprawna, lecz guarantee i every setting bez dowodów rozszerzają wniosek. Lepiej: „These results suggest that the approach may work in similar settings.”",
        "The grammar is correct, but guarantee and every setting overgeneralise. Try “These results suggest that the approach may work in similar settings.”",
        "ไวยากรณ์ถูกต้อง แต่ guarantee กับ every setting สรุปกว้างเกินไป ใช้ “These results suggest that the approach may work in similar settings.”",
      ),
      c(
        "The trial was obviously a success, so further analysis is unnecessary.",
        false,
        "Was opisuje przeszłość, is obecną ocenę — to poprawne. Problemem jest nieuzasadnione odrzucenie analizy. Lepiej: „The trial was promising, but further analysis is needed.”",
        "Was describes the past and is the current assessment correctly. The problem is dismissing analysis without justification. Try “The trial was promising, but further analysis is needed.”",
        "was เล่าอดีต is ประเมินปัจจุบันได้ถูกต้อง แต่ตัดการวิเคราะห์โดยไม่มีเหตุผล ใช้ “The trial was promising, but further analysis is needed.”",
      ),
    ],
  },
  {
    rule: l(
      "Konstruktywny feedback opisuje konkretną pracę i możliwą poprawę. Past Simple ocenia wykonaną pracę, would + bezokolicznik wskazuje hipotetyczną korzyść, a let's + bezokolicznik proponuje wspólne działanie.",
      "Constructive feedback names specific work and a possible improvement. Past Simple evaluates completed work, would + base verb suggests a hypothetical benefit, and let's + base verb proposes joint action.",
      "ข้อเสนอแนะที่สร้างสรรค์ระบุงานและสิ่งที่ปรับปรุงได้ Past Simple ประเมินงานที่ทำแล้ว would + รูปพื้นฐานบอกผลที่อาจได้ และ let's + รูปพื้นฐานเสนอให้ทำร่วมกัน",
    ),
    choices: [
      c(
        "Your analysis was clear; adding sources would make it more persuasive.",
        true,
        "Was clear docenia analizę, a adding sources (podmiot z -ing) wskazuje konkretną poprawę. Would make opisuje jej skutek.",
        "Was clear acknowledges the work; adding sources is an -ing subject naming a concrete improvement. Would make states its effect.",
        "was clear ชมงาน adding sources เป็นประธานรูป -ing ระบุการปรับปรุง และ would make บอกผล",
      ),
      c(
        "Let's agree on two specific improvements for the next draft.",
        true,
        "Let's agree (let us + forma podstawowa) proponuje wspólne ustalenie dwóch zmian.",
        "Let's agree (let us + base verb) proposes agreeing on two specific changes together.",
        "Let's agree ย่อจาก let us + รูปพื้นฐาน เสนอให้ตกลงสองสิ่งที่จะปรับปรุงร่วมกัน",
      ),
      c(
        "This is bad. Fix it.",
        false,
        "Gramatyka i tryb rozkazujący są poprawne, ale brakuje konkretów. Lepiej: „Add sources to support the conclusion.”",
        "The grammar and imperative are correct but vague. Try “Add sources to support the conclusion.”",
        "ไวยากรณ์กับคำสั่งถูกต้องแต่ไม่เฉพาะเจาะจง ใช้ “Add sources to support the conclusion.”",
      ),
      c(
        "You always do everything wrong.",
        false,
        "Do pasuje do you; always opisuje rzekomy nawyk w Present Simple. Problem to uogólnienie i personalny atak. Lepiej: „This draft needs clearer sources.”",
        "Do agrees with you; always presents a supposed habit in Present Simple. The issue is a sweeping personal criticism. Try “This draft needs clearer sources.”",
        "do ใช้กับ you และ always บอกพฤติกรรมประจำใน Present Simple แต่เป็นคำตำหนิแบบเหมารวม ใช้ “This draft needs clearer sources.”",
      ),
    ],
  },
  {
    rule: l(
      "Przy niepotwierdzonych doniesieniach oddzielamy relację od faktu. Is reported to … to bierna konstrukcja relacjonująca; to be + -ing opisuje trwającą czynność. Allegedly oznacza „rzekomo” i ogranicza pewność stwierdzenia.",
      "Unconfirmed news separates reports from facts. Is reported to … is a passive reporting structure; to be + -ing describes an ongoing action. Allegedly marks a claim as unverified.",
      "ข่าวที่ยังไม่ยืนยันต้องแยกรายงานจากข้อเท็จจริง is reported to … เป็นโครงสร้างรายงานแบบถูกกระทำ to be + -ing บอกสิ่งที่กำลังเกิดขึ้น allegedly ระบุว่ายังไม่ยืนยัน",
    ),
    choices: [
      c(
        "The company is reported to be considering a merger.",
        true,
        "Is reported przypisuje informację doniesieniom, a be considering oznacza trwające rozważanie, nie zakończoną fuzję.",
        "Is reported attributes the claim to reports; be considering describes ongoing consideration, not a completed merger.",
        "is reported ระบุว่าเป็นรายงาน be considering หมายถึงกำลังพิจารณา ไม่ใช่ควบรวมแล้ว",
      ),
      c(
        "The document allegedly came from an internal source.",
        true,
        "Came to Past Simple od come. Allegedly zaznacza, że źródło dokumentu nie zostało potwierdzone.",
        "Came is the Past Simple of come. Allegedly marks the document's origin as unconfirmed.",
        "came เป็น Past Simple ของ come ส่วน allegedly ระบุว่าแหล่งเอกสารยังไม่ยืนยัน",
      ),
      c(
        "The rumour definitely proves the merger.",
        false,
        "Rumour + proves ma poprawną zgodę, ale plotka nie dowodzi fuzji. Lepiej: „The rumour suggests that a merger may be planned.”",
        "Rumour + proves agrees correctly, but a rumour does not prove a merger. Try “The rumour suggests that a merger may be planned.”",
        "rumour + proves สอดคล้องกัน แต่ข่าวลือไม่ใช่ข้อพิสูจน์ ใช้ “The rumour suggests that a merger may be planned.”",
      ),
      c(
        "Someone said it, so it is a fact.",
        false,
        "Said w Past Simple i is w Present Simple są poprawne. Błędny jest wniosek, że sama wypowiedź stanowi dowód. Lepiej: „Someone said it, but it has not been verified.”",
        "Past Simple said and Present Simple is are grammatical. A statement alone is not proof. Try “Someone said it, but it has not been verified.”",
        "said ใน Past Simple และ is ใน Present Simple ถูกต้อง แต่คำกล่าวไม่ใช่หลักฐาน ใช้ “Someone said it, but it has not been verified.”",
      ),
    ],
  },
  {
    rule: l(
      "Present Simple opisuje zwyczaje, lecz nie uzasadnia stereotypów. Po worth używamy formy -ing. Everyone ma znaczenie zbiorowe, ale gramatycznie łączy się z czasownikiem w liczbie pojedynczej.",
      "Present Simple describes customs but does not justify stereotypes. Worth takes an -ing form. Everyone refers to many people but takes a singular verb.",
      "Present Simple บอกธรรมเนียมแต่ไม่ทำให้การเหมารวมมีเหตุผล หลัง worth ใช้ -ing และ everyone ใช้กริยาเอกพจน์แม้หมายถึงหลายคน",
    ),
    choices: [
      c(
        "Expectations around punctuality vary across cultures.",
        true,
        "Expectations jest mnogie, więc vary bez -s. Zdanie opisuje różnice, nie przypisuje wszystkim jednej cechy.",
        "Plural expectations takes vary without -s. It describes variation rather than a universal trait.",
        "expectations พหูพจน์ใช้ vary ไม่เติม -s และบอกความแตกต่างโดยไม่เหมารวม",
      ),
      c(
        "It is worth asking rather than assuming what is considered polite.",
        true,
        "Worth asking ma poprawne -ing; asking i assuming tworzą równoległą konstrukcję. Is considered jest stroną bierną.",
        "Worth asking uses the required -ing form; asking and assuming are parallel. Is considered is passive.",
        "worth asking ใช้ -ing ถูกต้อง asking กับ assuming ขนานกัน ส่วน is considered เป็นรูปถูกกระทำ",
      ),
      c(
        "Their culture is simply wrong.",
        false,
        "Culture + is + przymiotnik jest gramatyczne. Problem to oceniające uogólnienie. Lepiej: „Their customs differ from ours.”",
        "Culture + is + adjective is grammatical, but the statement is a judgemental generalisation. Try “Their customs differ from ours.”",
        "culture + is + คุณศัพท์ถูกต้อง แต่ตัดสินวัฒนธรรมแบบเหมารวม ใช้ “Their customs differ from ours.”",
      ),
      c(
        "Everyone in that country behaves identically.",
        false,
        "Behaves prawidłowo zgadza się z everyone. Jednak identically przypisuje wszystkim identyczne zachowanie. Lepiej: „Behaviour varies among people in that country.”",
        "Behaves correctly agrees with everyone, but identically stereotypes all individuals. Try “Behaviour varies among people in that country.”",
        "behaves สอดคล้องกับ everyone แต่ identically เหมารวมว่าทุกคนเหมือนกัน ใช้ “Behaviour varies among people in that country.”",
      ),
    ],
  },
  {
    rule: l(
      "Need to + bezokolicznik wyraża potrzebę. Let's + forma podstawowa proponuje wspólne działanie. Distinguish A from B oznacza odróżnić A od B; evaluate against criteria — oceniać według kryteriów. Poprawna gramatyka nie gwarantuje trafnej analizy.",
      "Need to + infinitive expresses necessity. Let's + base verb proposes joint action. Distinguish A from B separates two things; evaluate against criteria means assess using those standards. Grammar alone does not make an analysis sound.",
      "need to + รูปพื้นฐานบอกความจำเป็น let's + รูปพื้นฐานเสนอให้ทำร่วมกัน distinguish A from B คือแยก A จาก B และ evaluate against criteria คือประเมินตามเกณฑ์ ไวยากรณ์ถูกต้องไม่ได้แปลว่าวิเคราะห์ดี",
    ),
    choices: [
      c(
        "We need to distinguish the symptom from the underlying cause.",
        true,
        "Need to distinguish ma poprawną składnię; rozdzielenie objawu i przyczyny zapobiega pochopnym wnioskom.",
        "Need to distinguish is correctly formed; separating symptoms from causes avoids premature conclusions.",
        "need to distinguish มีโครงสร้างถูกต้อง การแยกอาการจากสาเหตุช่วยไม่ให้สรุปเร็วเกินไป",
      ),
      c(
        "Let's evaluate each option against the same criteria.",
        true,
        "Po let's występuje evaluate. Each option jest pojedyncze, criteria to liczba mnoga criterion. Wspólne kryteria umożliwiają porównanie.",
        "Let's takes evaluate. Each option is singular; criteria is the plural of criterion. Shared criteria enable comparison.",
        "หลัง let's ใช้ evaluate ส่วน each option เป็นเอกพจน์ criteria เป็นพหูพจน์ของ criterion เกณฑ์เดียวกันช่วยเปรียบเทียบ",
      ),
      c(
        "The visible symptom identifies the root cause with certainty.",
        false,
        "Symptom + identifies jest poprawne, ale objaw nie wskazuje przyczyny z pewnością. Lepiej: „The symptom may help us identify the cause.”",
        "Symptom + identifies is grammatical, but a symptom does not establish a cause with certainty. Try “The symptom may help us identify the cause.”",
        "symptom + identifies ถูกต้อง แต่อาการไม่ยืนยันสาเหตุแน่นอน ใช้ “The symptom may help us identify the cause.”",
      ),
      c(
        "We can select the cheapest option without examining its risks.",
        false,
        "Can select i without + -ing są gramatyczne. Pomijanie ryzyka przeczy uporządkowanej analizie. Lepiej: „We should examine the risks before selecting an option.”",
        "Can select and without + -ing are grammatical. Ignoring risk is not systematic analysis. Try “We should examine the risks before selecting an option.”",
        "can select และ without + -ing ถูกต้อง แต่การไม่ดูความเสี่ยงไม่ใช่การวิเคราะห์เป็นระบบ ใช้ “We should examine the risks before selecting an option.”",
      ),
    ],
  },
);

choiceTeaching.push(
  {
    rule: l(
      "Prośbę łagodzimy za pomocą could lub would. Could + osoba + bezokolicznik bez to pyta o pomoc; would you mind wymaga formy -ing. Te czasowniki modalne wyrażają tu uprzejmość, a nie przeszłość.",
      "Could and would soften requests. Could + subject + base verb asks for help; would you mind requires -ing. These modals express politeness here, not past time.",
      "could และ would ทำให้คำขอสุภาพ could + ประธาน + กริยารูปพื้นฐานใช้ขอความช่วยเหลือ ส่วน would you mind ต้องตามด้วย -ing ในที่นี้ไม่ได้บอกอดีต",
    ),
    choices: [
      c(
        "Could you help me with this?",
        true,
        "Po could użyto help, nie helped; with this określa, z czym potrzebna jest pomoc.",
        "Could correctly takes help, not helped; with this identifies the task.",
        "หลัง could ใช้ help ไม่ใช่ helped ส่วน with this บอกเรื่องที่ต้องการความช่วยเหลือ",
      ),
      c(
        "Would you mind showing me?",
        true,
        "Po mind występuje showing, nie show ani to show. To uprzejma prośba o pokazanie.",
        "Mind takes showing, not show or to show. This politely asks for a demonstration.",
        "mind ตามด้วย showing ไม่ใช่ show หรือ to show เป็นคำขอให้แสดงอย่างสุภาพ",
      ),
      c(
        "Do it now.",
        false,
        "Gramatyczny rozkaz (forma podstawowa do) jest zbyt bezpośredni. Uprzejmie: „Could you do it now, please?”",
        "The base-form imperative do is grammatical but too direct. Politely: “Could you do it now, please?”",
        "คำสั่ง do รูปพื้นฐานถูกต้องแต่ตรงเกินไป ใช้ “Could you do it now, please?”",
      ),
      c(
        "You must help.",
        false,
        "Must + help jest gramatyczne, ale nakłada obowiązek. Uprzejmie: „Could you help me, please?”",
        "Must + help is grammatical but imposes an obligation. Politely: “Could you help me, please?”",
        "must + help ถูกต้องแต่บังคับให้ช่วย ใช้ “Could you help me, please?”",
      ),
    ],
  },
  {
    rule: l(
      "Komunikat o statusie powinien podawać postęp i ryzyka. Present Simple opisuje aktualny stan; there is wprowadza pojedynczy element. Present Perfect (have/has + III forma) może opisywać przeszłe działanie z aktualnym skutkiem.",
      "A status update should identify progress and risks. Present Simple describes current states; there is introduces a singular item. Present Perfect (have/has + participle) can describe past action with a current result.",
      "รายงานสถานะควรบอกความคืบหน้าและความเสี่ยง Present Simple บอกสภาพปัจจุบัน there is นำสิ่งเอกพจน์ Present Perfect (have/has + ช่อง 3) บอกเหตุการณ์อดีตที่มีผลปัจจุบัน",
    ),
    choices: [
      c(
        "We’re on track for Friday.",
        true,
        "We're = we are. On track oznacza postęp zgodny z planem, a for Friday wskazuje termin.",
        "We're means we are. On track reports planned progress; for Friday gives the deadline.",
        "We're คือ we are ส่วน on track บอกว่าตามแผน และ for Friday บอกกำหนด",
      ),
      c(
        "There is one risk to flag.",
        true,
        "There is pasuje do one risk. To flag oznacza „zasygnalizować”, więc zdanie zapowiada ryzyko do omówienia.",
        "There is agrees with one risk. To flag means to draw attention to an issue.",
        "there is ใช้กับ one risk และ to flag หมายถึงแจ้งประเด็นให้ทราบ",
      ),
      c(
        "The project has been cancelled without discussion.",
        false,
        "Has been cancelled to poprawny Present Perfect w stronie biernej. Zdanie opisuje anulowanie bez uzgodnień, nie konstruktywny raport postępu. Lepiej w tej sytuacji: „We need to discuss a risk to the project.”",
        "Has been cancelled is valid Present Perfect passive. It announces an unconsulted cancellation, not a constructive progress update. In this task: “We need to discuss a risk to the project.”",
        "has been cancelled เป็น Present Perfect แบบถูกกระทำที่ถูกต้อง แต่บอกการยกเลิกโดยไม่หารือ ในสถานการณ์นี้ใช้ “We need to discuss a risk to the project.”",
      ),
      c(
        "We have no information about the current status.",
        false,
        "Have jest tu zwykłym Present Simple, nie czasem perfect. Zdanie jest gramatyczne, lecz nie przekazuje statusu. Lepiej: „We are checking the status and will update you shortly.”",
        "Have is ordinary Present Simple here, not a perfect auxiliary. The sentence is grammatical but provides no status. Try “We are checking the status and will update you shortly.”",
        "have เป็น Present Simple ไม่ใช่กริยาช่วย perfect ประโยคถูกต้องแต่ไม่แจ้งสถานะ ใช้ “We are checking the status and will update you shortly.”",
      ),
    ],
  },
  {
    rule: l(
      "Pytanie w Present Simple: słowo pytające + do/does + podmiot + czasownik podstawowy. W Past Simple używamy did, po którym również występuje forma podstawowa. Pytanie o podmiot, np. which team, nie wymaga do/did.",
      "Present Simple questions use question word + do/does + subject + base verb. Past Simple uses did followed by a base verb too. Subject questions such as which team do not require do/did.",
      "คำถาม Present Simple ใช้คำถาม + do/does + ประธาน + กริยารูปพื้นฐาน Past Simple ใช้ did + รูปพื้นฐานเช่นกัน ถ้าถามประธาน เช่น which team ไม่ต้องใช้ do/did",
    ),
    choices: [
      c(
        "What error do you see?",
        true,
        "Do you see ma poprawny szyk; pytanie ustala obecny komunikat błędu.",
        "Do you see has correct question order and identifies the current error message.",
        "do you see เรียงคำถูกต้องและถามข้อความผิดพลาดปัจจุบัน",
      ),
      c(
        "When did it start?",
        true,
        "Po did jest start, nie started. Past Simple pyta o moment rozpoczęcia problemu.",
        "Did takes start, not started. Past Simple asks when the problem began.",
        "หลัง did ใช้ start ไม่ใช่ started เป็น Past Simple ถามเวลาที่เริ่มมีปัญหา",
      ),
      c(
        "Which team purchased the computer?",
        false,
        "Poprawne pytanie o podmiot w Past Simple, lecz dotyczy zakupu zamiast objawów usterki. Trafniej: „When did the problem start?”",
        "A valid Past Simple subject question, but it asks about purchasing rather than symptoms. Prefer “When did the problem start?”",
        "เป็นคำถามประธานใน Past Simple ที่ถูกต้อง แต่ถามการซื้อแทนอาการ ใช้ “When did the problem start?”",
      ),
      c(
        "Can you send a photo of your desk?",
        false,
        "Can + send jest poprawne; zdjęcie biurka nie wskazuje komunikatu błędu. Trafniej: „Can you send a screenshot of the error?”",
        "Can + send is grammatical, but a desk photo does not identify the error. Prefer “Can you send a screenshot of the error?”",
        "can + send ถูกต้อง แต่รูปโต๊ะไม่บอกข้อความผิดพลาด ใช้ “Can you send a screenshot of the error?”",
      ),
    ],
  },
  {
    rule: l(
      "Be + III forma może opisywać stan lub stronę bierną. Present Perfect (has/have + III forma) łączy wcześniejsze zdarzenie z obecnym skutkiem. Past Simple z last month wskazuje zakończony czas w przeszłości.",
      "Be + participle can express a state or passive. Present Perfect (has/have + participle) connects a prior event with its present result. Past Simple with last month refers to a finished past time.",
      "be + ช่อง 3 บอกสภาพหรือรูปถูกกระทำ Present Perfect (has/have + ช่อง 3) เชื่อมเหตุการณ์ก่อนหน้ากับผลปัจจุบัน Past Simple กับ last month บอกช่วงอดีตที่จบแล้ว",
    ),
    choices: [
      c(
        "My account is locked.",
        true,
        "Is locked opisuje obecny stan konta, który uniemożliwia dostęp.",
        "Is locked describes a current account state preventing access.",
        "is locked บอกสภาพบัญชีที่ถูกล็อกและเข้าใช้งานไม่ได้",
      ),
      c(
        "The password-reset link has expired.",
        true,
        "Has expired to Present Perfect: link wygasł i teraz nie działa.",
        "Has expired is Present Perfect: the link expired and is now unusable.",
        "has expired เป็น Present Perfect ลิงก์หมดอายุแล้วจึงใช้ไม่ได้ขณะนี้",
      ),
      c(
        "My account was created last month.",
        false,
        "Was created to poprawny Past Simple w stronie biernej. Mówi o założeniu konta, nie problemie dostępu. Trafniej: „My account is locked.”",
        "Was created is valid Past Simple passive. It reports account creation, not an access problem. Prefer “My account is locked.”",
        "was created เป็น Past Simple แบบถูกกระทำที่ถูกต้อง แต่บอกการสร้างบัญชี ใช้ “My account is locked.” เพื่อบอกปัญหา",
      ),
      c(
        "The login page opens normally.",
        false,
        "Opens zgadza się z pojedynczym page w Present Simple. Normally opisuje prawidłowe działanie. Aby zgłosić problem: „The login page does not open.”",
        "Opens agrees with singular page in Present Simple. Normally describes successful operation. To report a fault: “The login page does not open.”",
        "opens สอดคล้องกับ page เอกพจน์ normally บอกว่าทำงานปกติ ถ้าแจ้งปัญหาใช้ “The login page does not open.”",
      ),
    ],
  },
  {
    rule: l(
      "Instrukcje często mają tryb rozkazujący: czasownik w formie podstawowej bez podmiotu you. Forma nie wyraża tu czasu przeszłego. W tym zadaniu o poprawności decyduje też bezpieczeństwo działania.",
      "Instructions often use imperatives: a base verb with implied you. This form does not express past time. Here suitability also depends on whether the action is safe.",
      "คำสั่งมักใช้กริยารูปพื้นฐานโดยละประธาน you ไม่ได้บอกอดีต ข้อนี้ต้องพิจารณาความปลอดภัยของการกระทำด้วย",
    ),
    choices: [
      c(
        "Read the error message.",
        true,
        "Read jest rozkazem, aby przeczytać komunikat przed zmianami w systemie.",
        "Read instructs the learner to inspect the message before changing the system.",
        "Read สั่งให้อ่านข้อความก่อนเปลี่ยนระบบ",
      ),
      c(
        "Try the action again once.",
        true,
        "Try to forma podstawowa; again once ogranicza ponowienie do jednej próby.",
        "Try is a base-form imperative; again once limits the action to one retry.",
        "Try เป็นคำสั่งรูปพื้นฐาน again once จำกัดให้ลองใหม่ครั้งเดียว",
      ),
      c(
        "Delete every file.",
        false,
        "Gramatyczny rozkaz, lecz usuwa dane zamiast diagnozować. Bezpieczniej: „Read the error message.”",
        "A grammatical imperative, but it deletes data instead of diagnosing. Prefer “Read the error message.”",
        "คำสั่งถูกไวยากรณ์แต่ลบข้อมูลแทนการวิเคราะห์ ใช้ “Read the error message.”",
      ),
      c(
        "Ignore the user.",
        false,
        "Gramatyczny rozkaz, ale pomija źródło informacji o usterce. Lepiej: „Ask the user about the error.”",
        "A grammatical imperative, but it discards useful evidence. Prefer “Ask the user about the error.”",
        "คำสั่งถูกต้องแต่ละเลยข้อมูลจากผู้ใช้ ใช้ “Ask the user about the error.”",
      ),
    ],
  },
);

// Short action lists share the imperative/base-verb rule; their distractors are
// unsuitable actions, not malformed English.
const actions = l(
  "Nazwy działań używają czasownika w formie podstawowej i dopełnienia; jako polecenia są trybem rozkazującym z domyślnym you. Nie są to zdania w czasie przeszłym. Wszystkie opcje są gramatyczne; wybieramy działania pasujące do celu zadania.",
  "Action labels use a base verb and an object; as instructions they are imperatives with implied you. They are not past-tense sentences. All options are grammatical; choose actions that fit the task's purpose.",
  "ชื่อการกระทำใช้กริยารูปพื้นฐานกับกรรม เมื่อเป็นคำสั่งจะละ you ไม่ใช่ประโยคอดีต ทุกข้อถูกไวยากรณ์ แต่ต้องเลือกการกระทำตรงวัตถุประสงค์",
);
choiceTeaching.push(
  {
    rule: actions,
    choices: [
      c(
        "run the tests",
        true,
        "Run + the tests oznacza uruchomienie testów przed wdrożeniem, aby wykryć błędy.",
        "Run + the tests describes checking for faults before deployment.",
        "run + the tests คือรันการทดสอบเพื่อตรวจข้อผิดพลาดก่อนนำขึ้นระบบ",
      ),
      c(
        "request a code review",
        true,
        "Request + a code review oznacza poproszenie o sprawdzenie kodu; a poprzedza policzalne review.",
        "Request + a code review asks for a review; a introduces a countable review.",
        "request + a code review ขอให้ตรวจโค้ด a นำหน้า review ที่นับได้",
      ),
      c(
        "hide the error",
        false,
        "Hide znaczy „ukryć”, nie „naprawić”. Zamiast zatajać błąd: „investigate the error”.",
        "Hide means conceal, not repair. Prefer “investigate the error”.",
        "hide คือซ่อน ไม่ใช่แก้ไข ใช้ “investigate the error”",
      ),
      c(
        "delete the repository",
        false,
        "Delete + dopełnienie jest poprawne, lecz usunięcie repozytorium nie przygotowuje wdrożenia. Lepiej: „review the repository changes”.",
        "Delete + object is valid, but removing the repository does not prepare deployment. Prefer “review the repository changes”.",
        "delete + กรรมถูกต้อง แต่การลบ repository ไม่ใช่เตรียมเผยแพร่ ใช้ “review the repository changes”",
      ),
    ],
  },
  {
    rule: actions,
    choices: [
      c(
        "commit the changes",
        true,
        "Commit + the changes oznacza zapisanie zmian w historii Gita.",
        "Commit + the changes records changes in Git history.",
        "commit + the changes คือบันทึกการเปลี่ยนแปลงในประวัติ Git",
      ),
      c(
        "push the branch",
        true,
        "Push + the branch oznacza wysłanie gałęzi do zdalnego repozytorium.",
        "Push + the branch sends a branch to a remote repository.",
        "push + the branch คือส่ง branch ไปยัง repository ระยะไกล",
      ),
      c(
        "replace the release tag",
        false,
        "Replace znaczy „zastąpić”. Zmiana istniejącego tagu wydania nie jest standardowym krokiem zapisu pracy. Lepiej: „create a new release tag”.",
        "Replace means substitute. Replacing a release tag is not a routine step in recording work. Prefer “create a new release tag”.",
        "replace คือแทนที่ การแทน tag รุ่นเดิมไม่ใช่ขั้นตอนบันทึกงานปกติ ใช้ “create a new release tag”",
      ),
      c(
        "delete the remote branch",
        false,
        "Delete znaczy „usunąć”. To możliwe sprzątanie po scaleniu, ale nie podstawowy krok przesłania zmian w tym zadaniu. Właściwa czynność: „push the branch”.",
        "Delete means remove. It can be cleanup after merging, but is not the change-submission step tested here. Use “push the branch”.",
        "delete คือลบ อาจทำหลัง merge ได้ แต่ไม่ใช่ขั้นส่งงานที่โจทย์ทดสอบ ใช้ “push the branch”",
      ),
    ],
  },
  {
    rule: actions,
    choices: [
      c(
        "run the automated tests",
        true,
        "Automated opisuje tests; uruchomienie testów weryfikuje przygotowane wydanie.",
        "Automated modifies tests; running them checks the release.",
        "automated ขยาย tests การรันทดสอบช่วยตรวจรุ่นที่จะเผยแพร่",
      ),
      c(
        "check the change on staging",
        true,
        "Check + dopełnienie, on staging wskazuje środowisko testowej weryfikacji zmiany.",
        "Check takes an object; on staging identifies the validation environment.",
        "check ตามด้วยกรรม on staging ระบุสภาพแวดล้อมที่ตรวจการเปลี่ยนแปลง",
      ),
      c(
        "skip every failed test",
        false,
        "Every wymaga pojedynczego test — forma jest poprawna, lecz pomija wykryte błędy. Lepiej: „investigate every failed test”.",
        "Every takes singular test correctly, but skipping failures hides defects. Prefer “investigate every failed test”.",
        "every ใช้กับ test เอกพจน์ถูกต้อง แต่ข้ามข้อผิดพลาด ใช้ “investigate every failed test”",
      ),
      c(
        "deploy an unknown build",
        false,
        "An przed samogłoskowym unknown jest poprawne. Problemem jest wdrażanie niesprawdzonej wersji. Lepiej: „deploy a verified build”.",
        "An before the vowel sound in unknown is correct. The problem is deploying an unverified build. Prefer “deploy a verified build”.",
        "an ก่อนเสียงสระ unknown ถูกต้อง แต่ไม่ควรใช้รุ่นไม่ทราบที่มา ใช้ “deploy a verified build”",
      ),
    ],
  },
  {
    rule: actions,
    choices: [
      c(
        "state the user impact",
        true,
        "State to czasownik „określić”; user impact jest dopełnieniem i mówi o wpływie na użytkowników.",
        "State means specify; user impact is its object and describes effects on users.",
        "state คือระบุ user impact เป็นกรรมที่บอกผลต่อผู้ใช้",
      ),
      c(
        "describe the mitigation",
        true,
        "Describe + the mitigation oznacza opis działań ograniczających skutki incydentu.",
        "Describe + the mitigation explains how the incident's impact is being reduced.",
        "describe + the mitigation คืออธิบายวิธีลดผลกระทบของเหตุขัดข้อง",
      ),
      c(
        "guess without evidence",
        false,
        "Without + rzeczownik jest poprawne, lecz zgadywanie bez dowodów obniża wiarygodność. Lepiej: „report the verified facts”.",
        "Without + noun is grammatical, but guessing undermines reliability. Prefer “report the verified facts”.",
        "without + นามถูกต้อง แต่การเดาทำให้ไม่น่าเชื่อถือ ใช้ “report the verified facts”",
      ),
      c(
        "hide the timeline",
        false,
        "Hide + dopełnienie jest poprawne, ale zataja przebieg zdarzeń. Lepiej: „share the incident timeline”.",
        "Hide + object is grammatical, but conceals the sequence of events. Prefer “share the incident timeline”.",
        "hide + กรรมถูกต้อง แต่ซ่อนลำดับเหตุการณ์ ใช้ “share the incident timeline”",
      ),
    ],
  },
);

choiceTeaching.push(
  {
    rule: l(
      "Te opcje nazywają informacje do zebrania. Pytania zależne, np. whether the dashboard has …, zachowują szyk oznajmujący (podmiot + czasownik). Are affected to strona bierna w Present Simple. O trafności decyduje związek z wpływem incydentu.",
      "These options name information to collect. Embedded questions such as whether the dashboard has … keep statement word order (subject + verb). Are affected is Present Simple passive. Relevance depends on incident impact.",
      "ตัวเลือกบอกข้อมูลที่ต้องรวบรวม คำถามแฝง เช่น whether the dashboard has … ใช้ลำดับประธาน + กริยา are affected เป็น Present Simple แบบถูกกระทำ ต้องเลือกข้อมูลเกี่ยวกับผลกระทบ",
    ),
    choices: [
      c(
        "how many users are affected",
        true,
        "How many + rzeczownik mnogi pyta o liczbę. Users are affected wskazuje skalę wpływu.",
        "How many + plural noun asks for a count. Users are affected identifies the scale of impact.",
        "how many + นามพหูพจน์ถามจำนวน users are affected บอกขนาดผลกระทบ",
      ),
      c(
        "which critical functions are unavailable",
        true,
        "Functions łączy się z are; unavailable jest przymiotnikiem „niedostępne”. To wskazuje dotkliwość awarii.",
        "Functions takes are; unavailable is an adjective. This identifies the severity of the outage.",
        "functions ใช้ are ส่วน unavailable เป็นคุณศัพท์ว่ายังใช้ไม่ได้ บอกความรุนแรง",
      ),
      c(
        "whether the dashboard has a dark mode",
        false,
        "Szyk i has przy pojedynczym dashboard są poprawne. Tryb ciemny nie określa wpływu awarii. Trafniej: „whether users can complete critical tasks”.",
        "The word order and singular dashboard + has are correct. Dark mode does not establish impact. Prefer “whether users can complete critical tasks”.",
        "ลำดับคำและ dashboard + has ถูกต้อง แต่โหมดมืดไม่บอกผลกระทบ ใช้ “whether users can complete critical tasks”",
      ),
      c(
        "which team originally built the service",
        false,
        "Built to Past Simple od build; which team jest podmiotem. Autorstwo może pomóc znaleźć kontakt, lecz nie określa priorytetu. Trafniej: „which services are affected”.",
        "Built is Past Simple of build; which team is the subject. Ownership may identify a contact but does not determine priority. Prefer “which services are affected”.",
        "built เป็น Past Simple ของ build และ which team เป็นประธาน ผู้สร้างช่วยหาผู้ติดต่อแต่ไม่กำหนดความเร่งด่วน ใช้ “which services are affected”",
      ),
    ],
  },
  {
    rule: l(
      "To grupy rzeczownikowe, nie pełne zdania: nie mają czasu gramatycznego. Angielskie określenia często stoją przed rzeczownikiem (distributed traces), a of wprowadza doprecyzowanie (number of tickets). Wybieramy dane bezpośrednio opisujące opóźnienia API.",
      "These are noun phrases, not full sentences, so they have no grammatical tense. Modifiers often precede nouns (distributed traces); of adds specification (number of tickets). Choose data directly describing API latency.",
      "เป็นกลุ่มนาม ไม่ใช่ประโยคเต็ม จึงไม่มีกาล คำขยายมักอยู่หน้านาม เช่น distributed traces และ of เพิ่มรายละเอียด เช่น number of tickets เลือกข้อมูลที่วัดความช้าของ API โดยตรง",
    ),
    choices: [
      c(
        "request-duration metrics",
        true,
        "Metrics jest rzeczownikiem głównym; request-duration określa, że pomiary dotyczą czasu żądań.",
        "Metrics is the head noun; request-duration specifies what is measured.",
        "metrics เป็นนามหลัก request-duration ระบุว่าวัดระยะเวลาคำขอ",
      ),
      c(
        "distributed traces",
        true,
        "Distributed określa traces; ślady pokazują przebieg żądania przez usługi i pomagają znaleźć opóźnienie.",
        "Distributed modifies traces; traces follow a request through services to locate delays.",
        "distributed ขยาย traces ซึ่งติดตามคำขอผ่านบริการเพื่อหาจุดล่าช้า",
      ),
      c(
        "the status of the office network",
        false,
        "Poprawna grupa rzeczownikowa, ale stan sieci biurowej nie mierzy czasu przetwarzania w API. Trafniej: „API request-duration metrics”.",
        "A valid noun phrase, but office-network status does not measure processing time inside the API. Prefer “API request-duration metrics”.",
        "กลุ่มนามถูกต้อง แต่สถานะเครือข่ายสำนักงานไม่วัดเวลาภายใน API ใช้ “API request-duration metrics”",
      ),
      c(
        "the number of open support tickets",
        false,
        "Open opisuje tickets, a number of ich liczbę. Liczba zgłoszeń nie lokalizuje opóźnień. Trafniej: „distributed traces”.",
        "Open modifies tickets; number of counts them. Ticket counts do not locate latency. Prefer “distributed traces”.",
        "open ขยาย tickets และ number of บอกจำนวน แต่ไม่ชี้จุดล่าช้า ใช้ “distributed traces”",
      ),
    ],
  },
  {
    rule: l(
      "Kompromis techniczny łączy korzyść z kosztem. Present Simple opisuje właściwości rozwiązania. Stopień wyższy (simpler, easier, less flexible) służy porównaniu; but zaznacza przeciwstawienie, a at the cost of — koszt korzyści.",
      "A technical trade-off pairs a benefit with a cost. Present Simple describes design properties. Comparatives (simpler, easier, less flexible) compare alternatives; but marks contrast and at the cost of names the downside.",
      "ข้อแลกเปลี่ยนทางเทคนิคจับคู่ประโยชน์กับต้นทุน Present Simple บอกคุณสมบัติ ขั้นกว่า simpler, easier, less flexible ใช้เปรียบเทียบ but บอกความต่าง และ at the cost of บอกสิ่งที่ต้องเสีย",
    ),
    choices: [
      c(
        "This improves throughput at the cost of higher memory usage.",
        true,
        "This + improves ma zgodę w liczbie pojedynczej; at the cost of łączy większą przepustowość ze zużyciem pamięci.",
        "This + improves agrees in the singular; at the cost of links throughput gain with memory cost.",
        "this + improves สอดคล้องแบบเอกพจน์ at the cost of เชื่อมประโยชน์กับต้นทุนหน่วยความจำ",
      ),
      c(
        "The simpler design is easier to maintain but less flexible.",
        true,
        "Is zgadza się z design; easier to maintain i less flexible opisują zaletę i ograniczenie.",
        "Is agrees with design; easier to maintain and less flexible give a benefit and a limitation.",
        "is ใช้กับ design ส่วน easier to maintain และ less flexible บอกข้อดีและข้อจำกัด",
      ),
      c(
        "There are no trade-offs in distributed systems.",
        false,
        "There are pasuje do mnogiego trade-offs. Zdanie jest gramatyczne, lecz zaprzecza istnieniu kompromisów. Lepiej: „Distributed systems involve trade-offs between consistency and availability.”",
        "There are agrees with plural trade-offs. The grammar is correct but denies trade-offs. Try “Distributed systems involve trade-offs between consistency and availability.”",
        "there are ใช้กับ trade-offs พหูพจน์ถูกต้อง แต่ปฏิเสธข้อแลกเปลี่ยน ใช้ “Distributed systems involve trade-offs between consistency and availability.”",
      ),
      c(
        "The design avoids complexity without affecting performance.",
        false,
        "Avoids i without + affecting są poprawne. Zdanie opisuje korzyść bez kosztu, więc nie przedstawia kompromisu. Przykład: „The design reduces complexity but limits flexibility.”",
        "Avoids and without + affecting are grammatical. It claims a benefit without a downside, so does not describe a trade-off. Example: “The design reduces complexity but limits flexibility.”",
        "avoids และ without + affecting ถูกต้อง แต่ไม่ระบุข้อเสียจึงไม่ใช่ข้อแลกเปลี่ยน ใช้ “The design reduces complexity but limits flexibility.”",
      ),
    ],
  },
  {
    rule: l(
      "To grupy rzeczownikowe bez czasu gramatycznego. A/an określa pojedynczy policzalny element, a przymiotnik stoi przed rzeczownikiem. Przyimki around, with i without opisują zastosowanie lub cechy rozwiązania.",
      "These noun phrases have no grammatical tense. A/an introduces a singular countable item; adjectives precede nouns. Around, with and without describe placement or properties.",
      "กลุ่มนามเหล่านี้ไม่มีกาล a/an นำสิ่งนับได้เอกพจน์ คุณศัพท์อยู่หน้านาม around, with และ without บอกตำแหน่งหรือคุณสมบัติ",
    ),
    choices: [
      c(
        "a circuit breaker around the dependency",
        true,
        "A poprzedza circuit breaker; around the dependency określa chronione wywołania. Mechanizm wstrzymuje próby wobec niesprawnej zależności.",
        "A introduces circuit breaker; around the dependency identifies protected calls. It suspends calls to a failing dependency.",
        "a นำ circuit breaker ส่วน around the dependency บอกขอบเขตที่ป้องกัน โดยหยุดเรียกส่วนที่ล้มเหลว",
      ),
      c(
        "a bounded queue with backpressure",
        true,
        "Bounded określa queue („ograniczona”). With backpressure wskazuje mechanizm ograniczający napływ pracy przy przeciążeniu.",
        "Bounded modifies queue. With backpressure names a mechanism limiting incoming work under overload.",
        "bounded ขยาย queue ว่ามีขอบเขต with backpressure บอกวิธีจำกัดงานเข้าเมื่อโหลดเกิน",
      ),
      c(
        "unlimited retries without delay",
        false,
        "Poprawna grupa mnoga bez a/an, ale brak limitu i przerwy nasila przeciążenie. Lepiej: „limited retries with backoff”.",
        "A valid plural phrase without a/an, but unlimited immediate retries amplify overload. Prefer “limited retries with backoff”.",
        "กลุ่มนามพหูพจน์ไม่มี a/an ถูกต้อง แต่ลองซ้ำไม่จำกัดโดยไม่หน่วงเพิ่มโหลด ใช้ “limited retries with backoff”",
      ),
      c(
        "one shared instance with no backup",
        false,
        "One wymaga pojedynczego instance — gramatyka poprawna. Brak zapasu tworzy pojedynczy punkt awarii. Lepiej: „redundant instances with failover”.",
        "One correctly takes singular instance. With no backup creates a single point of failure. Prefer “redundant instances with failover”.",
        "one ใช้ instance เอกพจน์ถูกต้อง แต่ไม่มีสำรองเป็นจุดล้มเหลวจุดเดียว ใช้ “redundant instances with failover”",
      ),
    ],
  },
  {
    rule: l(
      "Pytanie o podmiot (which data/team) ma czasownik bez do/does. Pytanie w stronie biernej: how + are + podmiot + III forma. Should + podmiot + forma podstawowa pyta o zalecenie. Kryterium zadania to bezpieczeństwo projektu.",
      "Subject questions (which data/team) need no do/does. Passive questions use how + are + subject + participle. Should + subject + base verb asks for advice. The task focuses on design security.",
      "คำถามประธาน which data/team ไม่ใช้ do/does คำถามแบบถูกกระทำใช้ how + are + ประธาน + ช่อง 3 ส่วน should + ประธาน + รูปพื้นฐานถามคำแนะนำ โจทย์เน้นความปลอดภัย",
    ),
    choices: [
      c(
        "Which data crosses the trust boundary?",
        true,
        "Data występuje tu jako rzeczownik zbiorowy z crosses. Pytanie wskazuje dane przekraczające granicę zaufania.",
        "Data is used as a mass noun with crosses. The question identifies data crossing a trust boundary.",
        "data ใช้เป็นนามมวลรวมกับ crosses ถามข้อมูลที่ข้ามขอบเขตความเชื่อถือ",
      ),
      c(
        "How are privileged actions authorised and audited?",
        true,
        "Are + authorised/audited tworzy stronę bierną. Pytanie sprawdza uprawnienia i rejestrowanie działań.",
        "Are + authorised/audited forms the passive. The question checks permissions and action auditing.",
        "are + authorised/audited เป็นรูปถูกกระทำ ถามการอนุญาตและบันทึกกิจกรรม",
      ),
      c(
        "Which team owns the user interface?",
        false,
        "Which team jest podmiotem, owns ma poprawne -s. Właściciel interfejsu nie opisuje zabezpieczeń. Trafniej: „Who can access privileged functions?”",
        "Which team is the subject; owns correctly has -s. UI ownership does not describe controls. Prefer “Who can access privileged functions?”",
        "which team เป็นประธาน owns เติม -s ถูกต้อง แต่เจ้าของ UI ไม่บอกมาตรการ ใช้ “Who can access privileged functions?”",
      ),
      c(
        "Which design template should the report use?",
        false,
        "Should … use ma poprawną formę, ale szablon raportu nie dotyczy zabezpieczeń. Trafniej: „Which threats should the report address?”",
        "Should … use is grammatical, but report formatting is not a security control. Prefer “Which threats should the report address?”",
        "should … use ถูกต้อง แต่รูปแบบรายงานไม่ใช่มาตรการความปลอดภัย ใช้ “Which threats should the report address?”",
      ),
    ],
  },
);

const thaiRule = l(
  "W tajskim czasownik nie odmienia się przez osoby ani czasy jak w angielskim. Czas wynika z kontekstu i określeń czasu; nie dodajemy końcówek Past Simple czy Present Simple. Szyk i partykuły wskazują funkcję zdania. ครับ to męska partykuła grzecznościowa; u kobiet คะ występuje w pytaniach, a ค่ะ zwykle w oznajmieniach.",
  "Thai verbs do not inflect for person or tense like English verbs. Time comes from context and time expressions, not English-style tense endings. Word order and particles mark sentence function. ครับ is a masculine polite particle; feminine คะ is used in questions and ค่ะ typically in statements.",
  "คำกริยาภาษาไทยไม่ผันตามบุคคลหรือกาลเหมือนภาษาอังกฤษ เวลาอาศัยบริบทและคำบอกเวลา ลำดับคำและคำลงท้ายบอกหน้าที่ประโยค ครับเป็นคำสุภาพแบบผู้ชาย คะใช้ในคำถามแบบผู้หญิง ส่วนค่ะมักใช้ในประโยคบอกเล่า",
);
choiceTeaching.push(
  {
    rule: thaiRule,
    choices: [
      c(
        "ช่วยอธิบายหน่อยได้ไหมครับ/คะ",
        true,
        "ช่วย + czasownik prosi o pomoc; หน่อย łagodzi prośbę, a ได้ไหม pyta „czy można?”. Całość: „Czy możesz wyjaśnić?”.",
        "ช่วย + verb requests help; หน่อย softens it and ได้ไหม asks if it is possible: “Could you explain?”",
        "ช่วย + กริยาใช้ขอความช่วยเหลือ หน่อยทำให้นุ่มนวล ได้ไหมทำให้เป็นคำถามขออนุญาตหรือความช่วยเหลือ",
      ),
      c(
        "รบกวนช่วยดูให้หน่อยครับ/ค่ะ",
        true,
        "รบกวน wprowadza uprzejmą prośbę, ช่วยดูให้ znaczy „pomóc, patrząc dla mnie”, หน่อย łagodzi ton.",
        "รบกวน introduces a polite request; ช่วยดูให้ asks someone to look at something for you; หน่อย softens it.",
        "รบกวนขึ้นต้นคำขออย่างสุภาพ ช่วยดูให้คือขอให้ดูบางอย่างให้ และหน่อยช่วยลดความแข็งของคำขอ",
      ),
      c(
        "ทำเดี๋ยวนี้",
        false,
        "Poprawny, lecz ostry rozkaz: „Zrób teraz”. Brakuje uprzejmej formy prośby. Lepiej: „ช่วยทำให้หน่อยได้ไหมครับ/คะ”.",
        "A grammatical but abrupt command: “Do it now.” Prefer the polite request “ช่วยทำให้หน่อยได้ไหมครับ/คะ”.",
        "เป็นคำสั่งที่ถูกไวยากรณ์แต่ห้วน ควรใช้ “ช่วยทำให้หน่อยได้ไหมครับ/คะ” เพื่อขออย่างสุภาพ",
      ),
      c(
        "คุณผิด",
        false,
        "คุณ to podmiot „ty”, ผิด orzeka „mylisz się” bez odpowiednika angielskiego are. To osąd, nie prośba. Lepiej: „ช่วยอธิบายหน่อยได้ไหมครับ/คะ”.",
        "คุณ is the subject and ผิด predicates “wrong” without English are. This is a judgement, not a request. Prefer “ช่วยอธิบายหน่อยได้ไหมครับ/คะ”.",
        "คุณเป็นประธาน ผิดเป็นภาคแสดง ไม่ต้องมี are แบบอังกฤษ แต่เป็นการตัดสินไม่ใช่คำขอ ควรใช้ “ช่วยอธิบายหน่อยได้ไหมครับ/คะ”",
      ),
    ],
  },
  {
    rule: thaiRule,
    choices: [
      c(
        "งานเป็นไปตามแผนครับ",
        true,
        "งาน to „praca”; เป็นไปตามแผน oznacza „przebiega zgodnie z planem”. ครับ utrzymuje uprzejmy ton statusu.",
        "งาน is work; เป็นไปตามแผน means proceeding according to plan. ครับ adds politeness.",
        "งานเป็นประธาน เป็นไปตามแผนบอกความคืบหน้าตามที่วางไว้ ครับทำให้สุภาพ",
      ),
      c(
        "มีความเสี่ยงหนึ่งเรื่องที่ต้องแจ้งครับ",
        true,
        "มี wprowadza istnienie ryzyka; หนึ่งเรื่อง to jeden temat, a ที่ต้องแจ้ง precyzuje, że należy go zgłosić.",
        "มี introduces an existing risk; หนึ่งเรื่อง counts one issue and ที่ต้องแจ้ง specifies that it needs reporting.",
        "มีบอกว่ามีความเสี่ยง หนึ่งเรื่องระบุจำนวน และที่ต้องแจ้งขยายว่าต้องรายงานเรื่องนั้น",
      ),
      c(
        "งานอาจดีอะไรสักอย่าง",
        false,
        "อาจดี znaczy „może być dobra”, ale อะไรสักอย่าง („coś”) nie łączy się tu naturalnie z resztą. Jasny status: „งานเป็นไปตามแผนครับ”.",
        "อาจดี means may be good, but อะไรสักอย่าง (something) does not fit naturally here. A clear update: “งานเป็นไปตามแผนครับ”.",
        "อาจดีใช้บอกความเป็นไปได้ แต่อะไรสักอย่างต่อท้ายตรงนี้ไม่เป็นธรรมชาติ ควรบอกให้ชัดว่า “งานเป็นไปตามแผนครับ”",
      ),
      c(
        "ไม่มีอัปเดต ลาก่อน",
        false,
        "ไม่มี oznacza „nie ma”, ลาก่อน — pożegnanie. Zdanie jest zrozumiałe, ale urywa rozmowę bez statusu. Lepiej: „กำลังตรวจสอบสถานะครับ”.",
        "ไม่มี means there is no; ลาก่อน says goodbye. It is understandable but ends the conversation without a status. Prefer “กำลังตรวจสอบสถานะครับ”.",
        "ไม่มีบอกการไม่มี ลาก่อนเป็นคำลา เข้าใจได้แต่จบการสนทนาโดยไม่รายงานสถานะ ควรใช้ “กำลังตรวจสอบสถานะครับ”",
      ),
    ],
  },
  {
    rule: thaiRule,
    choices: [
      c(
        "เห็นข้อความผิดพลาดอะไรครับ",
        true,
        "อะไร („co?”) pozostaje w miejscu pytanego elementu; nie dodajemy angielskiego do. Pytanie dotyczy komunikatu błędu.",
        "อะไร (what) stays in the position of the requested information; there is no English do. It asks about the error message.",
        "อะไรอยู่ตรงส่วนข้อมูลที่ถาม ไม่ต้องใช้ do แบบอังกฤษ เป็นคำถามถึงข้อความผิดพลาด",
      ),
      c(
        "ปัญหาเริ่มเมื่อไรครับ",
        true,
        "เมื่อไร znaczy „kiedy”. เริ่ม nie odmienia się na czas przeszły; pytanie i kontekst wskazują moment początku problemu.",
        "เมื่อไร means when. เริ่ม has no past-tense inflection; the question and context identify the problem's start time.",
        "เมื่อไรถามเวลา เริ่มไม่ต้องผันเป็นอดีต บริบทบอกว่าถามเวลาที่ปัญหาเริ่ม",
      ),
      c(
        "ซื้อใหม่เลย",
        false,
        "To polecenie „kup od razu nowe”. Może być gramatyczne, lecz pomija diagnozę. Trafniej: „ปัญหาเริ่มเมื่อไรครับ”.",
        "This commands “buy a new one now”. It can be grammatical but skips diagnosis. Prefer “ปัญหาเริ่มเมื่อไรครับ”.",
        "เป็นคำสั่งให้ซื้อใหม่ทันที ไวยากรณ์ใช้ได้แต่ข้ามการวิเคราะห์ ควรถาม “ปัญหาเริ่มเมื่อไรครับ”",
      ),
      c(
        "คอมพิวเตอร์โกรธ",
        false,
        "Szyk podmiot + orzeczenie jest możliwy, ale „komputer jest zły/rozgniewany” to personifikacja, nie opis usterki. Trafniej: „คอมพิวเตอร์ไม่ทำงานครับ”.",
        "Subject + predicate is possible, but “the computer is angry” is personification, not diagnosis. Prefer “คอมพิวเตอร์ไม่ทำงานครับ”.",
        "ลำดับประธานกับภาคแสดงใช้ได้ แต่ให้คอมพิวเตอร์โกรธเป็นการทำให้เหมือนคน ไม่ใช่อาการเสีย ควรใช้ “คอมพิวเตอร์ไม่ทำงานครับ”",
      ),
    ],
  },
  {
    rule: thaiRule,
    choices: [
      c(
        "รันการทดสอบ",
        true,
        "รัน („uruchomić”) + การทดสอบ („testowanie”) to czasownik z dopełnieniem. Testy sprawdzają kod przed wdrożeniem.",
        "รัน (run) + การทดสอบ (testing) is verb + object. Tests check code before deployment.",
        "รันเป็นกริยา การทดสอบเป็นกรรม เพื่อทดสอบโค้ดก่อนนำขึ้นระบบ",
      ),
      c(
        "ขอให้เพื่อนตรวจโค้ด",
        true,
        "ขอให้ + osoba + czynność to „poprosić kogoś, żeby…”. Chodzi o sprawdzenie kodu przez kolegę.",
        "ขอให้ + person + action means ask someone to do something: ask a colleague to review code.",
        "ขอให้ + บุคคล + การกระทำ เป็นโครงสร้างขอให้เพื่อนช่วยตรวจโค้ด",
      ),
      c(
        "ซ่อนข้อผิดพลาด",
        false,
        "ซ่อน + dopełnienie to „ukryć błędy”. Składnia poprawna, cel niewłaściwy. Lepiej: „แก้ไขข้อผิดพลาด” (naprawić błędy).",
        "ซ่อน + object means hide errors. The syntax is valid but the action is unsuitable. Prefer “แก้ไขข้อผิดพลาด” (fix errors).",
        "ซ่อนตามด้วยกรรมถูกต้อง แต่ซ่อนข้อผิดพลาดไม่เหมาะ ควรใช้ “แก้ไขข้อผิดพลาด”",
      ),
      c(
        "ลบ repository",
        false,
        "ลบ to czasownik „usunąć”; angielska nazwa jest dopełnieniem. Usunięcie repozytorium nie sprawdza kodu. Lepiej: „ตรวจโค้ด”.",
        "ลบ means delete; the English noun is its object. Deleting the repository does not check code. Prefer “ตรวจโค้ด”.",
        "ลบเป็นกริยา repository เป็นกรรมภาษาอังกฤษ แต่การลบไม่ได้ตรวจโค้ด ควรใช้ “ตรวจโค้ด”",
      ),
    ],
  },
  {
    rule: thaiRule,
    choices: [
      c(
        "แจ้งผลกระทบต่อผู้ใช้",
        true,
        "แจ้ง + dopełnienie oznacza zgłoszenie wpływu; ต่อผู้ใช้ doprecyzowuje, że chodzi o użytkowników.",
        "แจ้ง + object reports impact; ต่อผู้ใช้ specifies the affected users.",
        "แจ้งเป็นกริยา ผลกระทบเป็นกรรม ต่อผู้ใช้ระบุว่าใครได้รับผลกระทบ",
      ),
      c(
        "อธิบายวิธีลดผลกระทบ",
        true,
        "อธิบาย znaczy „wyjaśnić”, วิธีลดผลกระทบ — sposób ograniczenia skutków. To konkretna informacja o reakcji.",
        "อธิบาย means explain; วิธีลดผลกระทบ is the way to reduce impact. This gives a concrete response.",
        "อธิบายเป็นกริยา วิธีลดผลกระทบเป็นสิ่งที่อธิบาย ให้ข้อมูลวิธีรับมืออย่างชัดเจน",
      ),
      c(
        "เดาโดยไม่มีหลักฐาน",
        false,
        "โดยไม่มี + rzeczownik oznacza „bez…”. Gramatyka poprawna, ale zgadywanie bez dowodów nie jest rzetelnym raportem. Lepiej: „แจ้งข้อเท็จจริง”.",
        "โดยไม่มี + noun means without. The grammar is valid, but guessing without evidence is unreliable. Prefer “แจ้งข้อเท็จจริง”.",
        "โดยไม่มีตามด้วยนามถูกต้อง แต่เดาโดยไม่มีหลักฐานไม่น่าเชื่อถือ ควรใช้ “แจ้งข้อเท็จจริง”",
      ),
      c(
        "ซ่อนไทม์ไลน์",
        false,
        "ซ่อน + dopełnienie oznacza ukrycie osi czasu. To poprawna konstrukcja, ale zataja przebieg incydentu. Lepiej: „แจ้งลำดับเหตุการณ์”.",
        "ซ่อน + object means hide the timeline. It is well formed but conceals events. Prefer “แจ้งลำดับเหตุการณ์”.",
        "ซ่อนตามด้วยกรรมถูกต้อง แต่ปิดบังลำดับเหตุการณ์ ควรใช้ “แจ้งลำดับเหตุการณ์”",
      ),
    ],
  },
);

// Original A1 lessons are expanded into a combined choice task. Explain both
// source contexts explicitly, including meaning-based (not grammar) errors.
const basics = l(
  "W angielskim pełne zdanie zwykle wymaga podmiotu i czasownika. Przy be pytanie odwraca szyk; inne pytania w Present Simple używają do/does + forma podstawowa. Skróty i pominięcia są poprawne tylko wtedy, gdy kontekst jasno uzupełnia ich sens.",
  "An English sentence normally needs a subject and a verb. Questions with be invert their order; other Present Simple questions use do/does + base verb. Contractions and ellipsis are acceptable when context supplies the missing meaning.",
  "ประโยคอังกฤษปกติต้องมีประธานและกริยา คำถาม be สลับลำดับ ส่วนคำถาม Present Simple อื่นใช้ do/does + รูปพื้นฐาน คำย่อและการละคำใช้ได้เมื่อบริบทให้ความหมายชัดเจน",
);
choiceTeaching.push(
  {
    rule: basics,
    choices: [
      c(
        "I'll have a coffee, please.",
        true,
        "I'll = I will, po którym jest have. To naturalne zamówienie; a coffee oznacza jedną porcję kawy.",
        "I'll is I will, followed by have. A coffee means one serving; this is a natural order.",
        "I'll คือ I will ตามด้วย have ส่วน a coffee คือกาแฟหนึ่งที่ เป็นคำสั่งซื้อธรรมชาติ",
      ),
      c(
        "What would you like to drink?",
        true,
        "Pytanie ma szyk would + you + like; po would like używamy to drink. Would wyraża uprzejmość.",
        "The question uses would + you + like; would like takes to drink. Would adds politeness.",
        "คำถามใช้ would + you + like ตามด้วย to drink และ would เพิ่มความสุภาพ",
      ),
      c(
        "Give coffee me.",
        false,
        "Zły szyk dopełnień i brak określenia porcji. Poprawnie: „Give me a coffee”, a uprzejmiej: „Could I have a coffee, please?”",
        "The objects are in the wrong order and a serving needs a determiner. Use “Give me a coffee”, or politely “Could I have a coffee, please?”",
        "กรรมเรียงผิดและขาดคำกำหนดปริมาณ ใช้ “Give me a coffee” หรือสุภาพว่า “Could I have a coffee, please?”",
      ),
      c(
        "What you want drink?",
        false,
        "Brakuje do przed you i to przed drink. Poprawnie: „What do you want to drink?”; uprzejmiej: „What would you like to drink?”",
        "It needs do before you and to before drink: “What do you want to drink?” More politely: “What would you like to drink?”",
        "ขาด do ก่อน you และ to ก่อน drink ใช้ “What do you want to drink?” สุภาพกว่าเป็น “What would you like to drink?”",
      ),
    ],
  },
  {
    rule: basics,
    choices: [
      c(
        "Could we have the bill, please?",
        true,
        "Could + we + have to uprzejma prośba, nie przeszłość. The bill oznacza konkretny rachunek za posiłek.",
        "Could + we + have is a polite request, not past time. The bill is the specific meal bill.",
        "could + we + have เป็นคำขอสุภาพ ไม่ใช่อดีต the bill คือบิลมื้อนี้",
      ),
      c(
        "They will bring it soon.",
        true,
        "Will + bring zapowiada przyszłe działanie. To pasuje do „Certainly, one moment”: zgoda i krótka prośba o cierpliwość.",
        "Will + bring predicts a future action. It matches “Certainly, one moment”: agreement and a short wait.",
        "will + bring บอกอนาคต ตรงกับ “Certainly, one moment” ที่ตอบรับและขอให้รอ",
      ),
      c(
        "Give bill now.",
        false,
        "Bill jest policzalny i wymaga tu the; naturalnie give me/us the bill. Uprzejma poprawka: „Could we have the bill, please?”",
        "Countable bill needs the here; naturally give me/us the bill. Politely: “Could we have the bill, please?”",
        "bill นับได้ต้องมี the และมักใช้ give me/us the bill สุภาพว่า “Could we have the bill, please?”",
      ),
      c(
        "They refuse to bring it.",
        false,
        "Refuse to + czasownik jest gramatyczne, ale znaczy „odmawiają”, a certainly potwierdza zgodę. W tym kontekście: „They will bring it soon.”",
        "Refuse to + verb is grammatical but means refusal, while certainly agrees. Here use “They will bring it soon.”",
        "refuse to + กริยาถูกต้องแต่แปลว่าปฏิเสธ ขัดกับ certainly ใช้ “They will bring it soon.”",
      ),
    ],
  },
  {
    rule: basics,
    choices: [
      c(
        "I'm allergic to nuts.",
        true,
        "I'm = I am. Przymiotnik allergic wymaga be i przyimka to przed alergenem.",
        "I'm means I am. Allergic takes be and the preposition to before the allergen.",
        "I'm คือ I am คุณศัพท์ allergic ใช้กับ be และ to ก่อนสิ่งที่แพ้",
      ),
      c(
        "Does this dish contain meat?",
        true,
        "Does jest przed podmiotem this dish; contain pozostaje w formie podstawowej. To pytanie w Present Simple o skład.",
        "Does precedes subject this dish; contain stays in base form. Present Simple asks about ingredients.",
        "does อยู่ก่อนประธาน this dish และ contain เป็นรูปพื้นฐาน ถามส่วนประกอบใน Present Simple",
      ),
      c(
        "I nuts allergic.",
        false,
        "Brakuje am i to, a nuts stoi w złym miejscu. Poprawnie: „I am allergic to nuts.”",
        "Am and to are missing, and nuts is misplaced. Use “I am allergic to nuts.”",
        "ขาด am กับ to และวาง nuts ผิด ใช้ “I am allergic to nuts.”",
      ),
      c(
        "This meat dish contain?",
        false,
        "Brakuje does, a meat powinno być dopełnieniem contain. Poprawnie: „Does this dish contain meat?”",
        "Does is missing and meat should be the object of contain. Use “Does this dish contain meat?”",
        "ขาด does และ meat ควรเป็นกรรมของ contain ใช้ “Does this dish contain meat?”",
      ),
    ],
  },
  {
    rule: basics,
    choices: [
      c(
        "Hi, I'm Anna. Nice to meet you.",
        true,
        "I'm Anna podaje imię przez I am. Nice to meet you to naturalny skrót It's nice to meet you.",
        "I'm Anna uses I am to give a name. Nice to meet you is natural ellipsis for It's nice to meet you.",
        "I'm Anna ใช้ I am บอกชื่อ Nice to meet you ละมาจาก It's nice to meet you ได้",
      ),
      c(
        "What's your name?",
        true,
        "What's = what is; is stoi przed your name. Your, nie you, wyraża przynależność.",
        "What's is what is; is precedes your name. Your, not you, marks possession.",
        "What's คือ what is และ is อยู่ก่อน your name ใช้ your แสดงความเป็นเจ้าของ ไม่ใช่ you",
      ),
      c(
        "Hi, me Anna, meet nice.",
        false,
        "Me nie zastępuje podmiotu I am w standardowym przedstawieniu; meet nice ma zły szyk. Poprawnie: „Hi, I'm Anna. Nice to meet you.”",
        "Me cannot replace I am in a standard introduction; meet nice has wrong word order. Use “Hi, I'm Anna. Nice to meet you.”",
        "me แทน I am ในการแนะนำตัวมาตรฐานไม่ได้ และ meet nice เรียงผิด ใช้ “Hi, I'm Anna. Nice to meet you.”",
      ),
      c(
        "You name what?",
        false,
        "Potrzebne są your i czasownik is w szyku pytania: „What is your name?”",
        "Use possessive your and the verb is in question order: “What is your name?”",
        "ต้องใช้ your แสดงเจ้าของและ is ในลำดับคำถาม “What is your name?”",
      ),
    ],
  },
  {
    rule: basics,
    choices: [
      c(
        "Nice weather today, isn't it?",
        true,
        "Pierwsza część skraca It's nice weather today. Po twierdzeniu z is naturalne jest pytanie dopowiadające isn't it?",
        "The first part abbreviates It's nice weather today. A positive is clause takes the negative tag isn't it?",
        "ส่วนแรกละจาก It's nice weather today ประโยคบอกเล่าที่มี is ใช้คำถามท้ายปฏิเสธ isn't it?",
      ),
      c(
        "Pretty good, thanks. You?",
        true,
        "Pretty znaczy „całkiem”; odpowiedź na How's it going? pomija znane z kontekstu It's going. You? skraca pytanie zwrotne.",
        "Pretty means quite; the reply to How's it going? omits understood It's going. You? returns the question.",
        "pretty คือค่อนข้าง คำตอบ How's it going? ละ It's going ที่เข้าใจจากบริบท และ You? ถามกลับ",
      ),
      c(
        "Weather nice today is?",
        false,
        "Is nie powinno kończyć takiego pytania. Poprawnie: „Is the weather nice today?” lub „Nice weather today, isn't it?”",
        "Is does not belong at the end here. Use “Is the weather nice today?” or “Nice weather today, isn't it?”",
        "is ไม่อยู่ท้ายคำถามแบบนี้ ใช้ “Is the weather nice today?” หรือ “Nice weather today, isn't it?”",
      ),
      c(
        "Going pretty good you.",
        false,
        "You nie ma tu funkcji składniowej, a going nie tworzy pełnego orzeczenia bez be. Naturalna odpowiedź: „Pretty good, thanks. You?”",
        "You has no syntactic role here; going needs be for a full predicate. A natural reply is “Pretty good, thanks. You?”",
        "you ไม่มีหน้าที่ในโครงสร้างนี้ going ต้องมี be เพื่อเป็นภาคแสดงเต็ม ใช้ “Pretty good, thanks. You?”",
      ),
    ],
  },
  {
    rule: basics,
    choices: [
      c(
        "Excuse me, how do I get to the station?",
        true,
        "How + do + I + get ma szyk pytania w Present Simple. To wskazuje cel ruchu; excuse me łagodzi zagadnięcie.",
        "How + do + I + get is a Present Simple question. To marks the destination; excuse me politely opens the exchange.",
        "how + do + I + get เป็นคำถาม Present Simple ส่วน to บอกจุดหมาย และ excuse me เริ่มอย่างสุภาพ",
      ),
      c(
        "It's very close.",
        true,
        "It's = it is, close jest przymiotnikiem „blisko”. Oddaje sens just around the corner.",
        "It's means it is; close is an adjective meaning nearby. It matches just around the corner.",
        "It's คือ it is และ close แปลว่าใกล้ ตรงกับ just around the corner",
      ),
      c(
        "Station where go?",
        false,
        "Brakuje podmiotu, do i przyimka to. Poprawnie: „How do I get to the station?”",
        "The subject, do and to are missing. Use “How do I get to the station?”",
        "ขาดประธาน do และ to ใช้ “How do I get to the station?”",
      ),
      c(
        "It's far away.",
        false,
        "Poprawna gramatyka, ale far away znaczy „daleko”, odwrotnie niż just around the corner. W tym kontekście: „It's very close.”",
        "Grammatically correct, but far away is the opposite of just around the corner. Here: “It's very close.”",
        "ไวยากรณ์ถูกแต่ far away คือไกล ตรงข้ามกับ just around the corner ในที่นี้ใช้ “It's very close.”",
      ),
    ],
  },
  {
    rule: basics,
    choices: [
      c(
        "It's half past three.",
        true,
        "It's wprowadza godzinę; half past three to pół godziny po trzeciej, czyli 3:30.",
        "It's introduces the time; half past three is thirty minutes after three, or 3:30.",
        "It's นำเวลา half past three คือสามโมงครึ่ง 3:30",
      ),
      c(
        "What time is it?",
        true,
        "What time jest na początku, a is stoi przed podmiotem it. Nie dodajemy do przy be.",
        "What time comes first; is precedes subject it. Be does not need do.",
        "what time อยู่ต้น is อยู่ก่อนประธาน it และ be ไม่ต้องใช้ do",
      ),
      c(
        "It's three half.",
        false,
        "Three half nie jest naturalnym określeniem 3:30. Poprawnie: „It's half past three” lub „It's three thirty.”",
        "Three half is not the English expression for 3:30. Use “It's half past three” or “It's three thirty.”",
        "three half ไม่ใช่การบอก 3:30 ใช้ “It's half past three” หรือ “It's three thirty.”",
      ),
      c(
        "Time what is?",
        false,
        "Zły szyk i brak podmiotu it. Poprawnie: „What time is it?”",
        "The word order is wrong and subject it is missing. Use “What time is it?”",
        "ลำดับผิดและขาดประธาน it ใช้ “What time is it?”",
      ),
    ],
  },
  {
    rule: l(
      "Rutyny opisujemy w Present Simple. Przy I używamy podstawowej formy czasownika; usually i every day podkreślają regularność. At wprowadza godzinę. Samo -ing nie jest pełnym orzeczeniem.",
      "Routines use Present Simple. I takes the base verb; usually and every day mark regularity. At introduces clock time. An -ing form alone is not a finite predicate.",
      "กิจวัตรใช้ Present Simple ประธาน I ใช้รูปพื้นฐาน usually และ every day บอกความสม่ำเสมอ at นำเวลา และ -ing เดี่ยวไม่ใช่กริยาแท้",
    ),
    choices: [
      c(
        "I wake up at seven every day.",
        true,
        "Wake up pozostaje razem; at seven określa godzinę, every day częstotliwość.",
        "Wake up stays together; at seven gives the time and every day the frequency.",
        "wake up อยู่ด้วยกัน at seven บอกเวลา และ every day บอกความถี่",
      ),
      c(
        "have",
        true,
        "W „I usually ___ breakfast at eight” pasuje have: Present Simple i zwrot have breakfast.",
        "In “I usually ___ breakfast at eight”, have supplies Present Simple and the phrase have breakfast.",
        "ใน “I usually ___ breakfast at eight” ใช้ have เป็น Present Simple และสำนวน have breakfast",
      ),
      c(
        "I wake seven every up day.",
        false,
        "Rozbito wake up i every day oraz pominięto at. Poprawnie: „I wake up at seven every day.”",
        "Wake up and every day are split, and at is missing. Use “I wake up at seven every day.”",
        "แยก wake up กับ every day ผิดและขาด at ใช้ “I wake up at seven every day.”",
      ),
      c(
        "having",
        false,
        "„I usually having breakfast” nie ma czasownika osobowego. Dla rutyny: „I usually have breakfast at eight.” Am having opisuje czynność trwającą, z inną budową i znaczeniem.",
        "“I usually having breakfast” lacks a finite verb. For a routine: “I usually have breakfast at eight.” Am having has a different structure and ongoing meaning.",
        "“I usually having breakfast” ขาดกริยาแท้ กิจวัตรใช้ “I usually have breakfast at eight.” ส่วน am having มีโครงสร้างและความหมายต่อเนื่องต่างกัน",
      ),
    ],
  },
  {
    rule: basics,
    choices: [
      c(
        "How much is this?",
        true,
        "How much pyta o cenę; is stoi przed this. This oznacza wskazany przedmiot.",
        "How much asks the price; is precedes this, the item being indicated.",
        "how much ถามราคา is อยู่ก่อน this ซึ่งหมายถึงสิ่งที่ชี้",
      ),
      c(
        "Card, please.",
        true,
        "To poprawna krótka odpowiedź na Cash or card? Kontekst pozwala pominąć pełne I'd like to pay by card.",
        "A valid short reply to Cash or card? Context supplies I'd like to pay by card.",
        "เป็นคำตอบสั้นที่ถูกต้องต่อ Cash or card? บริบทให้ความหมาย I'd like to pay by card",
      ),
      c(
        "This how much?",
        false,
        "W standardowym pełnym pytaniu brakuje is i właściwego szyku. Poprawnie: „How much is this?”",
        "A standard full question needs is and question order. Use “How much is this?”",
        "คำถามเต็มมาตรฐานขาด is และลำดับคำถาม ใช้ “How much is this?”",
      ),
      c(
        "Please card.",
        false,
        "Jako odpowiedź wybierająca płatność naturalniejsze jest „Card, please.” Please może stać na początku pełnej prośby, np. „Please charge my card”, ale to inna konstrukcja.",
        "For choosing a payment method, “Card, please” is natural. Please can start a full request such as “Please charge my card”, a different structure.",
        "เมื่อเลือกวิธีจ่ายใช้ “Card, please.” เป็นธรรมชาติ Please อยู่หน้าคำขอเต็มได้ เช่น “Please charge my card” แต่โครงสร้างต่างกัน",
      ),
    ],
  },
  {
    rule: basics,
    choices: [
      c(
        "Shall we meet on Friday?",
        true,
        "Shall + we + meet proponuje wspólne działanie; on wprowadza dzień tygodnia. Nie jest to czas przeszły.",
        "Shall + we + meet proposes joint action; on introduces a weekday. It is not past tense.",
        "shall + we + meet เสนอทำร่วมกัน on นำวันในสัปดาห์ ไม่ใช่อดีต",
      ),
      c(
        "Sounds good to me!",
        true,
        "To potoczny skrót That sounds good to me. Sounds ma -s przy domyślnym that, a good jest przymiotnikiem po czasowniku łączącym.",
        "This omits understood That from That sounds good to me. Sounds agrees with that; good is an adjective after a linking verb.",
        "ละ That จาก That sounds good to me ได้ sounds เติม -s ตาม that และ good เป็นคุณศัพท์หลังกริยาเชื่อม",
      ),
      c(
        "We meet Friday shall?",
        false,
        "Shall musi poprzedzać we w pytaniu; przed Friday potrzeba on. Poprawnie: „Shall we meet on Friday?”",
        "Shall must precede we in the question; Friday takes on. Use “Shall we meet on Friday?”",
        "shall ต้องอยู่ก่อน we และ Friday ใช้ on ใช้ “Shall we meet on Friday?”",
      ),
      c(
        "Good to me sounds!",
        false,
        "Zły szyk: sounds powinno poprzedzać good. Naturalnie: „Sounds good to me!”",
        "The order is wrong: sounds precedes good. Use “Sounds good to me!”",
        "ลำดับผิด sounds ควรอยู่ก่อน good ใช้ “Sounds good to me!”",
      ),
    ],
  },
  {
    rule: l(
      "Present Continuous: am/is/are + -ing opisuje czynność trwającą teraz. Przy opisie pogody używamy bezosobowego it. Przymiotnik po be opisuje stan; nie dodajemy do niego automatycznie -ing.",
      "Present Continuous (am/is/are + -ing) describes an action happening now. Weather uses impersonal it. An adjective after be describes a state; it does not automatically take -ing.",
      "Present Continuous ใช้ am/is/are + -ing บอกสิ่งที่กำลังเกิด ใช้ it กล่าวถึงอากาศ คุณศัพท์หลัง be บอกสภาพ ไม่เติม -ing โดยอัตโนมัติ",
    ),
    choices: [
      c(
        "It's raining outside.",
        true,
        "It's = it is; is raining to Present Continuous, bo deszcz pada teraz.",
        "It's is it is; is raining is Present Continuous for rain falling now.",
        "It's คือ it is และ is raining เป็น Present Continuous ว่าฝนกำลังตก",
      ),
      c(
        "cold",
        true,
        "W „It's very ___ today” potrzebny jest przymiotnik cold. Very wzmacnia jego znaczenie.",
        "“It's very ___ today” needs the adjective cold. Very intensifies it.",
        "“It's very ___ today” ต้องใช้คุณศัพท์ cold โดย very ขยายระดับ",
      ),
      c(
        "It rain outside is.",
        false,
        "Is powinno stać po it, a rain mieć -ing. Poprawnie: „It is raining outside.”",
        "Is must follow it and rain must take -ing. Use “It is raining outside.”",
        "is ต้องอยู่หลัง it และ rain ต้องเติม -ing ใช้ “It is raining outside.”",
      ),
      c(
        "colding",
        false,
        "Cold jest tu przymiotnikiem, nie czasownikiem. Colding nie jest jego poprawną formą w tym zdaniu. Poprawnie: „It's very cold today.”",
        "Cold is an adjective here, not a verb. Colding is not its valid form in this sentence. Use “It's very cold today.”",
        "cold เป็นคุณศัพท์ ไม่ใช่กริยา colding ใช้ในประโยคนี้ไม่ได้ ใช้ “It's very cold today.”",
      ),
    ],
  },
);

const scriptRule = l(
  "To rozpoznawanie znaków, nie zdania: nie ma tu czasu gramatycznego ani odmiany czasownika. Odpowiedź porównujemy z nazwą lub dźwiękiem wskazanym w odpowiednim pytaniu. Inny znak może być poprawny w innym pytaniu.",
  "These are symbol-recognition tasks, not sentences: tense and verb inflection do not apply. Match each answer to the name or sound in its source question. Another symbol may be right in a different question.",
  "เป็นการจำแนกตัวอักษร ไม่ใช่ประโยค จึงไม่มีกาลหรือการผันกริยา ต้องจับคู่คำตอบกับชื่อหรือเสียงในคำถามนั้น ตัวอื่นอาจถูกในคำถามอื่นได้",
);
choiceTeaching.push(
  {
    rule: basics,
    choices: [
      c(
        "Could I have the menu, please?",
        true,
        "Could + I + have ma poprawny szyk uprzejmej prośby. The menu oznacza konkretne menu restauracji, please dodaje uprzejmość.",
        "Could + I + have forms a polite request. The menu refers to the restaurant's menu; please adds politeness.",
        "could + I + have เป็นคำขอสุภาพ the menu คือเมนูของร้าน และ please เพิ่มความสุภาพ",
      ),
      c(
        "Could I have the menu, please?",
        true,
        "W obu pytaniach chodzi o tę samą prośbę: could wyraża uprzejmość, a nie przeszłość.",
        "Both source questions ask for the same request: could expresses politeness, not past time.",
        "ทั้งสองคำถามถามคำขอเดียวกัน could บอกความสุภาพ ไม่ใช่อดีต",
      ),
      c(
        "I want menu.",
        false,
        "Menu jest policzalne i w liczbie pojedynczej wymaga określnika: „I want the menu.” Uprzejmiej: „Could I have the menu, please?”",
        "Singular countable menu needs a determiner: “I want the menu.” More politely: “Could I have the menu, please?”",
        "menu นับได้เอกพจน์ต้องมีคำกำหนด ใช้ “I want the menu.” สุภาพกว่าเป็น “Could I have the menu, please?”",
      ),
      c(
        "I want menu.",
        false,
        "W drugim pytaniu obowiązuje ta sama zasada: brakuje the przed menu. Present Simple I want jest poprawne, ale brzmi bezpośrednio.",
        "The same rule applies to the second question: menu needs the. Present Simple I want is grammatical but direct.",
        "คำถามที่สองใช้หลักเดียวกัน ขาด the หน้า menu ส่วน I want เป็น Present Simple ถูกต้องแต่ตรง",
      ),
    ],
  },
  {
    rule: scriptRule,
    choices: [
      c(
        "ก",
        true,
        "ก jest znakiem nazywanym ko kai, którego dotyczy pytanie.",
        "ก is the symbol called ko kai, requested in the question.",
        "ก คือ ก ไก่ ตามที่คำถามต้องการ",
      ),
      c(
        "ก",
        true,
        "Drugie pytanie powtarza rozpoznanie ko kai, więc również wskazuje ก.",
        "The second source question repeats ko kai, so ก is also its answer.",
        "คำถามที่สองถาม ก ไก่ เช่นกัน จึงตอบ ก",
      ),
      c(
        "ข",
        false,
        "ข to kho khai, a nie ko kai. W tym pytaniu wybierz ก.",
        "ข is kho khai, not ko kai. Here choose ก.",
        "ข คือ ข ไข่ ไม่ใช่ ก ไก่ ข้อนี้ต้องเลือก ก",
      ),
      c(
        "ข",
        false,
        "W powtórzonym pytaniu także chodzi o ก; ข jest inną spółgłoską.",
        "The repeated question also asks for ก; ข is a different consonant.",
        "คำถามซ้ำต้องการ ก เช่นกัน ข เป็นพยัญชนะอีกตัว",
      ),
    ],
  },
  {
    rule: scriptRule,
    choices: [
      c(
        "ค",
        true,
        "ค to kho khwai, zgodnie z pierwszym pytaniem.",
        "ค is kho khwai, as requested in the first question.",
        "ค คือ ค ควาย ตามคำถามแรก",
      ),
      c(
        "ง",
        true,
        "ง to ngo ngu, zgodnie z drugim pytaniem.",
        "ง is ngo ngu, as requested in the second question.",
        "ง คือ ง งู ตามคำถามที่สอง",
      ),
      c(
        "ต",
        false,
        "ต to to tao, nie kho khwai. W pierwszym pytaniu poprawne jest ค.",
        "ต is to tao, not kho khwai. The first question needs ค.",
        "ต คือ ต เต่า ไม่ใช่ ค ควาย คำถามแรกต้องตอบ ค",
      ),
      c(
        "จ",
        false,
        "จ to cho chan, nie ngo ngu. W drugim pytaniu poprawne jest ง.",
        "จ is cho chan, not ngo ngu. The second question needs ง.",
        "จ คือ จ จาน ไม่ใช่ ง งู คำถามที่สองต้องตอบ ง",
      ),
    ],
  },
  {
    rule: scriptRule,
    choices: [
      c(
        "ะ",
        true,
        "ะ oznacza krótkie a (sara a), o które pyta pierwsze zadanie.",
        "ะ represents short a (sara a), requested by the first question.",
        "ะ แทนสระอะเสียงสั้น ตามคำถามแรก",
      ),
      c(
        "า",
        true,
        "W pytaniu o długie aa poprawne jest า (sara aa). Długość samogłoski odróżnia ją od ะ.",
        "For long aa, า (sara aa) is correct. Vowel length distinguishes it from ะ.",
        "คำถามสระอาเสียงยาวต้องตอบ า ความยาวเสียงต่างจาก ะ",
      ),
      c(
        "า",
        false,
        "W pytaniu o krótkie a znak า jest niewłaściwy, bo oznacza długie aa. Tu potrzebne jest ะ, choć า pasuje do drugiego pytania.",
        "In the short-a question, า is wrong because it is long aa. Use ะ here, even though า fits the second question.",
        "ในคำถามสระอะเสียงสั้น า ไม่ตรงเพราะเป็นเสียงยาว ต้องใช้ ะ แม้ า จะถูกในคำถามที่สอง",
      ),
      c(
        "ิ",
        false,
        "ิ oznacza krótkie i, nie długie aa. W drugim pytaniu wybierz า.",
        "ิ represents short i, not long aa. The second question needs า.",
        "ิ คือสระอิเสียงสั้น ไม่ใช่สระอา คำถามที่สองต้องเลือก า",
      ),
    ],
  },
  {
    rule: scriptRule,
    choices: [
      c(
        "่",
        true,
        "่ to znak mai ek, którego dotyczy pierwsze pytanie. Nazwa znaku nie oznacza automatycznie tego samego tonu we wszystkich sylabach.",
        "่ is mai ek, requested in the first question. A mark's name does not imply the same realised tone in every syllable.",
        "่ คือไม้เอกตามคำถามแรก ชื่อเครื่องหมายไม่ได้หมายความว่าทุกพยางค์มีเสียงวรรณยุกต์เดียวกัน",
      ),
      c(
        "้",
        true,
        "้ to mai tho, znak wskazany w drugim pytaniu.",
        "้ is mai tho, requested in the second question.",
        "้ คือไม้โทตามคำถามที่สอง",
      ),
      c(
        "๊",
        false,
        "๊ to mai tri, nie mai ek. W pierwszym pytaniu poprawny znak to ่.",
        "๊ is mai tri, not mai ek. The first question needs ่.",
        "๊ คือไม้ตรี ไม่ใช่ไม้เอก คำถามแรกต้องเลือก ่",
      ),
      c(
        "่",
        false,
        "W pytaniu o mai tho znak ่ nie pasuje: to mai ek. Tu poprawne jest ้; ten sam ่ pasuje do pierwszego pytania.",
        "For mai tho, ่ is wrong: it is mai ek. Use ้ here; ่ fits the first question.",
        "คำถามไม้โทใช้ ่ ไม่ได้เพราะเป็นไม้เอก ต้องใช้ ้ ส่วน ่ ถูกในคำถามแรก",
      ),
    ],
  },
  {
    rule: thaiRule,
    choices: [
      c(
        "ห้า",
        true,
        "ห้า znaczy pięć, więc pasuje do pierwszego pytania. Liczebnik nie ma czasu gramatycznego.",
        "ห้า means five, matching the first question. A number has no grammatical tense.",
        "ห้า คือจำนวนห้าตามคำถามแรก เลขไม่มีกาล",
      ),
      c(
        "สิบ",
        true,
        "สิบ znaczy dziesięć, zgodnie z drugim pytaniem.",
        "สิบ means ten, matching the second question.",
        "สิบ คือจำนวนสิบตามคำถามที่สอง",
      ),
      c(
        "หก",
        false,
        "หก znaczy sześć, nie pięć. Dla pięciu użyj ห้า.",
        "หก means six, not five. For five use ห้า.",
        "หก คือหก ไม่ใช่ห้า ต้องใช้ ห้า",
      ),
      c(
        "เก้า",
        false,
        "เก้า znaczy dziewięć, nie dziesięć. Dla dziesięciu użyj สิบ.",
        "เก้า means nine, not ten. For ten use สิบ.",
        "เก้า คือเก้า ไม่ใช่สิบ ต้องใช้ สิบ",
      ),
    ],
  },
  {
    rule: l(
      "Przy liczeniu przedmiotów w tajskim zwykle stosujemy rzeczownik + liczba + klasyfikator, np. หนังสือสองเล่ม (dwie książki). Klasyfikator zależy od rodzaju przedmiotu; nie jest końcówką liczby mnogiej ani czasu.",
      "Thai counting usually uses noun + number + classifier, e.g. หนังสือสองเล่ม (two books). The classifier depends on the object type; it is not a plural or tense ending.",
      "การนับสิ่งของมักเรียงนาม + จำนวน + ลักษณนาม เช่น หนังสือสองเล่ม ลักษณนามขึ้นกับชนิดสิ่งของ ไม่ใช่ส่วนเติมพหูพจน์หรือกาล",
    ),
    choices: [
      c(
        "แผ่น",
        true,
        "แผ่น liczy płaskie przedmioty, np. arkusze papieru: กระดาษสองแผ่น.",
        "แผ่น counts flat objects such as sheets of paper: กระดาษสองแผ่น.",
        "แผ่นใช้นับของแบน เช่น กระดาษสองแผ่น",
      ),
      c(
        "เล่ม",
        true,
        "เล่ม to klasyfikator książek: หนังสือสองเล่ม.",
        "เล่ม is the classifier for books: หนังสือสองเล่ม.",
        "เล่มใช้กับหนังสือ เช่น หนังสือสองเล่ม",
      ),
      c(
        "ตัว",
        false,
        "ตัว stosuje się m.in. do zwierząt, nie do arkuszy papieru w tym pytaniu. Poprawnie: แผ่น.",
        "ตัว is used for animals among other categories, not the paper sheets here. Use แผ่น.",
        "ตัวใช้กับสัตว์และบางหมวด แต่กระดาษในข้อนี้ต้องใช้ แผ่น",
      ),
      c(
        "คน",
        false,
        "คน liczy osoby, nie książki. Dla książek użyj เล่ม.",
        "คน counts people, not books. For books use เล่ม.",
        "คนใช้นับคน ไม่ใช่หนังสือ หนังสือใช้ เล่ม",
      ),
    ],
  },
  {
    rule: thaiRule,
    choices: [
      c(
        "โมง",
        true,
        "โมง występuje w wyrażeniach godziny zegarowej. Nie jest uniwersalnym określeniem czasu trwania: do długości godzin służy ชั่วโมง.",
        "โมง occurs in clock-time expressions. It is not the general duration word: hours of duration use ชั่วโมง.",
        "โมงใช้บอกเวลานาฬิกา ส่วนระยะเวลาเป็นชั่วโมงใช้ ชั่วโมง",
      ),
      c(
        "กี่โมงแล้ว",
        true,
        "กี่ pyta o liczbę, โมง o godzinę; całe wyrażenie pyta „która godzina?”. แล้ว nie jest tu odpowiednikiem końcówki Past Simple.",
        "กี่ asks how many, โมง refers to clock time; the phrase asks the current time. แล้ว is not a Past Simple ending here.",
        "กี่ถามจำนวน โมงบอกเวลา รวมเป็นคำถามเวลาปัจจุบัน แล้วไม่ใช่ส่วนเติม Past Simple",
      ),
      c(
        "วัน",
        false,
        "วัน oznacza dzień, nie godzinę zegarową. W pierwszym pytaniu pasuje โมง.",
        "วัน means day, not clock hour. The first question needs โมง.",
        "วันคือวัน ไม่ใช่โมง คำถามแรกต้องใช้ โมง",
      ),
      c(
        "ที่ไหนแล้ว",
        false,
        "ที่ไหน pyta „gdzie”, więc nie pyta o godzinę. Poprawne pytanie o czas: กี่โมงแล้ว.",
        "ที่ไหน asks where, not the time. To ask the time use กี่โมงแล้ว.",
        "ที่ไหนถามสถานที่ ไม่ใช่เวลา ถามเวลาใช้ กี่โมงแล้ว",
      ),
    ],
  },
  {
    rule: thaiRule,
    choices: [
      c(
        "บาท",
        true,
        "บาท to nazwa waluty; po liczbie podaje cenę, np. สิบบาท — dziesięć batów.",
        "บาท is the currency; after a number it states a price, e.g. สิบบาท (ten baht).",
        "บาทเป็นหน่วยเงิน ตามหลังจำนวน เช่น สิบบาท",
      ),
      c(
        "เท่าไหร่",
        true,
        "เท่าไหร่ znaczy „ile”; w kontekście ceny pyta o koszt. Nie wymaga operatora do ani odmiany czasownika.",
        "เท่าไหร่ means how much; in a price context it asks the cost. No do auxiliary or verb inflection is needed.",
        "เท่าไหร่ถามปริมาณ ในบริบทราคาคือถามราคา ไม่ต้องใช้ do หรือผันกริยา",
      ),
      c(
        "เมตร",
        false,
        "เมตร to metr, jednostka długości, nie waluta. Dla ceny w batach użyj บาท.",
        "เมตร is a metre, a length unit, not currency. For baht use บาท.",
        "เมตรเป็นหน่วยความยาว ไม่ใช่เงิน ราคาบาทใช้ บาท",
      ),
      c(
        "ที่ไหน",
        false,
        "ที่ไหน pyta o miejsce („gdzie?”), nie cenę. Dla ceny użyj เท่าไหร่.",
        "ที่ไหน asks location (where), not price. For price use เท่าไหร่.",
        "ที่ไหนถามสถานที่ ไม่ใช่ราคา ถามราคาใช้ เท่าไหร่",
      ),
    ],
  },
  {
    rule: thaiRule,
    choices: [
      c(
        "สวัสดี",
        true,
        "สวัสดี jest standardowym powitaniem; można dodać ครับ/ค่ะ dla uprzejmości.",
        "สวัสดี is the standard greeting; ครับ/ค่ะ can add politeness.",
        "สวัสดีเป็นคำทักทายมาตรฐาน เติมครับ/ค่ะเพื่อความสุภาพได้",
      ),
      c(
        "สบายดีไหม",
        true,
        "สบายดี oznacza dobre samopoczucie, ไหม tworzy pytanie tak/nie. Całość odpowiada „jak się masz?”.",
        "สบายดี means well; ไหม forms a yes/no question. Together they ask how you are.",
        "สบายดีบอกสภาพ ไหมทำให้เป็นคำถาม ใช้ถามสารทุกข์สุกดิบ",
      ),
      c(
        "ลาก่อน",
        false,
        "ลาก่อน to pożegnanie, nie powitanie. Przy rozpoczęciu rozmowy użyj สวัสดี.",
        "ลาก่อน is goodbye, not a greeting on arrival. Use สวัสดี to open the conversation.",
        "ลาก่อนเป็นคำลา ไม่ใช่คำทักเมื่อพบกัน เริ่มสนทนาใช้ สวัสดี",
      ),
      c(
        "กินข้าวหรือยัง",
        false,
        "To gramatyczne pytanie „czy już jadłeś?”. Bywa powitaniem kulturowym, ale nie znaczy dosłownie „jak się masz?” z tego zadania. Tu: สบายดีไหม.",
        "This grammatical question means “Have you eaten yet?” It can be a social greeting, but is not the literal how-are-you question tested here. Use สบายดีไหม.",
        "เป็นคำถามถูกต้องว่าได้กินข้าวแล้วหรือยัง ใช้ทักทายได้ แต่ไม่ใช่ความหมายตรงของการถามสบายดีไหมในโจทย์นี้",
      ),
    ],
  },
  {
    rule: thaiRule,
    choices: [
      c(
        "ค่ะ",
        true,
        "W pytaniu o kobiecą partykułę w zdaniu oznajmującym pasuje ค่ะ. W pytaniach używa się คะ.",
        "For a feminine polite particle in a statement, ค่ะ fits. Questions use คะ.",
        "คำสุภาพแบบผู้หญิงในประโยคบอกเล่าใช้ ค่ะ คำถามใช้ คะ",
      ),
      c(
        "ครับ",
        true,
        "W pytaniu o męską partykułę pasuje ครับ; może kończyć zarówno oznajmienie, jak i pytanie.",
        "For the masculine polite particle, ครับ fits; it can end statements and questions.",
        "คำสุภาพแบบผู้ชายใช้ ครับ ได้ทั้งบอกเล่าและคำถาม",
      ),
      c(
        "ครับ",
        false,
        "ครับ jest poprawną partykułą męską, lecz pierwsze pytanie dotyczy żeńskiej. W tym kontekście użyj ค่ะ.",
        "ครับ is a valid masculine particle, but the first question asks for the feminine form. Here use ค่ะ.",
        "ครับเป็นคำสุภาพแบบผู้ชายที่ถูกต้อง แต่คำถามแรกถามแบบผู้หญิง จึงใช้ ค่ะ",
      ),
      c(
        "ค่ะ",
        false,
        "ค่ะ jest partykułą żeńską; drugie pytanie dotyczy męskiej. W nim poprawne jest ครับ.",
        "ค่ะ is feminine; the second question asks for the masculine form. There use ครับ.",
        "ค่ะเป็นแบบผู้หญิง แต่คำถามที่สองถามแบบผู้ชาย จึงใช้ ครับ",
      ),
    ],
  },
  {
    rule: thaiRule,
    choices: [
      c(
        "ไหม",
        true,
        "ไหม dodaje pytanie tak/nie po treści zdania, np. สบายดีไหม. Nie jest czasownikiem pomocniczym do.",
        "ไหม follows a statement to form a yes/no question, e.g. สบายดีไหม. It is not the auxiliary do.",
        "ไหมอยู่หลังข้อความเพื่อสร้างคำถามใช่/ไม่ใช่ เช่น สบายดีไหม ไม่ใช่กริยาช่วย do",
      ),
      c(
        "อะไร",
        true,
        "อะไร oznacza „co” i zwykle pozostaje w miejscu pytanej informacji, np. กินอะไร — co jesz?.",
        "อะไร means what and normally stays in the position of the requested information, e.g. กินอะไร (eat what?).",
        "อะไรเป็นคำถามถึงสิ่งใดสิ่งหนึ่ง มักอยู่ตรงตำแหน่งข้อมูลที่ถาม เช่น กินอะไร",
      ),
      c(
        "ครับ",
        false,
        "ครับ wyraża uprzejmość; samo nie zastępuje partykuły pytającej ไหม. Można je połączyć: สบายดีไหมครับ.",
        "ครับ marks politeness; alone it does not replace question particle ไหม. They can combine: สบายดีไหมครับ.",
        "ครับบอกความสุภาพ ไม่แทนคำถาม ไหม ใช้ร่วมกันได้ เช่น สบายดีไหมครับ",
      ),
      c(
        "ที่ไหน",
        false,
        "ที่ไหน znaczy „gdzie”, nie „co”. Dla pytania o rzecz użyj อะไร.",
        "ที่ไหน means where, not what. To ask about a thing use อะไร.",
        "ที่ไหนถามสถานที่ ไม่ใช่สิ่งของ ถามสิ่งของใช้ อะไร",
      ),
    ],
  },
  {
    rule: thaiRule,
    choices: [
      c(
        "ซ้าย",
        true,
        "ซ้าย oznacza lewo. Może uzupełniać polecenie เลี้ยวซ้าย — skręć w lewo.",
        "ซ้าย means left. It can complete เลี้ยวซ้าย (turn left).",
        "ซ้ายบอกทิศทาง ใช้กับคำสั่ง เลี้ยวซ้าย",
      ),
      c(
        "ตรงไป",
        true,
        "ตรงไป to polecenie „idź prosto”; pominięty podmiot jest naturalny w instrukcji.",
        "ตรงไป means go straight; omitting the subject is natural in an instruction.",
        "ตรงไปเป็นคำสั่งให้ไปตรง การละประธานเป็นธรรมชาติในคำสั่ง",
      ),
      c(
        "ขวา",
        false,
        "ขวา znaczy prawo, czyli przeciwieństwo lewo. W pierwszym pytaniu pasuje ซ้าย.",
        "ขวา means right, the opposite of left. The first question needs ซ้าย.",
        "ขวาตรงข้ามกับซ้าย คำถามแรกต้องใช้ ซ้าย",
      ),
      c(
        "เลี้ยว",
        false,
        "เลี้ยว znaczy „skręcić”, nie „iść prosto”. Dla ruchu prosto użyj ตรงไป.",
        "เลี้ยว means turn, not go straight. For straight ahead use ตรงไป.",
        "เลี้ยวคือเปลี่ยนทิศ ไม่ใช่ไปตรง ต้องใช้ ตรงไป",
      ),
    ],
  },
);

const labels = {
  pl: {
    rule: "Zasada",
    correct: "Poprawna odpowiedź",
    incorrect: "Niepoprawna odpowiedź",
  },
  en: {
    rule: "Rule",
    correct: "Correct option",
    incorrect: "Incorrect option",
  },
  th: {
    rule: "หลักการ",
    correct: "ตัวเลือกที่ถูกต้อง",
    incorrect: "ตัวเลือกที่ไม่ถูกต้อง",
  },
};

export function choiceExplanation(
  locale: Locale,
  options: Array<{ id: string; text: string }>,
  expected: unknown,
): string | undefined {
  if (
    !Array.isArray(expected) ||
    !expected.every((id) => typeof id === "string")
  )
    return undefined;
  const correct = new Set(expected);
  if (
    !options.length ||
    correct.size !== expected.length ||
    new Set(options.map((option) => option.id)).size !== options.length ||
    [...correct].some((id) => !options.some((option) => option.id === id))
  )
    return undefined;
  const contextual = options.every((option) => /^\[[12]\] /.test(option.text));
  const textOf = (text: string) =>
    contextual ? text.replace(/^\[[12]\] /, "") : text;
  const signature = (choices: Array<{ text: string; correct: boolean }>) =>
    JSON.stringify(
      choices
        .map((choice) => JSON.stringify([choice.text, choice.correct]))
        .sort(),
    );
  const key = signature(
    options.map((option) => ({
      text: textOf(option.text),
      correct: correct.has(option.id),
    })),
  );
  const lesson = choiceTeaching.find(
    (entry) => signature(entry.choices) === key,
  );
  if (!lesson) return undefined;
  const copy = labels[locale];
  return [
    `${copy.rule}: ${lesson.rule[locale]}`,
    ...options.map((option) => {
      const choice = lesson.choices.find(
        (entry) =>
          entry.text === textOf(option.text) &&
          entry.correct === correct.has(option.id),
      )!;
      return `${choice.correct ? "✓" : "✗"} ${copy[choice.correct ? "correct" : "incorrect"]}: „${option.text}”\n${choice.reason[locale]}`;
    }),
  ].join("\n\n");
}

/** A publication completeness check, not a substitute for linguistic review. */
export const coversChoiceOptions = (
  explanation: string | null | undefined,
  options: Array<{ text: string }>,
): boolean =>
  Boolean(
    explanation?.trim() &&
    options.length &&
    options.every((option) => explanation.includes(option.text)),
  );
