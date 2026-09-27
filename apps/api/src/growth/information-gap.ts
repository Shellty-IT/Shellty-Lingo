import type {
  ConversationScenario,
  CourseLanguage,
} from "@shellty/api-contracts";

export const INFORMATION_GAP_ID = "information-gap-meeting-a2";
export const informationGapScenarios: Record<
  CourseLanguage,
  ConversationScenario
> = {
  en: {
    id: INFORMATION_GAP_ID,
    category: "everyday",
    title: "Find a meeting time",
    description:
      "Ask for the information you need and agree on a meeting time.",
    briefing:
      "Private partner information: I am available only at four o'clock on Tuesday. The meeting must last thirty minutes. Reveal each fact only when the learner asks about that fact. Never invent other availability.",
    learnerRole:
      "You can meet on Tuesday at three or four. You have forty-five minutes. Ask about my availability and the required duration, then confirm a suitable time.",
    objectives: [
      "Ask when the partner is available.",
      "Ask how long the meeting should last.",
      "Agree on Tuesday at four for thirty minutes.",
    ],
    openingLine: "Let's arrange our meeting. What would you like to know?",
    role: "meeting partner",
    level: "A2",
    estimatedMinutes: 5,
  },
  th: {
    id: INFORMATION_GAP_ID,
    category: "everyday",
    title: "นัดเวลาพบกัน",
    description: "ถามข้อมูลที่จำเป็นและตกลงเวลาพบกัน",
    briefing:
      "ข้อมูลส่วนตัวของคู่สนทนา: ว่างวันอังคารตอนสี่โมงเท่านั้น ต้องการประชุมสามสิบนาที เปิดเผยข้อมูลแต่ละอย่างเมื่อผู้เรียนถามเกี่ยวกับเรื่องนั้นเท่านั้น อย่าสร้างเวลาว่างอื่น",
    learnerRole:
      "คุณว่างวันอังคารตอนสามโมงหรือสี่โมง และมีเวลาสี่สิบห้านาที ถามว่าอีกฝ่ายว่างเมื่อไรและต้องการประชุมนานเท่าไร แล้วตกลงเวลา",
    objectives: [
      "ถามว่าอีกฝ่ายว่างเมื่อไร",
      "ถามระยะเวลาประชุม",
      "ตกลงวันอังคารตอนสี่โมงเป็นเวลาสามสิบนาที",
    ],
    openingLine: "มานัดเวลาประชุมกัน คุณอยากทราบอะไร",
    role: "คู่สนทนา",
    level: "A2",
    estimatedMinutes: 5,
  },
};
export function publicScenario(
  scenario: ConversationScenario,
): ConversationScenario {
  if (scenario.id !== INFORMATION_GAP_ID) return scenario;
  return {
    ...scenario,
    briefing: scenario.learnerRole,
    objectives:
      scenario.level === "A2" && /[ก-๙]/u.test(scenario.title)
        ? ["ถามเวลาและระยะเวลาที่อีกฝ่ายต้องการ", "ตกลงเวลาที่ทั้งสองฝ่ายสะดวก"]
        : [
            "Ask about availability and duration.",
            "Agree on a time that works for both partners.",
          ],
  };
}

export function informationGapReply(
  language: CourseLanguage,
  learnerText: string,
): string {
  if (language === "th") {
    if (/นาน|กี่นาที|ระยะเวลา/u.test(learnerText))
      return "ต้องการประชุมสามสิบนาที";
    if (/เมื่อไร|วันไหน|กี่โมง|ว่าง/u.test(learnerText))
      return "ฉันว่างวันอังคารตอนสี่โมงเท่านั้น";
    if (/อังคาร/u.test(learnerText) && /สี่โมง/u.test(learnerText))
      return "ตกลง เจอกันวันอังคารตอนสี่โมง";
    return "คุณอยากถามเรื่องเวลาว่างหรือระยะเวลาประชุม";
  }
  if (/how long|duration|minutes|length/iu.test(learnerText))
    return "The meeting needs to last thirty minutes.";
  if (/when|what time|available|availability|which day/iu.test(learnerText))
    return "I am only available on Tuesday at four o'clock.";
  if (/tuesday/iu.test(learnerText) && /four|4/iu.test(learnerText))
    return "Agreed. Let's meet on Tuesday at four.";
  return "Would you like to ask about my availability or the meeting duration?";
}
