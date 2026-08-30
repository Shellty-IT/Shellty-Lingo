import type { CourseLanguage } from "@shellty/api-contracts";

import type { AiTurnRequest } from "./ai-provider";

interface DialogueStep {
  prompt: string;
  coveredBy: RegExp;
  askedBy?: RegExp;
}

interface DialogueReaction {
  matches: RegExp;
  text: string;
}

interface DialogueFact {
  matches: RegExp;
  text: string;
}

interface FallbackDialogue {
  steps: DialogueStep[];
  reactions?: DialogueReaction[];
  facts?: DialogueFact[];
  completedText?: string;
}

const englishDialogues: Record<string, FallbackDialogue> = {
  cafe: {
    steps: [
      {
        prompt: "What size would you like?",
        coveredBy: /\b(small|medium|large|regular|single|double)\b/i,
      },
      {
        prompt: "Would you like regular milk or oat milk?",
        coveredBy: /\b(oat|milk|ingredient|allerg|extra|charge|cost|price)\b/i,
      },
      {
        prompt: "Will you have it here or take it away?",
        coveredBy: /\b(here|take[ -]?away|to go)\b/i,
      },
    ],
    reactions: [
      {
        matches: /\b(espresso|cappuccino|coffee|tea|drink)\b/i,
        text: "Certainly, I can prepare that for you.",
      },
      {
        matches: /\b(food|eat|snack|cake|sandwich)\b/i,
        text: "Food is available until 3 p.m.",
      },
    ],
    facts: [
      {
        matches:
          /\b(espresso).{0,20}\b(price|cost|much)\b|\b(price|cost|much).{0,20}\bespresso\b/i,
        text: "An espresso costs £2.50.",
      },
      {
        matches:
          /\b(cappuccino).{0,20}\b(price|cost|much)\b|\b(price|cost|much).{0,20}\bcappuccino\b/i,
        text: "A cappuccino costs £3.80.",
      },
      {
        matches:
          /\b(tea).{0,20}\b(price|cost|much)\b|\b(price|cost|much).{0,20}\btea\b/i,
        text: "Tea costs £2.20.",
      },
      {
        matches: /\b(oat milk|extra charge|extra cost)\b/i,
        text: "Oat milk costs 50p extra.",
      },
      {
        matches: /\b(food|eat|kitchen|served)\b/i,
        text: "Food is served until 3 p.m.",
      },
    ],
    completedText: "Great, I have everything I need for your order.",
  },
  hotel: {
    steps: [
      {
        prompt: "What name is the reservation under?",
        coveredBy:
          /\b(alex|nowak|my name|under the name|reservation is under)\b/i,
      },
      {
        prompt: "How many nights will you be staying?",
        coveredBy:
          /\b(two|2|one|1|three|3|four|4)\s+nights?\b|\bnight(?:s)?\b/i,
      },
      {
        prompt: "Would you like to know about breakfast, Wi-Fi, or checkout?",
        coveredBy: /\b(breakfast|wi[ -]?fi|internet|check[ -]?out)\b/i,
      },
    ],
    reactions: [
      {
        matches: /\b(have|made|confirm).{0,24}\breservation\b|\breservation\b/i,
        text: "Of course—let's check your reservation.",
      },
      {
        matches: /\b(two|2)\s+nights?\b/i,
        text: "Perfect, I have confirmed the two-night stay.",
      },
      {
        matches: /\b(alex|nowak)\b/i,
        text: "Thank you, I found the reservation.",
      },
    ],
    facts: [
      {
        matches: /\b(breakfast)\b/i,
        text: "Breakfast is served from 7 to 10 a.m.",
      },
      {
        matches: /\b(wi[ -]?fi|internet)\b/i,
        text: "Wi-Fi is included in the room price.",
      },
      {
        matches: /\b(check[ -]?out|leave the room)\b/i,
        text: "Checkout is at 11 a.m.",
      },
      {
        matches: /\b(single room|room type)\b/i,
        text: "The reservation is for a single room.",
      },
    ],
    completedText:
      "That's everything needed for check-in. Your room is ready; enjoy your stay.",
  },
  "business-status": {
    steps: [
      {
        prompt: "What is the most important result you have completed so far?",
        coveredBy:
          /\b(complete|completed|finished|done|integration|code review)\b/i,
      },
      {
        prompt: "Is anything blocking the next step?",
        coveredBy: /\b(block|blocked|delay|late|risk|sandbox|supplier)\b/i,
      },
      {
        prompt: "What should the team agree on today?",
        coveredBy: /\b(should|recommend|need|next step|tester|agree|plan)\b/i,
      },
    ],
    reactions: [
      {
        matches: /\b(integration|complete|finished|done)\b/i,
        text: "Good, that gives us a clear view of the completed work.",
      },
      {
        matches: /\b(delay|late|risk|block|sandbox)\b/i,
        text: "Thanks for making the risk explicit.",
      },
    ],
    facts: [
      {
        matches: /\b(launch|deadline|when|friday)\b/i,
        text: "The mobile checkout launch is planned for Friday.",
      },
    ],
    completedText:
      "Thanks, that is a clear status update and next-step proposal.",
  },
  "it-support-a1": {
    steps: [
      {
        prompt: "What happens when you try to sign in?",
        coveredBy:
          /\b(lock|locked|cannot|can't|error|e401|sign in|log in|login)\b/i,
      },
      {
        prompt: "Do you see an error message?",
        coveredBy: /\b(e401|error|message|code)\b/i,
      },
      {
        prompt: "Have you already tried resetting your password?",
        coveredBy: /\b(reset|password|link|expired|tried)\b/i,
      },
    ],
    reactions: [
      {
        matches: /\b(e401|locked|cannot|can't|login|log in|sign in)\b/i,
        text: "I understand the login problem.",
      },
      {
        matches: /\b(reset|expired)\b/i,
        text: "Thanks, that tells me what you have already tried.",
      },
    ],
    facts: [
      {
        matches: /\b(email|verify|identity)\b/i,
        text: "We can verify your identity through your company email.",
      },
    ],
    completedText: "Thank you. I can now help unlock the account securely.",
  },
  "it-sprint-a2": {
    steps: [
      {
        prompt: "What did you complete yesterday?",
        coveredBy:
          /\b(yesterday|finished|completed|login screen|code review)\b/i,
      },
      {
        prompt: "Do you have any blockers today?",
        coveredBy: /\b(block|blocked|documentation|docs|authentication api)\b/i,
      },
      {
        prompt: "What will you work on next?",
        coveredBy: /\b(today|next|test|tests|will work|plan)\b/i,
      },
    ],
    reactions: [
      {
        matches: /\b(login screen|code review|finished|completed)\b/i,
        text: "Great, that progress is clear.",
      },
      {
        matches: /\b(block|documentation|docs)\b/i,
        text: "Thanks, the blocker is clear.",
      },
    ],
    completedText:
      "Good update. The team now knows your progress, blocker, and next task.",
  },
  "it-incident-b1": {
    steps: [
      {
        prompt: "Which users or services are affected?",
        coveredBy: /\b(18%|customers?|checkout|eu|payment|affected|impact)\b/i,
        askedBy:
          /\b(impact update|what is affected|users or services are affected)\b/i,
      },
      {
        prompt: "What mitigation is already in place?",
        coveredBy: /\b(rollback|mitigation|recover|falling|09:32)\b/i,
      },
      {
        prompt: "What should the 10:00 customer update say?",
        coveredBy:
          /\b(10:00|customer update|tell customers|communicat|status page)\b/i,
      },
    ],
    reactions: [
      {
        matches: /\b(18%|customers?|checkout|eu|payment|affected)\b/i,
        text: "That keeps the focus on affected customers.",
      },
      {
        matches: /\b(rollback|mitigation|recover|falling)\b/i,
        text: "Good, the mitigation and current recovery are clear.",
      },
    ],
    facts: [
      {
        matches:
          /\b(when|time|next).{0,20}\b(update)\b|\bupdate.{0,20}\bwhen\b/i,
        text: "The next customer update is due at 10:00.",
      },
    ],
    completedText:
      "That covers the impact, mitigation, and customer communication.",
  },
  "business-negotiation-b2": {
    steps: [
      {
        prompt: "Which constraint has the greatest impact on the agreement?",
        coveredBy:
          /\b(price|budget|support|delivery|constraint|48,?000|45,?000|month)\b/i,
      },
      {
        prompt: "What conditional offer could address that concern?",
        coveredBy: /\b(if|provided|condition|offer|could agree|in exchange)\b/i,
      },
      {
        prompt: "Where do you see room for compromise?",
        coveredBy:
          /\b(compromise|meet halfway|accept|agree|18 months|september)\b/i,
      },
    ],
    reactions: [
      {
        matches: /\b(budget|price|support|delivery)\b/i,
        text: "That constraint is clear.",
      },
      {
        matches: /\b(if|provided|condition|offer)\b/i,
        text: "That is a concrete conditional offer.",
      },
    ],
    facts: [
      {
        matches: /\b(budget|limit)\b/i,
        text: "The buyer's budget limit is €45,000.",
      },
      {
        matches: /\b(support|months?)\b/i,
        text: "The supplier offers 12 months of support, while the team needs 18 months.",
      },
    ],
    completedText: "We now have a workable basis for an agreement.",
  },
  "it-architecture-b2": {
    steps: [
      {
        prompt: "Why did you choose an event queue?",
        coveredBy:
          /\b(event queue|resilien|traffic spike|asynchronous|decoupl)\b/i,
      },
      {
        prompt: "Which trade-off had the greatest influence on that decision?",
        coveredBy:
          /\b(trade[ -]?off|latency|delay|complex|30 seconds|operation)\b/i,
      },
      {
        prompt: "How does the design behave when fulfilment is unavailable?",
        coveredBy: /\b(fail|unavailable|outage|retry|queue|buffer)\b/i,
      },
    ],
    reactions: [
      {
        matches: /\b(event queue|resilien|traffic spike|decoupl)\b/i,
        text: "That explains the design choice clearly.",
      },
      {
        matches: /\b(latency|delay|complex|trade[ -]?off)\b/i,
        text: "Good, you have identified the main trade-off.",
      },
    ],
    facts: [
      {
        matches: /\b(how long|latency|delay)\b/i,
        text: "The queue can delay updates by up to 30 seconds.",
      },
    ],
    completedText:
      "That covers the design rationale, trade-offs, and failure mode.",
  },
};

const thaiDialogues: Record<string, FallbackDialogue> = {
  cafe: {
    steps: [
      { prompt: "ต้องการขนาดไหนครับ/คะ", coveredBy: /เล็ก|กลาง|ใหญ่|ขนาด/u },
      { prompt: "ต้องการนมโอ๊ตเพิ่มไหมครับ/คะ", coveredBy: /นม|โอ๊ต|เพิ่ม/u },
      {
        prompt: "รับที่ร้านหรือกลับบ้านครับ/คะ",
        coveredBy: /ที่ร้าน|กลับบ้าน/u,
      },
    ],
    completedText: "ขอบคุณครับ/ค่ะ รายการสั่งซื้อครบแล้ว",
  },
  market: {
    steps: [
      {
        prompt: "ต้องการซื้ออะไรและจำนวนเท่าไรครับ/คะ",
        coveredBy: /กิโล|ลูก|ชิ้น|เอา|ซื้อ/u,
      },
      {
        prompt: "ต้องการถามราคาสินค้าชิ้นไหนครับ/คะ",
        coveredBy: /ราคา|บาท|เท่าไร/u,
      },
      {
        prompt: "ขอสรุปรายการที่ต้องการอีกครั้งได้ไหมครับ/คะ",
        coveredBy: /ทั้งหมด|สรุป|รวม/u,
      },
    ],
    completedText: "ขอบคุณครับ/ค่ะ รายการซื้อขายครบแล้ว",
  },
  "business-status": {
    steps: [
      {
        prompt: "งานส่วนไหนเสร็จแล้วบ้างครับ/คะ",
        coveredBy: /เสร็จ|เรียบร้อย|สำเร็จ/u,
      },
      {
        prompt: "ตอนนี้มีความเสี่ยงหรืออุปสรรคอะไรครับ/คะ",
        coveredBy: /เสี่ยง|ปัญหา|ล่าช้า|อุปสรรค/u,
      },
      {
        prompt: "คุณแนะนำขั้นตอนถัดไปอย่างไรครับ/คะ",
        coveredBy: /ขั้นตอน|แนะนำ|ควร|ต่อไป/u,
      },
    ],
    completedText: "ขอบคุณครับ/ค่ะ ข้อมูลสถานะและขั้นตอนถัดไปชัดเจนแล้ว",
  },
  "it-support-a1": {
    steps: [
      {
        prompt: "ตอนเข้าสู่ระบบเกิดอะไรขึ้นครับ/คะ",
        coveredBy: /เข้า|ล็อก|ระบบ|ไม่ได้/u,
      },
      {
        prompt: "เห็นรหัสหรือข้อความผิดพลาดอะไรครับ/คะ",
        coveredBy: /รหัส|ข้อความ|ผิดพลาด|E401/iu,
      },
      {
        prompt: "ลองรีเซ็ตรหัสผ่านแล้วหรือยังครับ/คะ",
        coveredBy: /รีเซ็ต|รหัสผ่าน|ลิงก์/u,
      },
    ],
    completedText: "ขอบคุณครับ/ค่ะ ตอนนี้มีข้อมูลพอที่จะช่วยปลดล็อกบัญชีแล้ว",
  },
  "it-sprint-a2": {
    steps: [
      {
        prompt: "เมื่อวานทำงานอะไรเสร็จแล้วบ้างครับ/คะ",
        coveredBy: /เมื่อวาน|เสร็จ|หน้าล็อกอิน/u,
      },
      {
        prompt: "วันนี้มีอุปสรรคอะไรไหมครับ/คะ",
        coveredBy: /อุปสรรค|ติด|เอกสาร|API/iu,
      },
      {
        prompt: "งานถัดไปที่คุณจะทำคืออะไรครับ/คะ",
        coveredBy: /ถัดไป|วันนี้|ทดสอบ/u,
      },
    ],
    completedText: "ขอบคุณครับ/ค่ะ ความคืบหน้า อุปสรรค และงานถัดไปชัดเจนแล้ว",
  },
  "it-incident-b1": {
    steps: [
      {
        prompt: "ลูกค้าหรือบริการส่วนใดได้รับผลกระทบครับ/คะ",
        coveredBy: /ลูกค้า|checkout|ยุโรป|ผลกระทบ|18%/iu,
      },
      {
        prompt: "ตอนนี้ใช้วิธีใดลดผลกระทบอยู่ครับ/คะ",
        coveredBy: /rollback|ย้อนกลับ|แก้ไข|ฟื้น/u,
      },
      {
        prompt: "ข้อความอัปเดตลูกค้าเวลา 10:00 ควรระบุอะไรครับ/คะ",
        coveredBy: /10:00|อัปเดต|แจ้งลูกค้า/u,
      },
    ],
    completedText: "ขอบคุณครับ/ค่ะ ข้อมูลผลกระทบ การแก้ไข และการสื่อสารครบแล้ว",
  },
};

const repeatedMessage =
  /\b(asked|said|question).{0,24}\b(before|again|already)\b|\brepeat(?:ed|ing)?\b/i;
const informationQuestion =
  /[?]$|^(what|which|when|where|who|why|how|can|could|is|are|do|does|tell me|explain)\b/i;
const shortFollowUp =
  /^(and|and then|what else|anything else|so|then)\s*[?.!]*$/i;

export function deterministicDialogueText(request: AiTurnRequest): string {
  const dialogue = dialogueFor(request.language, request.scenarioId);
  const learnerText = request.learnerText.trim();
  const nextPrompt = dialogue
    ? nextUnfinishedPrompt(request, dialogue)
    : undefined;

  let response: string;
  if (request.language === "en" && repeatedMessage.test(learnerText)) {
    response = "You're right—I repeated that. Let's move to a different point.";
  } else {
    const facts = dialogue?.facts
      ?.filter((fact) => fact.matches.test(learnerText))
      .map((fact) => fact.text);
    if (facts?.length) response = [...new Set(facts)].join(" ");
    else if (request.language === "en" && shortFollowUp.test(learnerText))
      response = nextPrompt
        ? "Certainly—let's continue."
        : (dialogue?.completedText ?? "Certainly. What else can I help with?");
    else {
      const reaction = dialogue?.reactions?.find((item) =>
        item.matches.test(learnerText),
      );
      if (reaction) response = reaction.text;
      else if (
        request.language === "en" &&
        informationQuestion.test(learnerText)
      )
        response = relevantBriefingAnswer(request);
      else
        response =
          request.language === "th"
            ? "เข้าใจแล้วครับ/ค่ะ ขอบคุณสำหรับข้อมูล"
            : "Thank you, I've noted that.";
    }
  }

  if (!nextPrompt || response.includes(nextPrompt)) return response;
  return `${response} ${nextPrompt}`;
}

function dialogueFor(
  language: CourseLanguage,
  scenarioId: string,
): FallbackDialogue | undefined {
  return language === "th"
    ? thaiDialogues[scenarioId]
    : englishDialogues[scenarioId];
}

function nextUnfinishedPrompt(
  request: AiTurnRequest,
  dialogue: FallbackDialogue,
): string | undefined {
  const learnerHistory = [
    ...request.recentMessages
      .filter((message) => message.role === "learner")
      .map((message) => message.text),
    request.learnerText,
  ].join(" ");
  const assistantHistory = request.recentMessages
    .filter((message) => message.role === "assistant")
    .map((message) => normalize(message.text));

  return dialogue.steps.find(
    (step) =>
      !step.coveredBy.test(learnerHistory) &&
      !assistantHistory.some(
        (message) =>
          message.includes(normalize(step.prompt)) ||
          step.askedBy?.test(message),
      ),
  )?.prompt;
}

function relevantBriefingAnswer(request: AiTurnRequest): string {
  const words = new Set(
    request.learnerText
      .toLocaleLowerCase()
      .match(/[a-z]{3,}/g)
      ?.filter((word) => !fallbackStopWords.has(word)) ?? [],
  );
  const candidates = request.scenarioBriefing
    .split(/(?<=[.!?])\s+/u)
    .filter(Boolean)
    .map((sentence) => ({
      sentence,
      score: [...words].filter((word) =>
        sentence.toLocaleLowerCase().includes(word),
      ).length,
    }))
    .sort((left, right) => right.score - left.score);
  const best = candidates[0];
  if (!best || best.score === 0)
    return "I don't have that detail in this scenario.";
  return best.sentence;
}

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

const fallbackStopWords = new Set([
  "about",
  "after",
  "again",
  "asked",
  "before",
  "could",
  "does",
  "everything",
  "have",
  "should",
  "that",
  "their",
  "there",
  "they",
  "this",
  "what",
  "when",
  "which",
  "with",
  "would",
  "your",
]);
