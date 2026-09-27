import { expect, it } from "vitest";

import { learningTracks } from "../../prisma/learning-tracks";
import { gradeExercise } from "./learning-engine";
import { orderingParts } from "./ordering-parts";

it("keeps authored phrases together with authored spelling", () => {
  const options = [
    { id: "w1", text: "Based on these findings," },
    { id: "w2", text: "the report recommends" },
    { id: "w3", text: "a phased implementation" },
    { id: "w4", text: "over the next six months." },
  ];

  expect(
    orderingParts(options, { correct: options.map((part) => part.id) }),
  ).toEqual([
    { id: "w1", text: "Based on these findings," },
    { id: "w2", text: "the report recommends" },
    { id: "w3", text: "a phased implementation" },
    { id: "w4", text: "over the next six months." },
  ]);
});

it("combines legacy single word options into a few selectable parts", () => {
  const options = "We can send the updated report to your team tomorrow."
    .split(" ")
    .map((text, index) => ({ id: `w${index + 1}`, text }));
  const parts = orderingParts(options, {
    correct: options.map((part) => part.id),
  });

  expect(parts.map((part) => part.text)).toEqual([
    "We can send",
    "the updated report",
    "to your team tomorrow.",
  ]);
  expect(parts.map((part) => part.text).join(" ")).toBe(
    "We can send the updated report to your team tomorrow.",
  );
  expect(parts.map((part) => part.id)).toEqual([
    "ordering-part-1",
    "ordering-part-2",
    "ordering-part-3",
  ]);
});

it("restores natural phrases for the report sentence stored as individual words", () => {
  const options =
    "Based on these findings, the report recommends a phased implementation over the next six months."
      .split(" ")
      .map((text, index) => ({ id: `w${index + 1}`, text }));

  expect(
    orderingParts(options, { correct: options.map((part) => part.id) }).map(
      (part) => part.text,
    ),
  ).toEqual([
    "Based on these findings,",
    "the report recommends",
    "a phased implementation",
    "over the next six months.",
  ]);
});

it("preserves authored Thai phrases without relying on spaces between words", () => {
  const options = [
    "ก่อนดำเนินการ",
    "เราต้องประเมิน",
    "ผลกระทบ",
    "และข้อจำกัด",
  ].map((text, index) => ({ id: `w${index + 1}`, text }));
  expect(
    orderingParts(options, { correct: options.map((part) => part.id) }),
  ).toEqual(options);
});

it("does not leave a one-word remainder in short generated sentences", () => {
  const options = "They will bring it soon."
    .split(" ")
    .map((text, index) => ({ id: `w${index + 1}`, text }));

  expect(
    orderingParts(options, { correct: options.map((part) => part.id) }).map(
      (part) => part.text,
    ),
  ).toEqual(["They will bring", "it soon."]);
});

it("joins isolated words in older authored exercises", () => {
  const options = [
    { id: "w1", text: "The main risk" },
    { id: "w2", text: "is" },
    { id: "w3", text: "the delayed" },
    { id: "w4", text: "client feedback." },
  ];

  expect(
    orderingParts(options, { correct: options.map((part) => part.id) }),
  ).toEqual([
    { id: "ordering-part-1", text: "The main risk is" },
    { id: "w3", text: "the delayed" },
    { id: "w4", text: "client feedback." },
  ]);
});

it("keeps punctuation that is part of a time value", () => {
  expect(
    orderingParts(
      [
        { id: "a", text: "The next train leaves" },
        { id: "b", text: "from platform six" },
        { id: "c", text: "at 8:15." },
      ],
      { correct: ["a", "b", "c"] },
    ).map((part) => part.text),
  ).toEqual(["The next train leaves", "from platform six", "at 8:15."]);
});

it("keeps the same answer IDs when option labels are localized", () => {
  const options = ["We", "will", "send", "the", "report", "tomorrow."].map(
    (text, index) => ({ id: `w${index + 1}`, text }),
  );
  const answer = { correct: options.map((part) => part.id) };
  const localized = options.map((part) => ({
    id: part.id,
    text: `Translated ${part.text}`,
  }));

  expect(
    orderingParts(options, answer, localized).map((part) => part.id),
  ).toEqual(orderingParts(options, answer).map((part) => part.id));
});

it("only hides spelling clues through an explicit authored display label", () => {
  const options = [
    {
      id: "a",
      text: "I use C++ in the U.S.",
      displayText: "I use C++ in the U.S.",
    },
    { id: "b", text: "Every day.", displayText: "every day" },
  ];
  expect(orderingParts(options, { correct: ["a", "b"] })).toEqual([
    { id: "a", text: "I use C++ in the U.S." },
    { id: "b", text: "every day" },
  ]);
});

it("does not group mixed-script Thai chunks using English boundaries", () => {
  const options = ["ใช้", "IT", "ใน", "องค์กร"].map((text, index) => ({
    id: String(index),
    text,
  }));
  expect(
    orderingParts(
      options,
      { correct: options.map((item) => item.id) },
      undefined,
      "th",
    ),
  ).toEqual(options);
});

it("renders and grades every published track ordering task with intact text", () => {
  let checked = 0;
  const lettersOnly = (text: string) => text.replace(/\s/gu, "");

  for (const track of learningTracks)
    for (const module of track.modules)
      for (const lesson of module.lessons)
        for (const exercise of lesson.exercises) {
          if (exercise.type !== "ordering") continue;
          const label = `${track.slug}/${lesson.slug}`;
          const options = exercise.options ?? [];
          const correct = (exercise.answer as { correct: string[] }).correct;
          const byId = new Map(
            options.map((option) => [option.id, option.text]),
          );
          const parts = orderingParts(options, exercise.answer);
          checked += 1;

          expect(new Set(options.map((option) => option.id)).size, label).toBe(
            options.length,
          );
          expect(correct.length, label).toBe(options.length);
          expect(parts.length, label).toBeGreaterThanOrEqual(2);
          expect(parts.length, label).toBeLessThanOrEqual(4);
          expect(new Set(parts.map((part) => part.text)).size, label).toBe(
            parts.length,
          );
          expect(
            lettersOnly(parts.map((part) => part.text).join("")),
            label,
          ).toBe(lettersOnly(correct.map((id) => byId.get(id) ?? "").join("")));
          for (const part of parts) {
            if (track.language === "en")
              expect(
                part.text.split(/\s+/).length,
                label,
              ).toBeGreaterThanOrEqual(2);
          }
          const ids = parts.map((part) => part.id);
          expect(
            gradeExercise("ordering", { correct: ids }, ids).correct,
            label,
          ).toBe(true);
        }

  expect(checked).toBe(40);
});
