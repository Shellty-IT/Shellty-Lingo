"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SessionResponse } from "@shellty/api-contracts";

type Revision = {
  id: string;
  version: number;
  status: "draft" | "review" | "published" | "archived";
  title: string;
  summary: string | null;
  estimatedMinutes: number;
  reviewedAt: string | null;
  exercises: unknown[];
};

type Lesson = {
  id: string;
  slug: string;
  status: string;
  revisions: Revision[];
};

type Course = {
  id: string;
  slug: string;
  language: string;
  level: string;
  title: string;
  description: string | null;
  status: string;
  updatedAt: string;
  modules: Array<{
    id: string;
    slug: string;
    title: string;
    status: string;
    lessons: Lesson[];
  }>;
};

type ConversationReport = {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporter: { email: string };
  conversation: {
    scenarioId: string;
    userCourse: { language: string };
  };
};

type Health = {
  status: "ok" | "degraded";
  database: string;
  version: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

const apiError = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as {
      error?: { message?: string; correlationId?: string };
    };
    if (body.error?.message)
      return `${body.error.message}${
        body.error.correlationId ? ` (ID: ${body.error.correlationId})` : ""
      }`;
  } catch {
    // A stable fallback keeps upstream HTML errors out of the interface.
  }
  return `API zwróciło błąd ${response.status}.`;
};

const isStaffSession = (value: SessionResponse): boolean =>
  value.user.role === "editor" || value.user.role === "admin";

