"use client";

import { useState } from "react";
import {
  pilotLessonIds,
  pilotPreview,
  type InterfaceLocale,
  type LearnerExercise,
} from "@shellty/api-contracts";
import { getCopy } from "@shellty/i18n";

function TaskPreview({
  exercise,
  locale,
}: {
  exercise: LearnerExercise;
  locale: InterfaceLocale;
}) {
  const copy = getCopy(locale);
  const [selected, setSelected] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  return (
    <section
      style={{
        margin: "1rem 0",
        padding: "1rem",
        background: "white",
        borderRadius: 12,
      }}
    >
      <h2>
        {exercise.position}. {exercise.instructions}
      </h2>
      <p style={{ whiteSpace: "pre-wrap" }}>{exercise.prompt}</p>
      {exercise.interaction ? (
        <p>
          {exercise.interaction.before}
          <strong>
            <u>{exercise.interaction.fragment}</u>
          </strong>
          {exercise.interaction.after}
        </p>
      ) : null}
      {exercise.type === "ordering" ? (
        <>
          <p>
            {copy.yourSentence}:{" "}
            {selected
              .map(
                (id) =>
                  exercise.options?.find((option) => option.id === id)?.text,
              )
              .join(" ")}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {exercise.options?.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected.includes(option.id)}
                onClick={() =>
                  setSelected((values) =>
                    values.includes(option.id)
                      ? values.filter((id) => id !== option.id)
                      : [...values, option.id],
                  )
                }
              >
                {option.text}
              </button>
            ))}
          </div>
        </>
      ) : exercise.type === "single_choice" ? (
        <fieldset>
          <legend>{copy.answerLabel}</legend>
          {exercise.options?.map((option) => (
            <label key={option.id} style={{ display: "block", padding: 12 }}>
              <input
                type="radio"
                name={exercise.id}
                checked={selected.includes(option.id)}
                onChange={() => setSelected([option.id])}
              />{" "}
              {option.text}
            </label>
          ))}
        </fieldset>
      ) : (
        <label>
          {copy.answerLabel}
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={exercise.type === "gap_fill" ? 2 : 4}
            style={{
              display: "block",
              width: "100%",
              font: "inherit",
              padding: 12,
            }}
          />
        </label>
      )}
    </section>
  );
}

/** Local editorial fixture preview. Imports and publication use authenticated API routes. */
export default function PilotsPage() {
  const [locale, setLocale] = useState<InterfaceLocale>("pl");
  const [id, setId] = useState(pilotLessonIds[0]!);
  const lesson = pilotPreview(id, locale)!;
  const copy = getCopy(locale);
  return (
    <main lang={locale} style={{ maxWidth: 840, margin: "auto", padding: 24 }}>
      <h1>{copy.pilotDraftNotice}</h1>
      <label>
        {copy.localeLabel}{" "}
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value as InterfaceLocale)}
        >
          <option value="pl">Polski</option>
          <option value="en">English</option>
          <option value="th">ไทย</option>
        </select>
      </label>
      <label style={{ display: "block", marginTop: 16 }}>
        {copy.lessons}{" "}
        <select value={id} onChange={(event) => setId(event.target.value)}>
          {pilotLessonIds.map((key) => (
            <option key={key} value={key}>
              {pilotPreview(key, locale)!.title} (
              {pilotPreview(key, locale)!.language.toUpperCase()})
            </option>
          ))}
        </select>
      </label>
      <h2>{lesson.title}</h2>
      {lesson.exercises.map((exercise) => (
        <TaskPreview
          key={`${locale}:${exercise.id}`}
          exercise={exercise}
          locale={locale}
        />
      ))}
    </main>
  );
}
