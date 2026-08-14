import type {
  InterfaceLocale,
  PlacementQuestion,
} from "@shellty/api-contracts";

type Localized = Record<InterfaceLocale, string>;

export type AssessmentQuestion = PlacementQuestion & {
  correct: string;
};

export type LocalizedAssessmentQuestion = {
  id: string;
  skill: PlacementQuestion["skill"];
  prompt: Localized;
  options: Array<{ id: string; text: string }>;
  correct: string;
  audioText?: string;
};

const l = (pl: string, en: string): Localized => ({ pl, en, th: en });
const q = (
  id: string,
  skill: PlacementQuestion["skill"],
  correct: string,
  pl: string,
  en: string,
  values: string[],
  audioText?: string,
): LocalizedAssessmentQuestion => ({
  id,
  skill,
  correct,
  prompt: l(pl, en),
  options: values.map((text, index) => ({
    id: String.fromCharCode(97 + index),
    text,
  })),
  ...(audioText ? { audioText } : {}),
});

export const upperEnglishPlacementQuestions: LocalizedAssessmentQuestion[] = [
  q(
    "en-b2-grammar-1",
    "grammar",
    "b",
    "Uzupełnij zdanie: Rarely ___ such a well-structured proposal.",
    "Complete the sentence: Rarely ___ such a well-structured proposal.",
    ["I have seen", "have I seen", "I saw", "did I seeing"],
  ),
  q(
    "en-b2-grammar-2",
    "grammar",
    "c",
    "Uzupełnij zdanie: If we had tested it earlier, we ___ this issue now.",
    "Complete the sentence: If we had tested it earlier, we ___ this issue now.",
    ["didn't have", "won't have", "wouldn't have", "wouldn't have had"],
  ),
  q(
    "en-b2-grammar-3",
    "grammar",
    "d",
    "Wybierz poprawną formę: By next June, she ___ here for ten years.",
    "Choose the correct form: By next June, she ___ here for ten years.",
    ["works", "will work", "has worked", "will have been working"],
  ),
  q(
    "en-b2-grammar-4",
    "grammar",
    "a",
    "Przekształć mowę zależną: He said, ‘I may be late.’",
    "Choose the correct reported-speech form: He said, ‘I may be late.’",
    [
      "He said he might be late.",
      "He said he may was late.",
      "He said I might be late.",
      "He told that he late.",
    ],
  ),
  q(
    "en-b2-grammar-5",
    "grammar",
    "c",
    "Wybierz naturalną konstrukcję bezosobową.",
    "Choose the natural impersonal passive construction.",
    [
      "People believe the plan to fail.",
      "It believes that the plan will work.",
      "The plan is believed to be feasible.",
      "The plan believes feasible.",
    ],
  ),
  q(
    "en-b2-grammar-6",
    "grammar",
    "b",
    "Wybierz właściwe przypuszczenie o przeszłości.",
    "Choose the correct deduction about the past.",
    [
      "She must forget the meeting.",
      "She must have forgotten the meeting.",
      "She must to have forgotten the meeting.",
      "She has must forgotten the meeting.",
    ],
  ),
  q(
    "en-b2-vocabulary-1",
    "vocabulary",
    "a",
    "Co oznacza słowo „feasible” w opisie planu?",
    "What does “feasible” mean when describing a plan?",
    [
      "practical and possible",
      "very expensive",
      "already cancelled",
      "unclear",
    ],
  ),
  q(
    "en-b2-vocabulary-2",
    "vocabulary",
    "c",
    "Wybierz najbliższe znaczenie słowa „comprehensive”.",
    "Choose the closest meaning of “comprehensive”.",
    ["temporary", "controversial", "complete and detailed", "easy to ignore"],
  ),
  q(
    "en-b2-vocabulary-3",
    "vocabulary",
    "b",
    "Jeśli ktoś jest „reluctant”, to…",
    "If someone is “reluctant”, they are…",
    [
      "eager to act",
      "unwilling or hesitant",
      "fully prepared",
      "unable to speak",
    ],
  ),
  q(
    "en-b2-vocabulary-4",
    "vocabulary",
    "d",
    "Co znaczy, że korzyści „outweigh” ryzyko?",
    "What does it mean when the benefits “outweigh” the risks?",
    ["hide them", "equal them exactly", "create them", "are greater than them"],
  ),
  q(
    "en-b2-vocabulary-5",
    "vocabulary",
    "a",
    "Wybierz poprawne znaczenie czasownika „allocate”.",
    "Choose the correct meaning of the verb “allocate”.",
    [
      "assign resources for a purpose",
      "remove a deadline",
      "reject evidence",
      "repeat a mistake",
    ],
  ),
  q(
    "en-b2-vocabulary-6",
    "vocabulary",
    "c",
    "Jeśli instrukcja jest „ambiguous”, jest…",
    "If an instruction is “ambiguous”, it is…",
    [
      "legally binding",
      "easy to measure",
      "open to more than one interpretation",
      "written by hand",
    ],
  ),
  q(
    "en-b2-listening-1",
    "listening",
    "b",
    "Posłuchaj wypowiedzi i wybierz jej sens.",
    "Listen and choose what the speaker means.",
    [
      "The deadline cannot change.",
      "The deadline may change if the client agrees.",
      "The client has already rejected the work.",
      "The project has been cancelled.",
    ],
    "We could push the deadline back, provided the client signs off on it.",
  ),
  q(
    "en-b2-listening-2",
    "listening",
    "c",
    "Posłuchaj i wskaż główny problem.",
    "Listen and identify the main problem.",
    [
      "The team lacks technical skills.",
      "The budget has been reduced.",
      "Requirements keep changing.",
      "The release has already succeeded.",
    ],
    "We are making progress, but the constantly shifting requirements are slowing us down.",
  ),
  q(
    "en-b2-listening-3",
    "listening",
    "a",
    "Posłuchaj i wybierz właściwy wniosek.",
    "Listen and choose the correct conclusion.",
    [
      "The speaker is not fully convinced.",
      "The speaker strongly supports the proposal.",
      "The speaker has not read the proposal.",
      "The proposal has been approved.",
    ],
    "I can see the appeal of the proposal, although I'm not entirely convinced by the figures.",
  ),
  q(
    "en-b2-listening-4",
    "listening",
    "d",
    "Posłuchaj i wybierz parafrazę.",
    "Listen and choose the best paraphrase.",
    [
      "The issue was impossible to predict.",
      "No action is needed.",
      "Only management caused the issue.",
      "Better monitoring could have revealed the issue sooner.",
    ],
    "Had we monitored the service more closely, we might have spotted the issue earlier.",
  ),
  q(
    "en-b2-listening-5",
    "listening",
    "b",
    "Posłuchaj i rozpoznaj intencję mówiącego.",
    "Listen and identify the speaker's intention.",
    [
      "to reject all feedback",
      "to disagree politely",
      "to end the meeting",
      "to request technical support",
    ],
    "I take your point, but I wonder whether we're underestimating the implementation cost.",
  ),
  q(
    "en-b2-listening-6",
    "listening",
    "a",
    "Posłuchaj i wybierz, co stanie się dalej.",
    "Listen and choose what will happen next.",
    [
      "The release will proceed after one final check.",
      "The release has been cancelled permanently.",
      "Testing will start next month.",
      "The team will skip the security review.",
    ],
    "Assuming the security review comes back clean, we'll go ahead with the release tonight.",
  ),
];

