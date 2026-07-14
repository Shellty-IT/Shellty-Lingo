const courses = [
  {
    language: "EN",
    title: "English for everyday life",
    detail: "A1 · 3 modules · 12 lessons",
    status: "Published",
    color: "blue",
  },
  {
    language: "TH",
    title: "Thai script and first tones",
    detail: "A1 · 2 modules · 8 lessons",
    status: "In review",
    color: "teal",
  },
] as const;

const work = [
  ["1", "First phrases at a restaurant", "English A1", "Draft", "draft"],
  ["2", "Ordering with polite requests", "English A1", "Review", "review"],
  ["3", "อักษรไทย: พยัญชนะชุดแรก", "Thai A1", "Published", "published"],
] as const;

export default function Home() {
  return (
    <main className="admin-shell">
      <aside>
        <div className="logo-mark" aria-hidden="true">
          <span />
          <span />
        </div>
        <div className="brand">
          <strong className="logo-name">Shellty Lingo</strong>
          <p>Content studio</p>
        </div>
        <nav aria-label="Content navigation">
          <a className="active" href="#overview">
            Overview
          </a>
          <a href="#courses">Courses</a>
          <a href="#review">
            Review queue <b>1</b>
          </a>
          <a href="#dictionary">Dictionary</a>
          <a href="#assets">Media library</a>
        </nav>
        <div className="sidebar-footer">
          <span className="avatar">AK</span>
          <div>
            <strong>Anna Kowalska</strong>
            <small>Content editor</small>
          </div>
        </div>
      </aside>

      <section className="content" id="overview">
        <header className="topbar">
          <div>
            <span className="eyebrow">CONTENT OPERATIONS</span>
            <h1>Good afternoon, Anna.</h1>
            <p>Prepare, review and publish lessons with confidence.</p>
          </div>
          <div className="header-actions">
            <button className="secondary">Export content</button>
            <button>+ New course</button>
          </div>
        </header>

        <section className="metric-grid" aria-label="Content status">
          <article>
            <span className="metric-icon blue">◫</span>
            <div>
              <small>Published lessons</small>
              <strong>20</strong>
              <em>+3 this month</em>
            </div>
          </article>
          <article>
            <span className="metric-icon coral">◷</span>
            <div>
              <small>Awaiting review</small>
              <strong>1</strong>
              <em>Needs your decision</em>
            </div>
          </article>
          <article>
            <span className="metric-icon teal">✓</span>
            <div>
              <small>Translation coverage</small>
              <strong>98%</strong>
              <em>PL · EN · TH verified</em>
            </div>
          </article>
        </section>

        <section className="section-heading" id="courses">
          <div>
            <span className="eyebrow">COURSES</span>
            <h2>Course library</h2>
          </div>
          <a href="#courses">View all courses →</a>
        </section>
        <div className="course-grid">
          {courses.map((course) => (
            <article className="course-card" key={course.language}>
              <div className={`course-flag ${course.color}`}>
                {course.language}
              </div>
              <span
                className={`status ${course.status === "Published" ? "status-published" : "status-review"}`}
              >
                {course.status}
              </span>
              <h3>{course.title}</h3>
              <p>{course.detail}</p>
              <div className="progress">
                <span
                  style={{ width: course.language === "EN" ? "82%" : "56%" }}
                />
              </div>
              <footer>
                <span>
                  {course.language === "EN" ? "82% ready" : "56% ready"}
                </span>
                <button
                  className="icon-button"
                  aria-label={`Open ${course.title}`}
                >
                  →
                </button>
              </footer>
            </article>
          ))}
          <a className="new-course" href="#new-course">
            <span>+</span>
            <strong>Create another course</strong>
            <small>Set language, level and first module</small>
          </a>
        </div>

        <section className="workspace-grid" id="review">
          <article className="queue-card">
            <div className="section-heading compact">
              <div>
                <span className="eyebrow">WORKFLOW</span>
                <h2>Recent lessons</h2>
              </div>
              <a href="#review">Review queue</a>
            </div>
            <div className="lesson-list">
              {work.map(([number, title, course, status, state]) => (
                <div className="lesson-row" key={number}>
                  <span className="lesson-number">{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <small>{course} · Updated today</small>
                  </div>
                  <span className={`status status-${state}`}>{status}</span>
                  <button className="more" aria-label={`Actions for ${title}`}>
                    •••
                  </button>
                </div>
              ))}
            </div>
          </article>
          <aside className="review-card">
            <span className="eyebrow">READY TO REVIEW</span>
            <h2>Ordering with polite requests</h2>
            <p>
              Version 3 has 6 exercises and verified translations in PL, EN and
              TH.
            </p>
            <div className="check-list">
              <span>✓ Exercise contract complete</span>
              <span>✓ Audio metadata attached</span>
              <span>✓ Translation review passed</span>
            </div>
            <button>Open review</button>
            <small>
              Publishing is available to administrators after approval.
            </small>
          </aside>
        </section>

        <section className="preview-panel" id="dictionary">
          <div>
            <span className="eyebrow">MOBILE PREVIEW</span>
            <h2>What learners will see</h2>
            <p>
              Preview always renders the selected published version. Drafts
              never reach the mobile application.
            </p>
            <div className="preview-tags">
              <span>Versioned</span>
              <span>Role protected</span>
              <span>Audited</span>
            </div>
          </div>
          <div className="phone-preview">
            <span className="phone-course">ENGLISH A1 · LESSON 02</span>
            <strong>Ordering with polite requests</strong>
            <p>Choose the most natural way to ask for the menu.</p>
            <div className="choice">Could I have the menu, please?</div>
            <div className="choice muted">I want menu.</div>
            <button>Check answer</button>
          </div>
        </section>
      </section>
    </main>
  );
}