export default function Home() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const sessionRef = useRef<SessionResponse | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [reports, setReports] = useState<ConversationReport[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const rememberSession = (value: SessionResponse | null) => {
    sessionRef.current = value;
    setSession(value);
  };

  const perform = (path: string, accessToken: string, init: RequestInit = {}) =>
    fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        authorization: `Bearer ${accessToken}`,
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
    });

  const request = async <T,>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> => {
    let current = sessionRef.current;
    if (!current) throw new Error("Sesja wygasła. Zaloguj się ponownie.");
    let response = await perform(path, current.accessToken, init);
    if (response.status === 401) {
      const refreshed = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      if (!refreshed.ok) {
        rememberSession(null);
        throw new Error("Sesja wygasła. Zaloguj się ponownie.");
      }
      current = (await refreshed.json()) as SessionResponse;
      if (!isStaffSession(current)) {
        rememberSession(null);
        throw new Error("Konto nie ma dostępu do panelu.");
      }
      rememberSession(current);
      response = await perform(path, current.accessToken, init);
    }
    if (!response.ok) throw new Error(await apiError(response));
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  };

  const loadWorkspace = async () => {
    setBusy(true);
    setError(null);
    try {
      const [workspace, pendingReports] = await Promise.all([
        request<Course[]>("/content/admin/workspace"),
        request<ConversationReport[]>("/content/admin/conversation-reports"),
      ]);
      setCourses(workspace);
      setReports(pendingReports);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nieznany błąd.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void fetch(`${apiUrl}/health/ready`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setHealth((await response.json()) as Health);
      })
      .catch(() => setHealth(null));
  }, []);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error(await apiError(response));
      const next = (await response.json()) as SessionResponse;
      if (!isStaffSession(next)) {
        void fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ refreshToken: next.refreshToken }),
        });
        throw new Error("To konto nie ma roli editor ani admin.");
      }
      rememberSession(next);
      await loadWorkspace();
    } catch (reason) {
      rememberSession(null);
      setError(reason instanceof Error ? reason.message : "Nieznany błąd.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    const current = sessionRef.current;
    rememberSession(null);
    setCourses([]);
    setReports([]);
    if (current)
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      }).catch(() => undefined);
  };

  const workflow = async (
    revisionId: string,
    action: "submit" | "approve" | "return" | "publish",
  ) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const path =
      action === "submit"
        ? `/content/admin/revisions/${revisionId}/submit`
        : action === "publish"
          ? `/content/admin/revisions/${revisionId}/publish`
          : `/content/admin/revisions/${revisionId}/review`;
    try {
      await request(path, {
        method: "POST",
        ...(action === "approve" || action === "return"
          ? {
              body: JSON.stringify({
                approved: action === "approve",
                note:
                  action === "return"
                    ? "Zwrócono do poprawy w panelu administracyjnym."
                    : undefined,
              }),
            }
          : {}),
      });
      setNotice(
        action === "submit"
          ? "Wersja trafiła do recenzji."
          : action === "approve"
            ? "Wersja została zatwierdzona."
            : action === "return"
              ? "Wersja wróciła do edycji."
              : "Wersja została opublikowana.",
      );
      await loadWorkspace();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nieznany błąd.");
    } finally {
      setBusy(false);
    }
  };

  const lessons = useMemo(
    () =>
      courses.flatMap((course) =>
        course.modules.flatMap((module) =>
          module.lessons.map((lesson) => ({ course, module, lesson })),
        ),
      ),
    [courses],
  );
  const publishedCount = lessons.filter(
    ({ lesson }) => lesson.status === "published",
  ).length;
  const reviewItems = lessons.filter(
    ({ lesson }) => lesson.revisions[0]?.status === "review",
  );

  const exportContent = () => {
    const blob = new Blob([JSON.stringify(courses, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shellty-content-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!session)
    return (
      <main className="login-page">
        <section className="login-card" aria-labelledby="login-title">
          <div className="logo-mark" aria-hidden="true">
            <span />
            <span />
          </div>
          <span className="eyebrow">SHELLTY LINGO · CONTENT OPERATIONS</span>
          <h1 id="login-title">Zaloguj się do panelu</h1>
          <p>
            Dostęp mają wyłącznie konta z rolą editor lub admin. Tokeny są
            przechowywane tylko w pamięci tej karty.
          </p>
          <form onSubmit={(event) => void login(event)}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <label htmlFor="password">Hasło</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error ? <div className="alert error">{error}</div> : null}
            <button type="submit" disabled={busy}>
              {busy ? "Logowanie…" : "Zaloguj się"}
            </button>
          </form>
          <small className={health ? "health ok" : "health offline"}>
            <span aria-hidden="true" />
            {health
              ? `API ${health.version} · baza ${health.database}`
              : "API jest niedostępne"}
          </small>
        </section>
      </main>
    );

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="logo-mark" aria-hidden="true">
          <span />
          <span />
        </div>
        <div className="brand">
          <strong className="logo-name">Shellty Lingo</strong>
          <p>Content studio</p>
        </div>
        <nav aria-label="Nawigacja panelu">
          <a className="active" href="#overview">
            Przegląd
          </a>
          <a href="#courses">Kursy</a>
          <a href="#review">
            Recenzje <b>{reviewItems.length}</b>
          </a>
          <a href="#ai-reports">
            Raporty AI <b>{reports.length}</b>
          </a>
        </nav>
        <div className="sidebar-footer">
          <span className="avatar">
            {(session.user.profile.displayName ?? session.user.email)
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <div>
            <strong>
              {session.user.profile.displayName ?? session.user.email}
            </strong>
            <small>{session.user.role}</small>
          </div>
        </div>
      </aside>

      <section className="content" id="overview">
        <header className="topbar">
          <div>
            <span className="eyebrow">DANE OPERACYJNE Z API</span>
            <h1>Panel treści</h1>
            <p>
              Wersjonowanie, recenzja i publikacja rzeczywistych danych kursu.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="secondary"
              type="button"
              onClick={() => void loadWorkspace()}
              disabled={busy}
            >
              Odśwież
            </button>
            <button
              className="secondary"
              type="button"
              onClick={exportContent}
              disabled={!courses.length}
            >
              Eksport JSON
            </button>
            <button type="button" onClick={() => void logout()}>
              Wyloguj
            </button>
          </div>
        </header>

        {error ? <div className="alert error">{error}</div> : null}
        {notice ? <div className="alert success">{notice}</div> : null}

        <section className="metric-grid" aria-label="Stan treści">
          <article>
            <span className="metric-icon blue">◫</span>
            <div>
              <small>Opublikowane lekcje</small>
              <strong>{publishedCount}</strong>
              <em>{courses.length} kursów w bazie</em>
            </div>
          </article>
          <article>
            <span className="metric-icon coral">◷</span>
            <div>
              <small>W toku recenzji</small>
              <strong>{reviewItems.length}</strong>
              <em>Wyliczone z najnowszych wersji</em>
            </div>
          </article>
          <article>
            <span className="metric-icon teal">!</span>
            <div>
              <small>Otwarte raporty AI</small>
              <strong>{reports.length}</strong>
              <em>Do ręcznej weryfikacji</em>
            </div>
          </article>
        </section>

        <section className="section-heading" id="courses">
          <div>
            <span className="eyebrow">KURSY</span>
            <h2>Biblioteka kursów</h2>
          </div>
          <span className={health ? "health ok" : "health offline"}>
            <span aria-hidden="true" />
            {health ? "API online" : "API offline"}
          </span>
        </section>
        {courses.length ? (
          <div className="course-grid">
            {courses.map((course) => {
              const courseLessons = course.modules.flatMap(
                (module) => module.lessons,
              );
              const complete = courseLessons.filter(
                (lesson) => lesson.status === "published",
              ).length;
              const percent = courseLessons.length
                ? Math.round((complete / courseLessons.length) * 100)
                : 0;
              return (
                <article className="course-card" key={course.id}>
                  <div
                    className={`course-flag ${course.language === "th" ? "teal" : "blue"}`}
                  >
                    {course.language.toUpperCase()}
                  </div>
                  <span className={`status status-${course.status}`}>
                    {course.status}
                  </span>
                  <h3>{course.title}</h3>
                  <p>
                    {course.level} · {course.modules.length} modułów ·{" "}
                    {courseLessons.length} lekcji
                  </p>
                  <div
                    className="progress"
                    aria-label={`${percent}% publikacji`}
                  >
                    <span style={{ width: `${percent}%` }} />
                  </div>
                  <footer>
                    <span>{percent}% lekcji opublikowanych</span>
                    <span>{course.slug}</span>
                  </footer>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <strong>Brak kursów</strong>
            <p>Utwórz pierwszy kurs przez chronione API treści.</p>
          </div>
        )}

        <section className="workspace-grid" id="review">
          <article className="queue-card">
            <div className="section-heading compact">
              <div>
                <span className="eyebrow">WORKFLOW</span>
                <h2>Najnowsze wersje lekcji</h2>
              </div>
              <span>{lessons.length} pozycji</span>
            </div>
            <div className="lesson-list">
              {lessons.map(({ course, module, lesson }, index) => {
                const revision = lesson.revisions[0];
                return (
                  <div className="lesson-row" key={lesson.id}>
                    <span className="lesson-number">{index + 1}</span>
                    <div>
                      <strong>{revision?.title ?? lesson.slug}</strong>
                      <small>
                        {course.language.toUpperCase()} {course.level} ·{" "}
                        {module.title} · v{revision?.version ?? "—"}
                      </small>
                    </div>
                    <span
                      className={`status status-${revision?.status ?? lesson.status}`}
                    >
                      {revision?.status ?? lesson.status}
                    </span>
                  </div>
                );
              })}
              {!lessons.length ? (
                <p className="empty-copy">Brak wersji lekcji do pokazania.</p>
              ) : null}
            </div>
          </article>

          <article className="review-card">
            <span className="eyebrow">KOLEJKA RECENZJI</span>
            {reviewItems.length ? (
              reviewItems.map(({ course, lesson }) => {
                const revision = lesson.revisions[0]!;
                return (
                  <div className="review-item" key={revision.id}>
                    <h2>{revision.title}</h2>
                    <p>
                      {course.language.toUpperCase()} · wersja{" "}
                      {revision.version} · {revision.exercises.length} ćwiczeń
                    </p>
                    <div className="workflow-actions">
                      {!revision.reviewedAt ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void workflow(revision.id, "approve")
                            }
                            disabled={busy}
                          >
                            Zatwierdź
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => void workflow(revision.id, "return")}
                            disabled={busy}
                          >
                            Zwróć
                          </button>
                        </>
                      ) : session.user.role === "admin" ? (
                        <button
                          type="button"
                          onClick={() => void workflow(revision.id, "publish")}
                          disabled={busy}
                        >
                          Opublikuj
                        </button>
                      ) : (
                        <small>
                          Oczekuje na publikację przez administratora.
                        </small>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p>Brak wersji oczekujących na recenzję.</p>
            )}
          </article>
        </section>

        <section className="draft-panel" aria-labelledby="draft-title">
          <div>
            <span className="eyebrow">WERSJE ROBOCZE</span>
            <h2 id="draft-title">Gotowe do przekazania</h2>
            <p>
              API ponownie sprawdzi kompletność kontraktu ćwiczeń i
              zweryfikowane tłumaczenia PL/EN/TH.
            </p>
          </div>
          <div className="draft-actions">
            {lessons
              .map(({ lesson }) => lesson.revisions[0])
              .filter((revision): revision is Revision =>
                Boolean(revision && revision.status === "draft"),
              )
              .map((revision) => (
                <button
                  type="button"
                  className="secondary"
                  key={revision.id}
                  onClick={() => void workflow(revision.id, "submit")}
                  disabled={busy}
                >
                  Przekaż „{revision.title}”
                </button>
              ))}
            {!lessons.some(
              ({ lesson }) => lesson.revisions[0]?.status === "draft",
            ) ? (
              <small>Brak najnowszych wersji roboczych.</small>
            ) : null}
          </div>
        </section>

        <section className="ai-report-panel" id="ai-reports">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">JAKOŚĆ AI</span>
              <h2>Raporty rozmów</h2>
            </div>
            <span className="status status-review">
              {reports.length} otwartych
            </span>
          </div>
          {reports.map((report) => (
            <div className="report-row" key={report.id}>
              <span
                className={`course-flag ${report.conversation.userCourse.language === "th" ? "teal" : "blue"}`}
              >
                {report.conversation.userCourse.language.toUpperCase()}
              </span>
              <div>
                <strong>
                  {report.conversation.scenarioId} · {report.reason}
                </strong>
                <small>
                  {report.reporter.email} ·{" "}
                  {new Intl.DateTimeFormat("pl-PL", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(report.createdAt))}
                </small>
                {report.details ? <p>{report.details}</p> : null}
              </div>
            </div>
          ))}
          {!reports.length ? (
            <p className="empty-copy">Brak otwartych raportów rozmów.</p>
          ) : null}
        </section>
      </section>
    </main>
  );
}
