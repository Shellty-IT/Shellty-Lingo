import type {
  CourseLanguage,
  ListeningAttemptResponse,
  ListeningChallenge,
} from "@shellty/api-contracts";

interface ChallengeDefinition extends ListeningChallenge {
  correctOptionId: string;
  explanation: string;
}

const challenges: ChallengeDefinition[] = [
  {
    id: "en-cafe-polite-request",
    language: "en",
    level: "A1",
    title: "At the café",
    instruction: "Listen and choose the sentence you hear.",
    audio: {
      text: "Could I have a cup of tea, please?",
      locale: "en-GB",
      rate: 0.82,
    },
    options: [
      { id: "a", text: "Could I have a cup of tea, please?" },
      { id: "b", text: "Can I see the dinner menu?" },
      { id: "c", text: "I would like a glass of water." },
    ],
    correctOptionId: "a",
    explanation: "The polite request uses “Could I have…?”",
  },
  {
    id: "en-station-platform",
    language: "en",
    level: "A2",
    title: "At the station",
    instruction: "Listen for the platform number.",
    audio: {
      text: "The train to Bristol leaves from platform fourteen.",
      locale: "en-GB",
      rate: 0.86,
    },
    options: [
      { id: "a", text: "Platform four" },
      { id: "b", text: "Platform fourteen" },
      { id: "c", text: "Platform forty" },
    ],
    correctOptionId: "b",
    explanation: "Fourteen has stress on the second syllable: four-TEEN.",
  },
  {
    id: "th-cafe-order",
    language: "th",
    level: "A1",
    title: "สั่งเครื่องดื่ม",
    instruction: "ฟังแล้วเลือกประโยคที่ได้ยิน",
    audio: {
      text: "ขอกาแฟหนึ่งแก้วครับ",
      locale: "th-TH",
      rate: 0.76,
    },
    options: [
      { id: "a", text: "ขอน้ำหนึ่งแก้วค่ะ" },
      { id: "b", text: "ขอกาแฟหนึ่งแก้วครับ" },
      { id: "c", text: "ขอชาเย็นสองแก้วครับ" },
    ],
    correctOptionId: "b",
    explanation: "กาแฟ means coffee and หนึ่งแก้ว means one cup.",
  },
  {
    id: "th-greeting",
    language: "th",
    level: "A1",
    title: "ทักทาย",
    instruction: "ฟังคำทักทายแล้วเลือกคำตอบ",
    audio: {
      text: "สวัสดีครับ ยินดีที่ได้รู้จัก",
      locale: "th-TH",
      rate: 0.74,
    },
    options: [
      { id: "a", text: "สวัสดีครับ ยินดีที่ได้รู้จัก" },
      { id: "b", text: "ขอบคุณมากครับ" },
      { id: "c", text: "แล้วพบกันใหม่ครับ" },
    ],
    correctOptionId: "a",
    explanation: "ยินดีที่ได้รู้จัก means “nice to meet you”.",
  },
];

export function listeningChallenges(
  language: CourseLanguage,
): ListeningChallenge[] {
  return challenges
    .filter((challenge) => challenge.language === language)
    .map((challenge) => ({
      id: challenge.id,
      language: challenge.language,
      level: challenge.level,
      title: challenge.title,
      instruction: challenge.instruction,
      audio: challenge.audio,
      options: challenge.options,
    }));
}

export function gradeListeningChallenge(
  challengeId: string,
  optionId: string,
): ListeningAttemptResponse | null {
  const challenge = challenges.find((item) => item.id === challengeId);
  if (!challenge || !challenge.options.some((option) => option.id === optionId))
    return null;
  const siblings = challenges.filter(
    (item) => item.language === challenge.language,
  );
  const position = siblings.findIndex((item) => item.id === challenge.id);
  return {
    challengeId,
    correct: optionId === challenge.correctOptionId,
    transcript: challenge.audio.text,
    explanation: challenge.explanation,
    nextChallengeId: siblings[position + 1]?.id ?? null,
  };
}
