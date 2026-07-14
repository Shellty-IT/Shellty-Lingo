# Shellty Lingo

[Polski](./README.md) | [English](./README.en.md)

Shellty Lingo is a mobile application project for interactive and personalized language learning powered by artificial intelligence. It will combine structured lessons, spaced repetition, and practical conversations with an AI agent.

> **Project status:** Stage 1 UX documentation, design system, and clickable prototype are ready for validation. Production application code has not been created yet.

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

| Area | Technologies |
|---|---|
| Mobile | React Native, Expo, Expo Router, TypeScript |
| Client data | TanStack Query, Zustand |
| Forms and validation | React Hook Form, Zod |
| Localization | i18next, react-i18next, Expo Localization |
| Backend | Node.js, NestJS, TypeScript, REST API |
| Database | PostgreSQL, Prisma ORM |
| Administration panel | Next.js, React, TypeScript |
| Media | S3-compatible object storage |
| Mobile CI/CD | Expo EAS |
| Repository and automation | GitHub, GitHub Actions |

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
- `docs/adr/` — architecture decisions; this directory will be created during the technical bootstrap.
- `docs/runbooks/` — operational procedures; this directory will be created before beta.

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
  domain/
  i18n/
  ui/
prisma/
  migrations/
  seed/
docs/
  adr/
  runbooks/
```

This structure will be created during the foundation stage. The repository currently contains planning documentation only.

## Running the project

There is no executable application code yet. After the initial technical bootstrap, the root `package.json` should expose a consistent set of commands:

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrate
pnpm db:seed
```

Required Node.js and pnpm versions will be pinned in the repository. Do not install dependencies before the workspace and lockfile are created.

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
