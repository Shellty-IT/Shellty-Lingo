import type { CourseLanguage, InterfaceLocale } from "@shellty/api-contracts";

import type { PlacementBankQuestion } from "./placement-bank";

type Localized = Record<InterfaceLocale, string>;

const localized = (pl: string, en: string, th: string): Localized => ({
  pl,
  en,
  th,
});

const option = (
  id: string,
  text: string,
): PlacementBankQuestion["options"][number] => ({
  id,
  text: localized(text, text, text),
});

const readingQuestion = (
  id: string,
  correct: string,
  prompt: Localized,
  answers: [string, string, string, string],
): PlacementBankQuestion => ({
  id,
  skill: "reading",
  prompt,
  options: answers.map((answer, index) =>
    option(String.fromCharCode(97 + index), answer),
  ),
  correct,
});

export const placementReadingQuestions: Record<
  CourseLanguage,
  PlacementBankQuestion[]
> = {
  en: [
    readingQuestion(
      "en-reading-1",
      "b",
      localized(
        "Przeczytaj: ‘The help desk is open from 8:00 to 16:00. After 16:00, report urgent issues by phone.’ Jak zgłosić pilny problem o 17:00?",
        "Read: ‘The help desk is open from 8:00 to 16:00. After 16:00, report urgent issues by phone.’ How should you report an urgent issue at 17:00?",
        "อ่าน: ‘The help desk is open from 8:00 to 16:00. After 16:00, report urgent issues by phone.’ คุณควรรายงานปัญหาเร่งด่วนเวลา 17:00 อย่างไร",
      ),
      ["By email", "By phone", "The next morning", "In the office chat"],
    ),
    readingQuestion(
      "en-reading-2",
      "c",
      localized(
        "Przeczytaj: ‘Marta finished the report, but she has not sent it because the figures need checking.’ Dlaczego raport nie został wysłany?",
        "Read: ‘Marta finished the report, but she has not sent it because the figures need checking.’ Why has the report not been sent?",
        "อ่าน: ‘Marta finished the report, but she has not sent it because the figures need checking.’ เหตุใดจึงยังไม่ได้ส่งรายงาน",
      ),
      [
        "It is unfinished",
        "Marta is absent",
        "The figures need checking",
        "The client cancelled it",
      ],
    ),
    readingQuestion(
      "en-reading-3",
      "a",
      localized(
        "Przeczytaj: ‘The train leaves at 09:10. Please arrive at least fifteen minutes early.’ O której należy być na stacji najpóźniej?",
        "Read: ‘The train leaves at 09:10. Please arrive at least fifteen minutes early.’ What is the latest recommended arrival time?",
        "อ่าน: ‘The train leaves at 09:10. Please arrive at least fifteen minutes early.’ ควรมาถึงช้าที่สุดกี่โมง",
      ),
      ["08:55", "09:10", "09:15", "09:25"],
    ),
    readingQuestion(
      "en-reading-4",
      "d",
      localized(
        "Przeczytaj: ‘Although the café was busy, our order arrived quickly and the staff were helpful.’ Jaka jest ogólna opinia autora?",
        "Read: ‘Although the café was busy, our order arrived quickly and the staff were helpful.’ What is the writer’s overall opinion?",
        "อ่าน: ‘Although the café was busy, our order arrived quickly and the staff were helpful.’ ผู้เขียนมีความคิดเห็นโดยรวมอย่างไร",
      ),
      [
        "The café was closed",
        "The service was slow",
        "The staff were rude",
        "The experience was positive",
      ],
    ),
    readingQuestion(
      "en-reading-5",
      "b",
      localized(
        "Przeczytaj: ‘You can change your booking without a fee up to 24 hours before arrival.’ Kiedy zmiana jest bezpłatna?",
        "Read: ‘You can change your booking without a fee up to 24 hours before arrival.’ When is a change free?",
        "อ่าน: ‘You can change your booking without a fee up to 24 hours before arrival.’ เปลี่ยนการจองได้ฟรีเมื่อใด",
      ),
      [
        "Only after arrival",
        "At least 24 hours before arrival",
        "At any time after check-in",
        "Only seven days before arrival",
      ],
    ),
    readingQuestion(
      "en-b2-reading-1",
      "c",
      localized(
        "Przeczytaj: ‘The pilot reduced processing time, though the small sample means the findings should be treated cautiously.’ Co sugeruje autor?",
        "Read: ‘The pilot reduced processing time, though the small sample means the findings should be treated cautiously.’ What does the writer suggest?",
        "อ่าน: ‘The pilot reduced processing time, though the small sample means the findings should be treated cautiously.’ ผู้เขียนเสนอแนะอะไร",
      ),
      [
        "The pilot failed",
        "The findings are conclusive",
        "The result is promising but limited",
        "Processing time increased",
      ],
    ),
    readingQuestion(
      "en-b2-reading-2",
      "a",
      localized(
        "Przeczytaj: ‘Had the team tested the rollback earlier, the outage would probably have been shorter.’ Co wynika ze zdania?",
        "Read: ‘Had the team tested the rollback earlier, the outage would probably have been shorter.’ What is implied?",
        "อ่าน: ‘Had the team tested the rollback earlier, the outage would probably have been shorter.’ ประโยคนี้สื่อความหมายอะไร",
      ),
      [
        "The rollback was not tested early enough",
        "There was no outage",
        "The team tested too often",
        "The outage caused the rollback test",
      ],
    ),
    readingQuestion(
      "en-b2-reading-3",
      "d",
      localized(
        "Przeczytaj: ‘The proposal is technically sound; nevertheless, its long-term operating cost remains a concern.’ Jaki jest stosunek autora?",
        "Read: ‘The proposal is technically sound; nevertheless, its long-term operating cost remains a concern.’ What is the writer’s position?",
        "อ่าน: ‘The proposal is technically sound; nevertheless, its long-term operating cost remains a concern.’ จุดยืนของผู้เขียนคืออะไร",
      ),
      [
        "Completely opposed",
        "Unaware of the cost",
        "Certain there are no risks",
        "Supportive with a reservation",
      ],
    ),
    readingQuestion(
      "en-b2-reading-4",
      "b",
      localized(
        "Przeczytaj: ‘Only after the second audit did the company acknowledge the scale of the issue.’ Kiedy firma uznała skalę problemu?",
        "Read: ‘Only after the second audit did the company acknowledge the scale of the issue.’ When did the company acknowledge the scale of the issue?",
        "อ่าน: ‘Only after the second audit did the company acknowledge the scale of the issue.’ บริษัทรับทราบขนาดของปัญหาเมื่อใด",
      ),
      [
        "Before any audit",
        "After the second audit",
        "During the first audit",
        "Before the issue began",
      ],
    ),
  ],
  th: [
    readingQuestion(
      "th-reading-1",
      "a",
      localized(
        "Przeczytaj: ‘ร้านเปิดเก้าโมง’ O której otwiera się sklep?",
        "Read: ‘ร้านเปิดเก้าโมง’ What time does the shop open?",
        "อ่าน: ‘ร้านเปิดเก้าโมง’ ร้านเปิดกี่โมง",
      ),
      ["09:00", "08:00", "10:00", "12:00"],
    ),
    readingQuestion(
      "th-reading-2",
      "c",
      localized(
        "Przeczytaj: ‘วันนี้ฝนตก กรุณานำร่มมาด้วย’ Co należy zabrać?",
        "Read: ‘วันนี้ฝนตก กรุณานำร่มมาด้วย’ What should you bring?",
        "อ่าน: ‘วันนี้ฝนตก กรุณานำร่มมาด้วย’ ควรนำอะไรมา",
      ),
      ["A book", "A ticket", "An umbrella", "A laptop"],
    ),
    readingQuestion(
      "th-reading-3",
      "b",
      localized(
        "Przeczytaj: ‘ห้องประชุมอยู่ชั้นสอง’ Gdzie jest sala spotkań?",
        "Read: ‘ห้องประชุมอยู่ชั้นสอง’ Where is the meeting room?",
        "อ่าน: ‘ห้องประชุมอยู่ชั้นสอง’ ห้องประชุมอยู่ที่ไหน",
      ),
      [
        "On the first floor",
        "On the second floor",
        "Outside",
        "Next to the station",
      ],
    ),
    readingQuestion(
      "th-reading-4",
      "d",
      localized(
        "Przeczytaj: ‘กรุณาส่งรายงานภายในวันศุกร์’ Jaki jest termin raportu?",
        "Read: ‘กรุณาส่งรายงานภายในวันศุกร์’ When is the report due?",
        "อ่าน: ‘กรุณาส่งรายงานภายในวันศุกร์’ ต้องส่งรายงานเมื่อใด",
      ),
      ["Monday", "Tuesday", "Thursday", "Friday"],
    ),
    readingQuestion(
      "th-reading-5",
      "a",
      localized(
        "Przeczytaj: ‘ระบบจะปิดปรับปรุงตั้งแต่เที่ยงคืนถึงตีสอง’ Jak długo potrwa przerwa?",
        "Read: ‘ระบบจะปิดปรับปรุงตั้งแต่เที่ยงคืนถึงตีสอง’ How long is the maintenance window?",
        "อ่าน: ‘ระบบจะปิดปรับปรุงตั้งแต่เที่ยงคืนถึงตีสอง’ ระบบปิดปรับปรุงนานเท่าใด",
      ),
      ["Two hours", "One hour", "Three hours", "All day"],
    ),
    readingQuestion(
      "th-reading-6",
      "c",
      localized(
        "Przeczytaj: ‘ถ้าลืมรหัสผ่าน ให้กดลิงก์รีเซ็ตในอีเมล’ Co zrobić po zapomnieniu hasła?",
        "Read: ‘ถ้าลืมรหัสผ่าน ให้กดลิงก์รีเซ็ตในอีเมล’ What should you do if you forget the password?",
        "อ่าน: ‘ถ้าลืมรหัสผ่าน ให้กดลิงก์รีเซ็ตในอีเมล’ ควรทำอย่างไรเมื่อลืมรหัสผ่าน",
      ),
      [
        "Create a new server",
        "Call every user",
        "Use the reset link in the email",
        "Delete the account",
      ],
    ),
    readingQuestion(
      "th-reading-7",
      "b",
      localized(
        "Przeczytaj: ‘งานเสร็จแล้ว แต่ยังต้องตรวจสอบตัวเลข’ Co jeszcze trzeba zrobić?",
        "Read: ‘งานเสร็จแล้ว แต่ยังต้องตรวจสอบตัวเลข’ What still needs to be done?",
        "อ่าน: ‘งานเสร็จแล้ว แต่ยังต้องตรวจสอบตัวเลข’ ยังต้องทำอะไร",
      ),
      [
        "Start the work",
        "Check the figures",
        "Cancel the project",
        "Book a room",
      ],
    ),
    readingQuestion(
      "th-reading-8",
      "d",
      localized(
        "Przeczytaj: ‘แม้การอัปเดตจะล่าช้า แต่ลูกค้าไม่ได้รับผลกระทบ’ Co wynika z tekstu?",
        "Read: ‘แม้การอัปเดตจะล่าช้า แต่ลูกค้าไม่ได้รับผลกระทบ’ What does the text say?",
        "อ่าน: ‘แม้การอัปเดตจะล่าช้า แต่ลูกค้าไม่ได้รับผลกระทบ’ ข้อความกล่าวว่าอย่างไร",
      ),
      [
        "Customers cancelled the update",
        "The update was early",
        "All customers lost access",
        "The update was late but customers were unaffected",
      ],
    ),
    readingQuestion(
      "th-reading-9",
      "a",
      localized(
        "Przeczytaj: ‘ควรทดสอบระบบสำรองก่อนนำเวอร์ชันใหม่ขึ้นใช้งานจริง’ Co jest zalecane?",
        "Read: ‘ควรทดสอบระบบสำรองก่อนนำเวอร์ชันใหม่ขึ้นใช้งานจริง’ What is recommended?",
        "อ่าน: ‘ควรทดสอบระบบสำรองก่อนนำเวอร์ชันใหม่ขึ้นใช้งานจริง’ ควรทำอะไร",
      ),
      [
        "Test the backup system before release",
        "Remove all backups",
        "Release without testing",
        "Delay every update indefinitely",
      ],
    ),
  ],
};
