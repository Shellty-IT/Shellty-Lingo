# Shellty Lingo

[Polski](./README.md) | [English](./README.en.md)

Shellty Lingo is a mobile application project for interactive and personalized language learning powered by artificial intelligence. It will combine structured lessons, spaced repetition, and practical conversations with an AI agent.

> **Project status:** Stage 2 Foundation Release. The monorepo contains working Expo, NestJS, and Next.js shells, PostgreSQL/Prisma, automated quality gates, and development/staging configuration.

## Product goal

The first release will target adult learners at any proficiency level and will allow them to:

- learn English or Thai;
- use the interface in Polish, English, or Thai;
- complete a placement test and receive an individual learning plan;
- practice vocabulary and grammar with spaced repetition;
- use a contextual dictionary that translates words, phrases, and task instructions, reads the source and translation aloud, and saves selected items for review;
- learn the Thai alphabet, transliteration, and tone fundamentals;
- have text conversations with AI and receive error analysis;
- track progress separately for each learning language;
- receive configurable learning and review reminders.

## MVP scope

The MVP includes Android and iOS applications, a REST API backend, and an administration panel. Its main modules are:

1. account, authentication, profile, and consent management;
2. onboarding and placement tests;
3. courses, lessons, vocabulary, and basic grammar;
4. a contextual dictionary, translation, and text-to-speech (TTS);
5. spaced repetition and learner error history;
6. a foundational Thai alphabet and tone course;
7. text-based AI conversations and correction summaries;
8. personalized learning plans and progress dashboards;
9. notifications and basic subscriptions;
10. content management and publishing;
11. monitoring, analytics, security, and GDPR support.

Real-time voice conversations, advanced pronunciation analysis, full offline support, community features, and certificates are planned after the MVP.

## Planned technology stack

| Area                      | Technologies                                |
| ------------------------- | ------------------------------------------- |
| Mobile                    | React Native, Expo, Expo Router, TypeScript |
| Client data               | TanStack Query, Zustand                     |
| Forms and validation      | React Hook Form, Zod                        |
| Localization              | i18next, react-i18next, Expo Localization   |
| Backend                   | Node.js, NestJS, TypeScript, REST API       |
| Database                  | PostgreSQL, Prisma ORM                      |
| Administration panel      | Next.js, React, TypeScript                  |
| Media                     | S3-compatible object storage                |
| Mobile CI/CD              | Expo EAS                                    |
| Repository and automation | GitHub, GitHub Actions                      |

Hosting, AI, email, analytics, monitoring, and payment providers will be approved through Architecture Decision Records (ADRs).

## High-level architecture

```text
Expo application ───┐
                    ├── HTTPS ──> NestJS REST API ──> PostgreSQL
Next.js admin ──────┘                   │       ├────> S3 storage
                                       │       ├────> email / push / billing
                                       │       └────> queues and cache (when needed)
                                       └────────────> AI provider adapters
```

The mobile application must never call an AI provider directly or store server-side secrets. The API is responsible for authorization, usage limits, moderation, response validation, cost control, and auditing.

## Documentation

- [Build plan — Polish](./PLAN_BUDOWY.md) — delivery stages, quality gates, risks, KPIs, and MVP completion criteria.
- [Technical context — Polish](./CLOUDE.md) — architecture, data model, contracts, conventions, security, AI, testing, and CI/CD.
- [Stage 1 — UX and clickable prototype](./docs/product/stage-1/README.md) — information architecture, flows, components, states, accessibility, and a PL/EN/TH iOS/Android prototype.
- [Stage 2 — Foundation Release (Polish)](./docs/product/stage-2/README.md) — foundation evidence, vertical demo, and migration strategy.
- `docs/adr/` — accepted working architecture decisions.
- `docs/runbooks/` — deployment and rollback procedures.

The planning documents are currently maintained in Polish. English technical documentation can be added when implementation begins.

## Target repository structure

```text
apps/
  mobile/             # Expo / React Native
  api/                # NestJS REST API
  admin/              # Next.js
packages/
  api-contracts/
  config/
  i18n/
  ui/
docs/
  adr/
  runbooks/
```

Migrations and the seed belong to the API application under `apps/api/prisma`.

## Running the project

Node.js `24.12.0`, pnpm `11.13.0` (through Corepack), and Docker are required. First run in PowerShell:

```powershell
corepack pnpm@11.13.0 --version
Copy-Item .env.example .env
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/admin/.env.example apps/admin/.env.local
Copy-Item apps/mobile/.env.example apps/mobile/.env
corepack pnpm@11.13.0 install --frozen-lockfile
corepack pnpm@11.13.0 db:up
corepack pnpm@11.13.0 db:migrate:deploy
corepack pnpm@11.13.0 db:seed
corepack pnpm@11.13.0 dev
```

The API runs at `http://localhost:3001/v1` and admin at `http://localhost:3002`. Start Expo separately with `corepack pnpm@11.13.0 dev:mobile`. Android emulators use `10.0.2.2` by default; a physical device needs the computer's LAN IP in `EXPO_PUBLIC_API_URL`.

Run the entire quality gate with `corepack pnpm@11.13.0 check`. Equivalent individual commands include `format:check`, `lint`, `typecheck`, `test`, `build`, and `test:e2e`.

## Development rules

- the `main` branch must remain deployable;
- changes should be delivered through short-lived branches and pull requests;
- every pull request should pass formatting, linting, type checking, tests, and builds;
- database schema changes require migrations and a compatibility plan;
- user-visible copy must account for PL, EN, and TH;
- AI prompt or model changes require versioning and evaluation;
- educational content requires language review before publication;
- secrets, `.env` files, user data, and recordings must never be committed.

The detailed Definition of Done is available in [CLOUDE.md](./CLOUDE.md#25-definition-of-done).

## Security and privacy

The project follows privacy-by-default and least-privilege principles. User data, conversations, and future voice recordings must have a defined purpose, retention period, and deletion procedure. AI responses are treated as untrusted data and must be validated, moderated, limited, and reportable.

Do not report vulnerabilities through a public issue. Until a formal security policy is added, contact the Shellty-IT organization owner privately.

## License

The project license has not been selected yet. All rights are reserved until a `LICENSE` file is added.
