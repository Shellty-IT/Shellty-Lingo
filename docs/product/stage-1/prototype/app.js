(() => {
  "use strict";

  const copy = {
    pl: {
      locale: "pl", start: "Rozpocznij", login: "Mam już konto", promise: "Ucz się. Rozmawiaj. Rób postępy.",
      chooseUi: "Wybierz język aplikacji", chooseUiSub: "Możesz go później zmienić w profilu.", chooseCourse: "Czego chcesz się uczyć?", chooseCourseSub: "Postęp każdego kursu zapisujemy osobno.",
      english: "Angielski", thai: "Tajski", uiLanguage: "Język interfejsu", thaiDesc: "Alfabet, tony i codzienne sytuacje", enDesc: "Praktyczny angielski A1–A2",
      chooseGoal: "Jaki jest Twój główny cel?", chooseGoalSub: "Dopasujemy tematy i plan pierwszych sesji.", work: "Praca i kariera", workSub: "Rozmowy, e-maile i spotkania", travel: "Podróże", travelSub: "Codzienne sytuacje w drodze", talk: "Swobodne rozmowy", talkSub: "Płynność i pewność siebie",
      chooseTime: "Ile czasu masz dziennie?", chooseTimeSub: "Plan będzie krótki i wykonalny. Zmienisz go w każdej chwili.", min5: "5 minut", min10: "10 minut", min15: "15 minut", light: "Lekki start", recommended: "Polecane", regular: "Regularna sesja",
      testTitle: "Krótki test poziomujący", testSub: "Odpowiedz na jedno przykładowe pytanie. Wynik jest wskazówką, nie certyfikatem.", question: "Które zdanie oznacza: „Poproszę menu” ?", check: "Sprawdź odpowiedź", skip: "Pomiń test", next: "Dalej", step: "Krok {n} z 6",
      hello: "Miło Cię widzieć,", name: "Tomasz", streak: "7 dni", today: "Dziś", learn: "Nauka", tutor: "Tutor AI", progress: "Postępy", profile: "Profil", planToday: "PLAN NA DZIŚ", approx: "około 10 min", planEn: "W restauracji — pierwsze zwroty", planTh: "Alfabet tajski — pierwsze znaki", planDesc: "1 krótka lekcja i 6 słów do powtórki", beginLearning: "Rozpocznij naukę", review: "Powtórka", reviewSub: "6 słów gotowych", weekly: "Cel tygodnia", weeklySub: "3 z 5 dni", aiShortcut: "Przećwicz sytuację z Tutorem AI", aiShortcutSub: "Bezpieczna rozmowa tekstowa",
      learnTitle: "Twoja ścieżka", learnSub: "Wybierz lekcję albo kontynuuj plan na dziś.", lesson1: "Pierwsze zwroty w restauracji", lesson2: "Zamawianie i prośby", lesson3: "Rachunek i płatność", lessonMeta: "5 min · słownictwo", continue: "Kontynuuj",
      exercise: "Ćwiczenie 1 z 1", exercisePrompt: "Wybierz właściwe tłumaczenie.", listen: "Odtwórz wymowę", dictionary: "Otwórz słownik kontekstowy", answerA: "Poproszę menu.", answerB: "Chciałbym zapłacić.", answerC: "Gdzie jest stolik?", correct: "Dobrze! „Could I have the menu?” to uprzejma prośba o menu.", finish: "Zakończ lekcję",
      resultTitle: "Pierwsza lekcja ukończona", resultSub: "Postęp został zapisany w kursie angielskim.", accuracy: "skuteczność", words: "nowe słowa", time: "czas", goTutor: "Przećwicz z Tutorem AI", backToday: "Wróć do planu",
      tutorTitle: "Tutor AI", tutorSub: "Wybierz sytuację. Przed rozmową zobaczysz tryb korekty i limit.", cafe: "W kawiarni", cafeSub: "Zamów napój i odpowiedz na pytania baristy", meeting: "Pierwsze spotkanie", meetingSub: "Przedstaw się i opowiedz czym się zajmujesz", hotel: "W hotelu", hotelSub: "Zapytaj o pokój i udogodnienia", limitLeft: "Pozostały 2 rozmowy dzisiaj",
      setupTitle: "Przygotuj rozmowę", correctionMode: "Korekta po każdej wiadomości", scenario: "Scenariusz", aiTrust: "Rozmawiasz z AI, nie z człowiekiem. Tutor może się mylić. Nie wpisuj danych poufnych.", startChat: "Rozpocznij rozmowę",
      chatTitle: "W kawiarni", aiRole: "Tutor AI", aiHello: "Hi! Welcome to Blue Café. What would you like to order today?", userMsg: "I want coffee with milk, please.", correction: "Naturalniejsza forma", correctionText: "Could I have a coffee with milk, please?", confidence: "Może zależeć od kontekstu", aiReply: "Of course. Would you like it hot or iced?", placeholder: "Napisz odpowiedź…", send: "Wyślij", report: "Zgłoś odpowiedź",
      progressTitle: "Twój postęp", progressSub: "Wyniki są zawsze oddzielne dla każdego kursu.", thisWeek: "Ten tydzień", minutes: "minut", lessons: "lekcje", mastered: "słowa", nextStep: "Następny krok", nextStepSub: "Ukończ lekcję „Zamawianie i prośby”.",
      profileTitle: "Profil i ustawienia", account: "Konto i bezpieczeństwo", languages: "Języki i kursy", accessibility: "Dostępność", privacy: "Prywatność i zgody", export: "Eksport i usunięcie danych", translit: "Transliteracja tajskiego", on: "Włączona",
      dictTitle: "Słownik kontekstowy", dictMeaning: "Czy mogę prosić o menu?", dictContext: "Uprzejma prośba używana w restauracji. Forma „Could I have…” brzmi naturalniej niż bezpośrednie „I want…”.", sourceAudio: "Odtwórz oryginał", translationAudio: "Odtwórz tłumaczenie", saveReview: "Zapisz do powtórek", close: "Zamknij",
      back: "Wstecz", retry: "Spróbuj ponownie", signIn: "Zaloguj się ponownie", goLessons: "Przejdź do lekcji", stateLoading: "Ładujemy Twój plan…", stateLoadingSub: "To powinno potrwać tylko chwilę.", stateEmpty: "Tu jeszcze nic nie ma", stateEmptySub: "Rozpocznij pierwszą lekcję, a pokażemy tutaj plan i postęp.", stateOffline: "Brak połączenia z internetem", stateOfflineSub: "Twoje odpowiedzi zostały zachowane na tym urządzeniu. Połącz się i spróbuj ponownie.", stateError: "Nie udało się pobrać danych", stateErrorSub: "To problem po naszej stronie. Możesz bezpiecznie ponowić próbę.", stateLimit: "Dzisiejszy limit AI wykorzystany", stateLimitSub: "Lekcje i powtórki nadal działają. Limit rozmów odnowi się jutro.", stateSession: "Sesja wygasła", stateSessionSub: "Dla bezpieczeństwa zaloguj się ponownie. Postęp na tym ekranie został zachowany.",
    },
    en: {
      locale: "en", start: "Get started", login: "I already have an account", promise: "Learn. Talk. Make progress.",
      chooseUi: "Choose the app language", chooseUiSub: "You can change it later in your profile.", chooseCourse: "What do you want to learn?", chooseCourseSub: "Progress is stored separately for each course.", english: "English", thai: "Thai", uiLanguage: "Interface language", thaiDesc: "Script, tones and daily situations", enDesc: "Practical English A1–A2",
      chooseGoal: "What is your main goal?", chooseGoalSub: "We will tailor the topics and your first sessions.", work: "Work and career", workSub: "Conversations, email and meetings", travel: "Travel", travelSub: "Everyday situations on the road", talk: "Casual conversation", talkSub: "Fluency and confidence",
      chooseTime: "How much time do you have each day?", chooseTimeSub: "Your plan will stay short and achievable. Change it any time.", min5: "5 minutes", min10: "10 minutes", min15: "15 minutes", light: "Light start", recommended: "Recommended", regular: "Regular session",
      testTitle: "Quick placement check", testSub: "Answer one sample question. The result is guidance, not a certificate.", question: "Which sentence means: “Poproszę menu” ?", check: "Check answer", skip: "Skip test", next: "Next", step: "Step {n} of 6",
      hello: "Good to see you,", name: "Thomas", streak: "7 days", today: "Today", learn: "Learn", tutor: "AI Tutor", progress: "Progress", profile: "Profile", planToday: "TODAY'S PLAN", approx: "about 10 min", planEn: "At a restaurant — first phrases", planTh: "Thai script — first characters", planDesc: "1 short lesson and 6 words to review", beginLearning: "Start learning", review: "Review", reviewSub: "6 words ready", weekly: "Weekly goal", weeklySub: "3 of 5 days", aiShortcut: "Practise with the AI Tutor", aiShortcutSub: "A safe text conversation",
      learnTitle: "Your learning path", learnSub: "Choose a lesson or continue today's plan.", lesson1: "First restaurant phrases", lesson2: "Ordering and requests", lesson3: "The bill and payment", lessonMeta: "5 min · vocabulary", continue: "Continue",
      exercise: "Exercise 1 of 1", exercisePrompt: "Choose the correct translation.", listen: "Play pronunciation", dictionary: "Open contextual dictionary", answerA: "Could I have the menu?", answerB: "I would like to pay.", answerC: "Where is the table?", correct: "Correct! “Could I have the menu?” is a polite request for a menu.", finish: "Finish lesson",
      resultTitle: "First lesson complete", resultSub: "Progress was saved to your English course.", accuracy: "accuracy", words: "new words", time: "time", goTutor: "Practise with the AI Tutor", backToday: "Back to today's plan",
      tutorTitle: "AI Tutor", tutorSub: "Choose a situation. You will see the correction mode and limit before the chat.", cafe: "At a café", cafeSub: "Order a drink and answer the barista", meeting: "First meeting", meetingSub: "Introduce yourself and describe your work", hotel: "At a hotel", hotelSub: "Ask about a room and amenities", limitLeft: "2 conversations left today",
      setupTitle: "Prepare your conversation", correctionMode: "Correct after each message", scenario: "Scenario", aiTrust: "You are talking to AI, not a person. The tutor can make mistakes. Do not enter confidential information.", startChat: "Start conversation",
      chatTitle: "At a café", aiRole: "AI Tutor", aiHello: "Hi! Welcome to Blue Café. What would you like to order today?", userMsg: "I want coffee with milk, please.", correction: "More natural option", correctionText: "Could I have a coffee with milk, please?", confidence: "May depend on context", aiReply: "Of course. Would you like it hot or iced?", placeholder: "Write a reply…", send: "Send", report: "Report response",
      progressTitle: "Your progress", progressSub: "Results are always separate for each course.", thisWeek: "This week", minutes: "minutes", lessons: "lessons", mastered: "words", nextStep: "Next step", nextStepSub: "Complete “Ordering and requests”.",
      profileTitle: "Profile and settings", account: "Account and security", languages: "Languages and courses", accessibility: "Accessibility", privacy: "Privacy and consent", export: "Export and delete data", translit: "Thai transliteration", on: "On",
      dictTitle: "Contextual dictionary", dictMeaning: "May I have the menu?", dictContext: "A polite request used in a restaurant. “Could I have…” sounds more natural than the direct “I want…”.", sourceAudio: "Play source", translationAudio: "Play translation", saveReview: "Save for review", close: "Close",
      back: "Back", retry: "Try again", signIn: "Sign in again", goLessons: "Go to lessons", stateLoading: "Loading your plan…", stateLoadingSub: "This should only take a moment.", stateEmpty: "Nothing here yet", stateEmptySub: "Start your first lesson and your plan and progress will appear here.", stateOffline: "You are offline", stateOfflineSub: "Your answers are safe on this device. Reconnect and try again.", stateError: "We could not load the data", stateErrorSub: "The problem is on our side. It is safe to try again.", stateLimit: "Today's AI limit is used", stateLimitSub: "Lessons and reviews still work. Your chat limit renews tomorrow.", stateSession: "Your session expired", stateSessionSub: "Sign in again for security. Your progress on this screen is safe.",
    },
    th: {
      locale: "th", start: "เริ่มต้นใช้งาน", login: "ฉันมีบัญชีแล้ว", promise: "เรียนรู้ สนทนา และพัฒนาต่อไป", chooseUi: "เลือกภาษาของแอป", chooseUiSub: "คุณเปลี่ยนภาษาได้ภายหลังในโปรไฟล์", chooseCourse: "คุณต้องการเรียนภาษาอะไร", chooseCourseSub: "เราบันทึกความก้าวหน้าของแต่ละหลักสูตรแยกกัน", english: "ภาษาอังกฤษ", thai: "ภาษาไทย", uiLanguage: "ภาษาของแอป", thaiDesc: "อักษร วรรณยุกต์ และสถานการณ์ประจำวัน", enDesc: "ภาษาอังกฤษที่ใช้จริง ระดับ A1–A2",
      chooseGoal: "เป้าหมายหลักของคุณคืออะไร", chooseGoalSub: "เราจะปรับหัวข้อและแผนการเรียนให้เหมาะกับคุณ", work: "งานและอาชีพ", workSub: "การสนทนา อีเมล และการประชุม", travel: "การเดินทาง", travelSub: "สถานการณ์ทั่วไประหว่างเดินทาง", talk: "การสนทนาทั่วไป", talkSub: "ความคล่องแคล่วและความมั่นใจ",
      chooseTime: "คุณมีเวลาเรียนวันละเท่าไร", chooseTimeSub: "แผนจะสั้นและทำได้จริง คุณเปลี่ยนได้ทุกเมื่อ", min5: "5 นาที", min10: "10 นาที", min15: "15 นาที", light: "เริ่มแบบเบา ๆ", recommended: "แนะนำ", regular: "เรียนสม่ำเสมอ",
      testTitle: "แบบทดสอบวัดระดับสั้น ๆ", testSub: "ตอบคำถามตัวอย่างหนึ่งข้อ ผลลัพธ์เป็นเพียงคำแนะนำ ไม่ใช่ใบรับรอง", question: "ประโยคใดหมายถึง “ขอเมนูหน่อยครับ/ค่ะ”", check: "ตรวจคำตอบ", skip: "ข้ามแบบทดสอบ", next: "ถัดไป", step: "ขั้นตอนที่ {n} จาก 6",
      hello: "ยินดีต้อนรับกลับมา", name: "โทมัส", streak: "7 วัน", today: "วันนี้", learn: "เรียน", tutor: "ติวเตอร์ AI", progress: "ความก้าวหน้า", profile: "โปรไฟล์", planToday: "แผนวันนี้", approx: "ประมาณ 10 นาที", planEn: "ที่ร้านอาหาร — วลีแรก", planTh: "อักษรไทย — ตัวอักษรแรก", planDesc: "1 บทเรียนสั้นและทบทวน 6 คำ", beginLearning: "เริ่มเรียน", review: "ทบทวน", reviewSub: "พร้อมทบทวน 6 คำ", weekly: "เป้าหมายรายสัปดาห์", weeklySub: "3 จาก 5 วัน", aiShortcut: "ฝึกสถานการณ์กับติวเตอร์ AI", aiShortcutSub: "สนทนาแบบข้อความอย่างปลอดภัย",
      learnTitle: "เส้นทางการเรียนของคุณ", learnSub: "เลือกบทเรียนหรือทำแผนวันนี้ต่อ", lesson1: "วลีแรกที่ร้านอาหาร", lesson2: "การสั่งและการขอ", lesson3: "ใบเสร็จและการชำระเงิน", lessonMeta: "5 นาที · คำศัพท์", continue: "เรียนต่อ",
      exercise: "แบบฝึกหัด 1 จาก 1", exercisePrompt: "เลือกคำแปลที่ถูกต้อง", listen: "ฟังการออกเสียง", dictionary: "เปิดพจนานุกรมตามบริบท", answerA: "ขอเมนูหน่อยครับ/ค่ะ", answerB: "ฉันต้องการชำระเงิน", answerC: "โต๊ะอยู่ที่ไหน", correct: "ถูกต้อง! “Could I have the menu?” เป็นคำขอเมนูอย่างสุภาพ", finish: "จบบทเรียน",
      resultTitle: "เรียนบทแรกเสร็จแล้ว", resultSub: "บันทึกความก้าวหน้าในหลักสูตรภาษาอังกฤษแล้ว", accuracy: "ความถูกต้อง", words: "คำใหม่", time: "เวลา", goTutor: "ฝึกกับติวเตอร์ AI", backToday: "กลับไปที่แผนวันนี้",
      tutorTitle: "ติวเตอร์ AI", tutorSub: "เลือกสถานการณ์ คุณจะเห็นรูปแบบการแก้ไขและขีดจำกัดก่อนสนทนา", cafe: "ที่ร้านกาแฟ", cafeSub: "สั่งเครื่องดื่มและตอบคำถามของบาริสต้า", meeting: "การพบกันครั้งแรก", meetingSub: "แนะนำตัวและเล่าเกี่ยวกับงาน", hotel: "ที่โรงแรม", hotelSub: "ถามเรื่องห้องพักและสิ่งอำนวยความสะดวก", limitLeft: "วันนี้เหลือการสนทนา 2 ครั้ง",
      setupTitle: "เตรียมการสนทนา", correctionMode: "แก้ไขหลังทุกข้อความ", scenario: "สถานการณ์", aiTrust: "คุณกำลังสนทนากับ AI ไม่ใช่มนุษย์ ติวเตอร์อาจผิดพลาดได้ โปรดอย่าใส่ข้อมูลลับ", startChat: "เริ่มการสนทนา",
      chatTitle: "ที่ร้านกาแฟ", aiRole: "ติวเตอร์ AI", aiHello: "Hi! Welcome to Blue Café. What would you like to order today?", userMsg: "I want coffee with milk, please.", correction: "รูปแบบที่เป็นธรรมชาติกว่า", correctionText: "Could I have a coffee with milk, please?", confidence: "อาจขึ้นอยู่กับบริบท", aiReply: "Of course. Would you like it hot or iced?", placeholder: "เขียนคำตอบ…", send: "ส่ง", report: "รายงานคำตอบ",
      progressTitle: "ความก้าวหน้าของคุณ", progressSub: "ผลลัพธ์ของแต่ละหลักสูตรแยกจากกันเสมอ", thisWeek: "สัปดาห์นี้", minutes: "นาที", lessons: "บทเรียน", mastered: "คำศัพท์", nextStep: "ขั้นตอนต่อไป", nextStepSub: "เรียนบท “การสั่งและการขอ” ให้จบ",
      profileTitle: "โปรไฟล์และการตั้งค่า", account: "บัญชีและความปลอดภัย", languages: "ภาษาและหลักสูตร", accessibility: "การช่วยการเข้าถึง", privacy: "ความเป็นส่วนตัวและความยินยอม", export: "ส่งออกและลบข้อมูล", translit: "การถอดเสียงภาษาไทย", on: "เปิด",
      dictTitle: "พจนานุกรมตามบริบท", dictMeaning: "ขอเมนูหน่อยครับ/ค่ะ", dictContext: "คำขออย่างสุภาพที่ใช้ในร้านอาหาร รูปแบบ “Could I have…” ฟังเป็นธรรมชาติกว่า “I want…”", sourceAudio: "ฟังต้นฉบับ", translationAudio: "ฟังคำแปล", saveReview: "บันทึกเพื่อทบทวน", close: "ปิด",
      back: "ย้อนกลับ", retry: "ลองอีกครั้ง", signIn: "เข้าสู่ระบบอีกครั้ง", goLessons: "ไปที่บทเรียน", stateLoading: "กำลังโหลดแผนของคุณ…", stateLoadingSub: "โปรดรอสักครู่", stateEmpty: "ยังไม่มีข้อมูล", stateEmptySub: "เริ่มบทเรียนแรก แล้วแผนและความก้าวหน้าจะแสดงที่นี่", stateOffline: "ไม่มีการเชื่อมต่ออินเทอร์เน็ต", stateOfflineSub: "คำตอบของคุณถูกเก็บไว้ในอุปกรณ์นี้ เชื่อมต่อแล้วลองอีกครั้ง", stateError: "โหลดข้อมูลไม่สำเร็จ", stateErrorSub: "ปัญหาเกิดจากระบบของเรา คุณลองอีกครั้งได้อย่างปลอดภัย", stateLimit: "ใช้สิทธิ์ AI วันนี้ครบแล้ว", stateLimitSub: "บทเรียนและการทบทวนยังใช้งานได้ สิทธิ์สนทนาจะต่ออายุพรุ่งนี้", stateSession: "เซสชันหมดอายุ", stateSessionSub: "โปรดเข้าสู่ระบบอีกครั้งเพื่อความปลอดภัย ความก้าวหน้าบนหน้านี้ยังถูกเก็บไว้",
    },
  };

  const params = new URLSearchParams(location.search);
  const allowedRoutes = new Set(["welcome","ui","course","goal","time","test","today","learn","lesson","result","tutor","tutor-setup","chat","progress","profile"]);
  const state = {
    route: allowedRoutes.has(params.get("route")) ? params.get("route") : "welcome",
    locale: ["pl","en","th"].includes(params.get("locale")) ? params.get("locale") : "pl",
    platform: ["ios","android"].includes(params.get("platform")) ? params.get("platform") : "ios",
    scale: params.get("scale") === "2" ? "2" : "1",
    viewState: ["content","loading","empty","offline","error","limit","session"].includes(params.get("state")) ? params.get("state") : "content",
    course: params.get("course") === "th" ? "th" : "en", goal: "work", time: "10", answer: null, checked: false, overlay: null, restoreFocus: null,
  };
  const app = document.querySelector("#app");
  const device = document.querySelector("#device");
  const routeLabel = document.querySelector("#route-label");
  const t = (key) => copy[state.locale][key] || copy.pl[key] || key;
  const icon = (symbol) => `<span aria-hidden="true">${symbol}</span>`;
  const status = () => `<div class="status-bar"><span>9:41</span><span class="status-icons" aria-hidden="true">▮▮▮ ◒ ▰</span></div>`;
  const logo = () => `<svg class="logo-hero" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4 88 26v48L50 96 12 74V26Z" fill="none" stroke="#5fa6ff" stroke-width="6" stroke-linejoin="round"/><path d="m50 20 24 14v16H50M50 50H26v16l24 14" fill="none" stroke="#12b5a8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const button = (label, action, variant = "primary", extra = "") => `<button type="button" class="button button--${variant}" data-action="${action}" ${extra}>${label}</button>`;
  const backHeader = (title, action = "back") => `<div class="screen__header"><button type="button" class="icon-button" data-action="${action}" aria-label="${t("back")}">‹</button><h1 tabindex="-1">${title}</h1></div>`;
  const step = (n) => `<p class="step-label">${t("step").replace("{n}", n)}</p><div class="progress-line" role="progressbar" aria-valuemin="1" aria-valuemax="6" aria-valuenow="${n}"><span style="width:${(n / 6) * 100}%"></span></div>`;
  const choice = (id, title, sub, symbol, selected, action = "choose") => `<button type="button" class="choice" data-action="${action}" data-value="${id}" aria-pressed="${selected}"><span class="choice__icon" aria-hidden="true">${symbol}</span><span class="choice__copy"><strong>${title}</strong><small>${sub}</small></span><span class="choice__check" aria-hidden="true">✓</span></button>`;

  function nav(active) {
    const items = [["today", "⌂", "today"], ["learn", "▤", "learn"], ["tutor", "✦", "tutor"], ["progress", "▥", "progress"], ["profile", "◉", "profile"]];
    return `<nav class="bottom-nav" aria-label="Główna nawigacja">${items.map(([route, symbol, label]) => `<button type="button" data-route="${route}" ${route === active ? 'aria-current="page"' : ""}><span class="nav-icon" aria-hidden="true">${symbol}</span><span>${t(label)}</span></button>`).join("")}</nav>`;
  }

  function welcome() {
    return `<section class="screen screen--dark">${status()}<div class="screen__body screen__body--center"><div class="welcome-copy">${logo()}<h1 class="title" tabindex="-1">Shellty <strong>Lingo</strong></h1><p class="subtitle">${t("promise")}</p></div></div><footer class="screen__footer">${button(t("start"), "next")}${button(t("login"), "noop", "quiet")}</footer></section>`;
  }

  function onboarding(kind) {
    const config = {
      ui: { n: 1, title: t("chooseUi"), sub: t("chooseUiSub"), items: [["pl", "Polski", "Język interfejsu", "🇵🇱"], ["en", "English", "Interface language", "🇬🇧"], ["th", "ไทย", "ภาษาของแอป", "🇹🇭"]], value: state.locale, action: "locale-choice" },
      course: { n: 2, title: t("chooseCourse"), sub: t("chooseCourseSub"), items: [["en", t("english"), t("enDesc"), "🇬🇧"], ["th", t("thai"), t("thaiDesc"), "🇹🇭"]], value: state.course, action: "course-choice" },
      goal: { n: 3, title: t("chooseGoal"), sub: t("chooseGoalSub"), items: [["work", t("work"), t("workSub"), "💼"], ["travel", t("travel"), t("travelSub"), "✈️"], ["talk", t("talk"), t("talkSub"), "💬"]], value: state.goal, action: "goal-choice" },
      time: { n: 4, title: t("chooseTime"), sub: t("chooseTimeSub"), items: [["5", t("min5"), t("light"), "◷"], ["10", t("min10"), t("recommended"), "◷"], ["15", t("min15"), t("regular"), "◷"]], value: state.time, action: "time-choice" },
    }[kind];
    return `<section class="screen">${status()}${backHeader(config.title)}${step(config.n)}<div class="screen__body"><p class="subtitle">${config.sub}</p><div class="choice-list">${config.items.map(i => choice(i[0], i[1], i[2], i[3], i[0] === config.value, config.action)).join("")}</div></div><footer class="screen__footer">${button(t("next"), "next")}</footer></section>`;
  }

  function testScreen() {
    const answer = (id, label) => `<button type="button" class="answer ${state.checked && id === "a" ? "is-correct" : ""}" data-action="answer" data-value="${id}" aria-pressed="${state.answer === id}">${label}</button>`;
    return `<section class="screen">${status()}${backHeader(t("testTitle"))}${step(5)}<div class="screen__body"><p class="subtitle">${t("testSub")}</p><div class="word-card"><p class="exercise-prompt">${t("question")}</p><span class="word-card__word">Could I have the menu?</span></div><div class="answer-grid">${answer("a",t("answerA"))}${answer("b",t("answerB"))}${answer("c",t("answerC"))}</div>${state.checked ? `<div class="feedback" role="status">✓ ${t("correct")}</div>` : ""}</div><footer class="screen__footer">${button(state.checked ? t("next") : t("check"), state.checked ? "finish-test" : "check", "primary", state.answer ? "" : "disabled")}${button(t("skip"), "finish-test", "quiet")}</footer></section>`;
  }

  function shell(active, body, title = "") {
    return `<section class="screen">${status()}${title ? `<div class="screen__header"><h1 tabindex="-1">${title}</h1></div>` : ""}<div class="screen__body">${body}</div>${nav(active)}</section>`;
  }

  function today() {
    const body = `<div class="greeting"><div class="greeting__copy"><small>${t("hello")}</small><strong tabindex="-1">${t("name")}</strong></div><span class="streak">🔥 ${t("streak")}</span></div>${courseSwitch()}<article class="plan-card"><div class="plan-card__meta"><span>${t("planToday")}</span><span>◷ ${t("approx")}</span></div><h2>${state.course === "en" ? t("planEn") : t("planTh")}</h2><p>${t("planDesc")}</p>${button(t("beginLearning") + " →", "start-lesson", "coral")}</article><div class="mini-grid"><article class="card"><span class="card__icon" aria-hidden="true">↻</span><h2>${t("review")}</h2><p>${t("reviewSub")}</p></article><article class="card"><span class="card__icon" aria-hidden="true">◎</span><h2>${t("weekly")}</h2><p>${t("weeklySub")}</p></article></div><button type="button" class="scenario" data-route="tutor"><span class="scenario__icon">✦</span><span><strong>${t("aiShortcut")}</strong><small>${t("aiShortcutSub")}</small></span></button>`;
    return shell("today", body);
  }

  function courseSwitch() {
    return `<div class="course-switch" role="group" aria-label="Course"><button type="button" data-action="switch-course" data-value="en" aria-pressed="${state.course === "en"}">🇬🇧 ${t("english")}</button><button type="button" data-action="switch-course" data-value="th" aria-pressed="${state.course === "th"}">🇹🇭 ${t("thai")}</button></div>`;
  }

  function learn() {
    const lessons = [t("lesson1"),t("lesson2"),t("lesson3")].map((x,i) => `<button type="button" class="lesson-card" data-action="start-lesson"><span class="lesson-card__number">${i+1}</span><span class="lesson-card__copy"><strong>${x}</strong><small>${t("lessonMeta")}</small></span><span aria-hidden="true">›</span></button>`).join("");
    return shell("learn", `<p class="subtitle">${t("learnSub")}</p>${courseSwitch()}<div class="lesson-list">${lessons}</div>`, t("learnTitle"));
  }

  function lesson() {
    const a = (id,key) => `<button type="button" class="answer ${state.checked && id === "a" ? "is-correct" : ""}" data-action="answer" data-value="${id}" aria-pressed="${state.answer === id}">${t(key)}</button>`;
    const sheet = state.overlay === "dictionary" ? `<div class="sheet-backdrop" role="presentation"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="dict-title"><div class="sheet__head"><h2 id="dict-title" tabindex="-1">${t("dictTitle")}</h2><button type="button" class="icon-button" data-action="close-sheet" aria-label="${t("close")}">×</button></div><p class="sheet__word">Could I have the menu?</p><p class="sheet__translation">${t("dictMeaning")}</p><p class="sheet__context">${t("dictContext")}</p><div class="sheet__audio"><button type="button" data-action="audio">▶ ${t("sourceAudio")}</button><button type="button" data-action="audio">▶ ${t("translationAudio")}</button></div>${button(t("saveReview"),"save-review","secondary")}</section></div>` : "";
    return `<section class="screen">${status()}${backHeader(t("exercise"),"close-lesson")}<div class="progress-line" role="progressbar" aria-label="100%"><span style="width:100%"></span></div><div class="screen__body"><p class="exercise-prompt">${t("exercisePrompt")}</p><div class="word-card"><span class="word-card__word">Could I have the menu?</span><span class="word-card__hint">/kʊd aɪ hæv ðə ˈmenjuː/</span><button type="button" class="audio-button" data-action="audio" aria-label="${t("listen")}">▶</button><br><button type="button" class="button button--quiet" data-action="dictionary">${t("dictionary")}</button></div><div class="answer-grid">${a("a","answerA")}${a("b","answerB")}${a("c","answerC")}</div>${state.checked ? `<div class="feedback" role="status">✓ ${t("correct")}</div>` : ""}</div><footer class="screen__footer">${button(state.checked ? t("finish") : t("check"), state.checked ? "finish-lesson" : "check", "primary", state.answer ? "" : "disabled")}</footer>${sheet}</section>`;
  }

  function result() {
    return `<section class="screen">${status()}${backHeader(t("resultTitle"),"go-today")}<div class="screen__body"><div class="result-hero"><span class="result-hero__icon" aria-hidden="true">✓</span><h2>${t("resultTitle")}</h2><p>${t("resultSub")}</p></div><div class="metric-row"><div class="metric"><strong>100%</strong><small>${t("accuracy")}</small></div><div class="metric"><strong>3</strong><small>${t("words")}</small></div><div class="metric"><strong>4:12</strong><small>${t("time")}</small></div></div><article class="card" style="margin-top:12px"><h3>${t("nextStep")}</h3><p>${t("nextStepSub")}</p></article></div><footer class="screen__footer">${button(t("goTutor"),"go-tutor")}${button(t("backToday"),"go-today","quiet")}</footer></section>`;
  }

  function tutor() {
    const scenario = (symbol,key,sub) => `<button type="button" class="scenario" data-action="scenario"><span class="scenario__icon">${symbol}</span><span><strong>${t(key)}</strong><small>${t(sub)}</small></span><span aria-hidden="true">›</span></button>`;
    return shell("tutor", `<p class="subtitle">${t("tutorSub")}</p><div class="trust-note">✦ ${t("limitLeft")}</div>${scenario("☕","cafe","cafeSub")}${scenario("◌","meeting","meetingSub")}${scenario("⌂","hotel","hotelSub")}`, t("tutorTitle"));
  }

  function tutorSetup() {
    return `<section class="screen">${status()}${backHeader(t("setupTitle"),"go-tutor")}<div class="screen__body"><p class="eyebrow">${t("scenario")}</p>${choice("cafe",t("cafe"),t("cafeSub"),"☕",true,"noop")}<p class="eyebrow" style="margin-top:22px">${t("correctionMode")}</p>${choice("each",t("correctionMode"),t("recommended"),"✓",true,"noop")}<div class="trust-note" role="note">ⓘ ${t("aiTrust")}</div></div><footer class="screen__footer">${button(t("startChat"),"start-chat")}</footer></section>`;
  }

  function chat() {
    return `<section class="screen">${status()}${backHeader(t("chatTitle"),"go-tutor")}<div class="screen__body"><div class="chat"><div class="bubble"><span class="bubble__role">${t("aiRole")}</span>${t("aiHello")}</div><div class="bubble bubble--user">${t("userMsg")}</div><div class="correction"><strong>✎ ${t("correction")}</strong><span>${t("correctionText")}</span><br><span class="confidence">${t("confidence")}</span></div><div class="bubble"><span class="bubble__role">${t("aiRole")}</span>${t("aiReply")}<br><button type="button" class="button button--quiet" data-action="report">⚑ ${t("report")}</button></div></div></div><footer class="screen__footer"><div class="composer"><label class="sr-only" for="chat-input">${t("placeholder")}</label><input id="chat-input" maxlength="900" placeholder="${t("placeholder")}"/><button type="button" class="send" data-action="send" aria-label="${t("send")}">➤</button></div></footer></section>`;
  }

  function progress() {
    const bars = [45,75,58,92,68,35,80].map(h => `<span class="bar" style="height:${h}%"></span>`).join("");
    return shell("progress", `<p class="subtitle">${t("progressSub")}</p>${courseSwitch()}<article class="card"><h2>${t("thisWeek")}</h2><div class="progress-chart" aria-label="Weekly activity chart">${bars}</div></article><div class="metric-row"><div class="metric"><strong>42</strong><small>${t("minutes")}</small></div><div class="metric"><strong>4</strong><small>${t("lessons")}</small></div><div class="metric"><strong>18</strong><small>${t("mastered")}</small></div></div><article class="card" style="margin-top:12px"><h3>${t("nextStep")}</h3><p>${t("nextStepSub")}</p></article>`, t("progressTitle"));
  }

  function profile() {
    const row = (symbol,key,sub="") => `<div class="setting-row"><span aria-hidden="true">${symbol}</span><div><strong>${t(key)}</strong>${sub ? `<small>${sub}</small>` : ""}</div><span aria-hidden="true">›</span></div>`;
    return shell("profile", `<div class="setting-list">${row("◉","account")}${row("文","languages",`${t("english")} · Polski`)}${row("Aa","accessibility")}${row("◈","privacy")}${row("⇩","export")}${row("ก","translit",t("on"))}</div>`, t("profileTitle"));
  }

  function stateView(kind) {
    const map = {
      empty: ["○","stateEmpty","stateEmptySub","goLessons","go-lessons"], offline: ["⌁","stateOffline","stateOfflineSub","retry","restore"], error: ["!","stateError","stateErrorSub","retry","restore"], limit: ["◴","stateLimit","stateLimitSub","goLessons","go-lessons"], session: ["⌛","stateSession","stateSessionSub","signIn","restore"],
    };
    if (kind === "loading") return `<section class="screen">${status()}<div class="state-panel"><div class="skeleton" aria-hidden="true"><span></span><span></span><span></span></div><h1>${t("stateLoading")}</h1><p>${t("stateLoadingSub")}</p></div></section>`;
    const [symbol,title,sub,cta,action] = map[kind];
    return `<section class="screen">${status()}<div class="state-panel"><div class="state-panel__icon" aria-hidden="true">${symbol}</div><h1 tabindex="-1">${t(title)}</h1><p>${t(sub)}</p>${button(t(cta),action)}</div></section>`;
  }

  function render() {
    const routes = { welcome, ui: () => onboarding("ui"), course: () => onboarding("course"), goal: () => onboarding("goal"), time: () => onboarding("time"), test: testScreen, today, learn, lesson, result, tutor, "tutor-setup": tutorSetup, chat, progress, profile };
    app.innerHTML = state.viewState === "content" ? (routes[state.route] || today)() : stateView(state.viewState);
    document.documentElement.lang = state.locale;
    device.className = `device device--${state.platform} ${state.scale === "2" ? "text-200" : ""}`;
    document.documentElement.style.setProperty("--type-scale", state.scale);
    routeLabel.textContent = state.viewState === "content" ? state.route : `state:${state.viewState}`;
    document.querySelectorAll("[data-setting]").forEach(el => {
      const key = el.dataset.setting;
      if (el.tagName === "BUTTON") el.setAttribute("aria-pressed", String(String(state[key]) === el.dataset.value));
      if (el.tagName === "SELECT") el.value = state[key];
    });
    const focusTarget = state.overlay
      ? app.querySelector("#dict-title")
      : state.restoreFocus
        ? app.querySelector(`[data-action="${state.restoreFocus}"]`)
        : app.querySelector("h1[tabindex='-1'], [tabindex='-1']");
    focusTarget?.focus({ preventScroll: true });
    if (!state.overlay) state.restoreFocus = null;
  }

  const nextRoutes = { welcome: "ui", ui: "course", course: "goal", goal: "time", time: "test" };
  const backRoutes = { ui: "welcome", course: "ui", goal: "course", time: "goal", test: "time" };

  document.addEventListener("click", (event) => {
    const setting = event.target.closest("button[data-setting]");
    if (setting) { state[setting.dataset.setting] = setting.dataset.value; render(); return; }
    const route = event.target.closest("[data-route]");
    if (route) { state.route = route.dataset.route; state.viewState = "content"; render(); return; }
    const el = event.target.closest("[data-action]");
    if (!el || el.disabled) return;
    const action = el.dataset.action;
    if (action === "reset") Object.assign(state, { route:"welcome", locale:"pl", platform:"ios", scale:"1", viewState:"content", course:"en", goal:"work", time:"10", answer:null, checked:false, overlay:null, restoreFocus:null });
    else if (action === "next") state.route = nextRoutes[state.route] || "today";
    else if (action === "back") state.route = backRoutes[state.route] || "today";
    else if (action === "locale-choice") state.locale = el.dataset.value;
    else if (action === "course-choice" || action === "switch-course") state.course = el.dataset.value;
    else if (action === "goal-choice") state.goal = el.dataset.value;
    else if (action === "time-choice") state.time = el.dataset.value;
    else if (action === "answer") { state.answer = el.dataset.value; state.checked = false; }
    else if (action === "check") state.checked = true;
    else if (action === "finish-test" || action === "go-today" || action === "close-lesson") { state.route = "today"; state.answer = null; state.checked = false; }
    else if (action === "start-lesson" || action === "go-lessons") { state.route = action === "go-lessons" ? "learn" : "lesson"; state.answer = null; state.checked = false; state.viewState = "content"; }
    else if (action === "finish-lesson") state.route = "result";
    else if (action === "go-tutor") state.route = "tutor";
    else if (action === "scenario") state.route = "tutor-setup";
    else if (action === "start-chat") state.route = "chat";
    else if (action === "restore") state.viewState = "content";
    else if (action === "dictionary") { state.overlay = "dictionary"; state.restoreFocus = "dictionary"; }
    else if (action === "close-sheet" || action === "save-review") state.overlay = null;
    else if (["audio","report","send"].includes(action)) app.setAttribute("aria-label", action === "report" ? t("report") : "OK");
    render();
  });

  document.querySelector("#state-selector").addEventListener("change", (event) => { state.viewState = event.target.value; render(); });
  document.addEventListener("keydown", (event) => {
    if (!state.overlay) return;
    if (event.key === "Escape") { state.overlay = null; render(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...app.querySelectorAll(".sheet button:not([disabled]), .sheet [tabindex]:not([tabindex='-1'])")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  render();
})();
