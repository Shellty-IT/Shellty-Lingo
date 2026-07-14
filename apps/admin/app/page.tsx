import { HealthStatus } from "./health-status";

const services = [
  ["Mobile", "Expo Router", "PL · EN · ไทย"],
  ["API", "NestJS + Prisma", "PostgreSQL"],
  ["Admin", "Next.js", "Content operations"],
] as const;

export default function Home() {
  return (
    <main>
      <aside>
        <div className="logo-mark" aria-hidden="true">
          <span />
          <span />
        </div>
        <div>
          <strong className="logo-name">Shellty Lingo</strong>
          <p>Panel administracyjny</p>
        </div>
        <nav aria-label="Nawigacja panelu">
          <a className="active" href="#foundation">
            Foundation
          </a>
          <span aria-disabled="true">Treści · Etap 4</span>
          <span aria-disabled="true">Zgłoszenia · Etap 7</span>
        </nav>
      </aside>

      <section className="content" id="foundation">
        <header>
          <div>
            <span className="eyebrow">FOUNDATION RELEASE</span>
            <h1>Warsztat Shellty Lingo jest gotowy</h1>
            <p>
              Trzy aplikacje, jeden typowany workspace i wspólne reguły jakości.
            </p>
          </div>
          <span className="environment">Development</span>
        </header>

        <div className="service-grid">
          {services.map(([name, stack, detail]) => (
            <article key={name}>
              <span className="service-icon">{name.slice(0, 1)}</span>
              <div>
                <h2>{name}</h2>
                <p>{stack}</p>
                <small>{detail}</small>
              </div>
            </article>
          ))}
        </div>

        <HealthStatus />

        <section className="release-note">
          <div>
            <span className="eyebrow">ETAP 2</span>
            <h2>Bezpieczna baza do dalszej nauki</h2>
            <p>
              CI blokuje regresje, środowiska walidują konfigurację, a
              telemetria nie wysyła treści ani PII.
            </p>
          </div>
          <span className="check">✓</span>
        </section>
      </section>
    </main>
  );
}