export const c1ExamQuestions: LocalizedAssessmentQuestion[] = [
  q(
    "c1-grammar-1",
    "grammar",
    "b",
    "Uzupełnij: Not until the audit was complete ___ the scale of the issue.",
    "Complete: Not until the audit was complete ___ the scale of the issue.",
    [
      "we understood",
      "did we understand",
      "we did understand",
      "had we understanding",
    ],
  ),
  q(
    "c1-grammar-2",
    "grammar",
    "c",
    "Wybierz poprawne zdanie emfatyczne.",
    "Choose the correct cleft sentence.",
    [
      "What I need it is more evidence.",
      "It more evidence that I need.",
      "What I need is more compelling evidence.",
      "That I need is evidence more.",
    ],
  ),
  q(
    "c1-grammar-3",
    "grammar",
    "a",
    "Wybierz formalną konstrukcję po czasowniku „recommend”.",
    "Choose the formal construction after “recommend”.",
    [
      "They recommended that the proposal be revised.",
      "They recommended that the proposal was revised.",
      "They recommended the proposal to revised.",
      "They recommended revise the proposal.",
    ],
  ),
  q(
    "c1-grammar-4",
    "grammar",
    "d",
    "Uzupełnij zdanie imiesłowowe: ___ all the evidence, the panel postponed its decision.",
    "Complete the participle clause: ___ all the evidence, the panel postponed its decision.",
    [
      "Not review",
      "Having not reviewed",
      "Not having review",
      "Not having reviewed",
    ],
  ),
  q(
    "c1-grammar-5",
    "grammar",
    "b",
    "Wybierz poprawną inwersję warunkową.",
    "Choose the correct conditional inversion.",
    [
      "Would I have known, I acted.",
      "Had I known, I would have acted differently.",
      "Have I known, I would act.",
      "Did I known, I had acted.",
    ],
  ),
  q(
    "c1-grammar-6",
    "grammar",
    "c",
    "Wybierz właściwą ocenę przeszłego działania.",
    "Choose the correct criticism of a past action.",
    [
      "You needn't submit it yesterday.",
      "You shouldn't submit it yesterday.",
      "You needn't have submitted it so early.",
      "You hadn't need submit it.",
    ],
  ),
  q(
    "c1-grammar-7",
    "grammar",
    "a",
    "Wybierz najbardziej zwięzłą nominalizację.",
    "Choose the most concise nominalisation.",
    [
      "The rapid implementation of the policy caused concern.",
      "The policy was implemented rapidly and this caused people to be concerned about it.",
      "Implementing was rapidly concerning policy.",
      "Concern caused implementation rapid.",
    ],
  ),
  q(
    "c1-grammar-8",
    "grammar",
    "d",
    "Uzupełnij formalny kontrast: The approach is costly; ___, it offers significant long-term savings.",
    "Complete the formal contrast: The approach is costly; ___, it offers significant long-term savings.",
    ["therefore", "otherwise", "similarly", "nevertheless"],
  ),

  q(
    "c1-vocabulary-1",
    "vocabulary",
    "b",
    "Co oznacza „ubiquitous”?",
    "What does “ubiquitous” mean?",
    [
      "carefully hidden",
      "present everywhere",
      "recently invented",
      "legally restricted",
    ],
  ),
  q(
    "c1-vocabulary-2",
    "vocabulary",
    "a",
    "Wybierz najbliższe znaczenie „mitigate”.",
    "Choose the closest meaning of “mitigate”.",
    [
      "make less severe",
      "prove beyond doubt",
      "postpone indefinitely",
      "describe in detail",
    ],
  ),
  q(
    "c1-vocabulary-3",
    "vocabulary",
    "c",
    "Czym jest „discrepancy” w raporcie?",
    "What is a “discrepancy” in a report?",
    [
      "a final recommendation",
      "a supporting quotation",
      "an inconsistency between facts or figures",
      "a confidential appendix",
    ],
  ),
  q(
    "c1-vocabulary-4",
    "vocabulary",
    "d",
    "Jeśli argument jest „compelling”, jest…",
    "If an argument is “compelling”, it is…",
    [
      "deliberately vague",
      "impossible to verify",
      "unnecessarily long",
      "highly convincing",
    ],
  ),
  q(
    "c1-vocabulary-5",
    "vocabulary",
    "b",
    "Co oznacza „tentative agreement”?",
    "What does “tentative agreement” mean?",
    [
      "a legally final decision",
      "a provisional agreement that may change",
      "an openly hostile response",
      "a detailed written complaint",
    ],
  ),
  q(
    "c1-vocabulary-6",
    "vocabulary",
    "a",
    "Wybierz znaczenie „inadvertently”.",
    "Choose the meaning of “inadvertently”.",
    [
      "unintentionally",
      "with great precision",
      "in public",
      "after careful negotiation",
    ],
  ),
  q(
    "c1-vocabulary-7",
    "vocabulary",
    "c",
    "Jeśli rozwiązanie jest „viable”, to…",
    "If a solution is “viable”, it is…",
    [
      "theoretically interesting but impossible",
      "already obsolete",
      "capable of working successfully",
      "free from all risk",
    ],
  ),
  q(
    "c1-vocabulary-8",
    "vocabulary",
    "d",
    "Co oznacza „a nuanced assessment”?",
    "What is “a nuanced assessment”?",
    [
      "a one-sided judgement",
      "a numerical estimate only",
      "an emotional reaction",
      "a judgement that recognises subtle distinctions",
    ],
  ),

  q(
    "c1-reading-1",
    "reading",
    "b",
    "Przeczytaj: ‘The policy appears efficient on paper; in practice, however, it shifts the burden onto smaller teams.’ Jaki jest stosunek autora?",
    "Read: ‘The policy appears efficient on paper; in practice, however, it shifts the burden onto smaller teams.’ What is the writer's attitude?",
    [
      "unreservedly positive",
      "cautiously critical",
      "completely indifferent",
      "openly amused",
    ],
  ),
  q(
    "c1-reading-2",
    "reading",
    "c",
    "Przeczytaj: ‘Far from resolving the dispute, the announcement intensified it.’ Co się wydarzyło?",
    "Read: ‘Far from resolving the dispute, the announcement intensified it.’ What happened?",
    [
      "The dispute ended immediately.",
      "The announcement was cancelled.",
      "The situation became more serious.",
      "Both sides ignored the announcement.",
    ],
  ),
  q(
    "c1-reading-3",
    "reading",
    "a",
    "Przeczytaj: ‘The findings should be treated with caution, given the relatively narrow sample.’ Co ogranicza wnioski?",
    "Read: ‘The findings should be treated with caution, given the relatively narrow sample.’ What limits the conclusions?",
    [
      "the small range of participants",
      "the age of the researchers",
      "the lack of any findings",
      "the cost of publication",
    ],
  ),
  q(
    "c1-reading-4",
    "reading",
    "d",
    "Przeczytaj: ‘While not without merit, the proposal fails to address the underlying cause.’ Jaki jest główny zarzut?",
    "Read: ‘While not without merit, the proposal fails to address the underlying cause.’ What is the main criticism?",
    [
      "It contains no useful ideas.",
      "It is too expensive to read.",
      "It has already been implemented.",
      "It deals with symptoms rather than the root problem.",
    ],
  ),
  q(
    "c1-reading-5",
    "reading",
    "b",
    "Przeczytaj: ‘Demand has levelled off, albeit at a historically high point.’ Co to znaczy?",
    "Read: ‘Demand has levelled off, albeit at a historically high point.’ What does it mean?",
    [
      "Demand is falling rapidly.",
      "Demand is stable but remains unusually high.",
      "Demand has never been lower.",
      "Demand is impossible to measure.",
    ],
  ),
  q(
    "c1-reading-6",
    "reading",
    "a",
    "Przeczytaj: ‘The concession was less an admission of error than an attempt to restore trust.’ Jaki był główny cel?",
    "Read: ‘The concession was less an admission of error than an attempt to restore trust.’ What was its main purpose?",
    [
      "to rebuild confidence",
      "to accept full blame",
      "to introduce a new policy",
      "to delay negotiations",
    ],
  ),
  q(
    "c1-reading-7",
    "reading",
    "c",
    "Przeczytaj: ‘The evidence is persuasive, though by no means conclusive.’ Jak mocne są dowody?",
    "Read: ‘The evidence is persuasive, though by no means conclusive.’ How strong is the evidence?",
    ["worthless", "definitive", "convincing but not final", "fabricated"],
  ),
  q(
    "c1-reading-8",
    "reading",
    "d",
    "Przeczytaj: ‘Only once the system was placed under sustained load did the flaw become apparent.’ Kiedy ujawniono wadę?",
    "Read: ‘Only once the system was placed under sustained load did the flaw become apparent.’ When was the flaw discovered?",
    [
      "during initial design",
      "before any testing",
      "after the system was replaced",
      "during prolonged heavy use",
    ],
  ),

  q(
    "c1-listening-1",
    "listening",
    "c",
    "Posłuchaj i rozpoznaj zastrzeżenie mówiącego.",
    "Listen and identify the speaker's reservation.",
    [
      "The evidence is irrelevant.",
      "The proposal is too short.",
      "The conclusion may go beyond what the data supports.",
      "The research was never completed.",
    ],
    "The data is certainly suggestive, but I'm wary of drawing such a sweeping conclusion from it.",
  ),
  q(
    "c1-listening-2",
    "listening",
    "a",
    "Posłuchaj i wybierz najlepszą parafrazę.",
    "Listen and choose the best paraphrase.",
    [
      "The plan will work only if departments cooperate.",
      "The plan has already failed.",
      "Departments have no role in the plan.",
      "Cooperation will delay the plan.",
    ],
    "The plan is sound in principle, but its success hinges on close cooperation across departments.",
  ),
  q(
    "c1-listening-3",
    "listening",
    "d",
    "Posłuchaj i określ intencję.",
    "Listen and identify the speaker's intention.",
    [
      "to accept the deadline",
      "to cancel the project",
      "to blame a colleague",
      "to challenge whether the deadline is realistic",
    ],
    "With all due respect, I think we need to revisit the assumption that this can be delivered by Friday.",
  ),
  q(
    "c1-listening-4",
    "listening",
    "b",
    "Posłuchaj i wybierz, co sugeruje mówiący.",
    "Listen and choose what the speaker implies.",
    [
      "The change was entirely successful.",
      "The improvement created an unexpected disadvantage.",
      "The system is now slower in every situation.",
      "No users noticed the change.",
    ],
    "Although the change improved reliability, it came at the expense of a noticeably slower response time.",
  ),
  q(
    "c1-listening-5",
    "listening",
    "a",
    "Posłuchaj i wskaż główny argument.",
    "Listen and identify the main argument.",
    [
      "Waiting may cost more than acting with limited information.",
      "No decision should ever be made quickly.",
      "More data is already available.",
      "The current policy has no cost.",
    ],
    "We may not have perfect information, but postponing the decision carries its own, potentially greater, cost.",
  ),
  q(
    "c1-listening-6",
    "listening",
    "c",
    "Posłuchaj i określ stanowisko mówiącego.",
    "Listen and identify the speaker's position.",
    [
      "strong approval",
      "complete rejection",
      "qualified support",
      "no opinion",
    ],
    "I'm broadly in favour, provided we build in a review after the first six months.",
  ),
  q(
    "c1-listening-7",
    "listening",
    "d",
    "Posłuchaj i wybierz ukryty wniosek.",
    "Listen and choose the implied conclusion.",
    [
      "The launch was early.",
      "The product needed no research.",
      "Users preferred every feature.",
      "Better user research might have prevented some problems.",
    ],
    "In hindsight, several of the issues we encountered after launch were already visible in the user interviews.",
  ),
  q(
    "c1-listening-8",
    "listening",
    "b",
    "Posłuchaj i rozpoznaj funkcję wypowiedzi.",
    "Listen and identify the function of the statement.",
    [
      "making a promise",
      "softening a criticism before giving it",
      "requesting permission",
      "summarising a legal contract",
    ],
    "I don't want to dismiss the work that's gone into this, but the central assumption still needs stronger evidence.",
  ),
];

export const localizeAssessmentQuestion = (
  question: LocalizedAssessmentQuestion,
  locale: InterfaceLocale,
): AssessmentQuestion => ({
  id: question.id,
  skill: question.skill,
  prompt: question.prompt[locale],
  options: question.options,
  correct: question.correct,
  ...(question.audioText ? { audioText: question.audioText } : {}),
});

const randomFromSeed = (seed: number): (() => number) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
};

export const c1ExamQuestionsFor = (
  locale: InterfaceLocale,
  seed: number,
): AssessmentQuestion[] => {
  const random = randomFromSeed(seed);
  return c1ExamQuestions
    .map((question) => localizeAssessmentQuestion(question, locale))
    .map((question) => ({
      ...question,
      options: [...question.options]
        .map((option) => ({ option, order: random() }))
        .sort((left, right) => left.order - right.order)
        .map(({ option }) => option),
    }))
    .map((question) => ({ question, order: random() }))
    .sort((left, right) => left.order - right.order)
    .map(({ question }) => question);
};
