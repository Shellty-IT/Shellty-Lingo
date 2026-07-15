# Dostawcy, architektura usług i budżet

**Waluta:** USD netto, bez VAT i wahań kursu.  
**Ceny sprawdzone:** 2026-07-14.  
**Zasada:** cena jest wejściem do budżetu, nie gwarancją dostawcy; przed zakupem należy sprawdzić aktualny cennik.

## 1. Rekomendowany zestaw

| Obszar | Wybór | Region / plan startowy | Uzasadnienie | Plan wyjścia |
|---|---|---|---|---|
| Hosting API/admin/worker | Render | Frankfurt; kontenery Node, statyczny admin gdzie możliwe | mały narzut operacyjny, prywatna sieć, prosty staging i rollback | obrazy OCI + IaC; przeniesienie do innego hosta bez zmiany domeny |
| PostgreSQL | Render Postgres | Frankfurt; paid DB z PITR | ten sam region i prywatna sieć co API, standardowy PostgreSQL | codzienny logiczny backup, Prisma bez rozszerzeń zależnych od dostawcy |
| Obiekty/S3 | AWS S3 | `eu-central-1` Frankfurt | jawny region, wersjonowanie/lifecycle, podpisane URL, dojrzałe IAM | kod przez interfejs S3; eksport kluczy i metadanych |
| E-mail transakcyjny | AWS SES | `eu-central-1` Frankfurt | niski koszt i region UE; wyłącznie weryfikacja/reset/alerty | adapter e-mail, szablony niezależne od SES |
| Mobile build/update | Expo EAS | Starter do 3k MAU aktualizacji | wymagany ekosystem Expo, przewidywalne buildy | lokalne/native buildy i archiwizacja artefaktów |
| Push | Expo Push Service → APNs/FCM | bezpłatny, limit 600/s | jeden kontrakt dla iOS/Android, wystarczający dla MVP | przechowywać także token natywny; adapter APNs/FCM |
| AI tekstowe | OpenAI API | projekt serwerowy; `store:false`; model route zamiast stałego modelu w domenie | strukturalne wyjścia, streaming, wielojęzyczność; konieczna ewaluacja tajskiego | port `ConversationAi`, wersjonowane prompty i fixture kontraktowe |
| Tłumaczenie/TTS | Google Cloud | region/projekt UE gdzie usługa pozwala | obsługa PL/EN/TH i szeroki katalog głosów; tylko backend | osobne porty `TranslationProvider` i `SpeechProvider`, system TTS jako fallback |
| Analityka | PostHog Cloud EU | Frankfurt; free/usage based | produkt, lejki, flagi, 1M zdarzeń free; możliwość odrzucenia IP | własny event outbox i neutralny kontrakt zdarzeń |
| Monitoring aplikacji | Sentry | Team, 30 dni; replays/attachments/PII off | dojrzałe React Native/NestJS/Next.js, release health i source maps | OpenTelemetry/logi strukturalne; możliwość zmiany backendu |
| Płatności/uprawnienia | RevenueCat + App Store/Play | free do 2,5k USD MTR | upraszcza weryfikację i lifecycle subskrypcji | serwerowe entitlementy i surowe zdarzenia sklepów przechowywane u nas |
| Kod i CI | GitHub + Actions | prywatne repo | istniejący remote i plan CI | standardowe workflow i skrypty repo |

Sentry jest dopuszczony wyłącznie z allowlistą pól, scrubbingiem, wyłączonym replay/attachments i umową powierzenia. Jeśli wymaganie pełnej rezydencji UE obejmie monitoring, należy przed betą zastąpić go rozwiązaniem w UE lub planem Enterprise po analizie kosztu.

OpenAI jest wyborem warunkowym. Przed publicznym MVP wymagany jest projekt z europejskim przetwarzaniem i ZDR/MAM albo ponowna decyzja dostawcy. Domyślne logi nadużyć API mogą być przechowywane do 30 dni, dlatego klient nie łączy się z API bezpośrednio, a backend usuwa PII i używa `store:false`.

## 2. Model kosztów

### Założenia

- foundation: zespół wewnętrzny, środowisko lokalne + mały staging, bez zewnętrznych użytkowników;
- beta: 250 MAU, średnio 4 rozmowy AI/MAU, 150 zdarzeń analitycznych/MAU;
- publiczne MVP: 1 000 MAU, średnio 2,5 rozmowy/MAU, 200 zdarzeń/MAU, 20 GB obiektów;
- średni koszt pełnej rozmowy z podsumowaniem: planistycznie 0,04 USD, twardy cel p95 0,08 USD;
- koszt personelu, tworzenia treści, ekspertów, prawników, podatków i marketingu nie jest kosztem usług chmurowych.

| Pozycja / miesiąc | Foundation | Beta 250 MAU | MVP 1k MAU |
|---|---:|---:|---:|
| Render workspace + API + DB + staging + cron | 20 | 135 | 160 |
| Expo EAS | 19 | 19 | 19 |
| S3 + transfer/backup | 2 | 5 | 10 |
| SES | 1 | 2 | 5 |
| OpenAI rozmowy/analiza | 25 | 60 | 120 |
| Tłumaczenie/TTS | 10 | 25 | 60 |
| PostHog EU | 0 | 0 | 0 przy limicie free |
| Sentry | 0 | 26 | 26 |
| RevenueCat | 0 | 0 | 0 poniżej progu MTR |
| Konta sklepów, DNS i drobne usługi (amortyzacja) | 5 | 12 | 15 |
| **Suma typowa** | **82** | **284** | **415** |
| **Limit z rezerwą ~25%** | **105** | **355** | **520** |

Budżet AI ma osobny bezpiecznik: 8 USD/dzień w becie i 10 USD/dzień przy 1k MAU, z alertami 50/75/90/100%. Podniesienie limitu wymaga analizy kosztu na rozmowę i aktywnego użytkownika, nie tylko większego salda.

Render free nie jest używany dla danych beta/production: darmowa baza wygasa, a darmowe usługi mają ograniczenia właściwe dla podglądu. Staging może być czasowo skalowany w dół, ale ma pozostać odseparowany od production.

## 3. Bramy zakupowe i bezpieczeństwa

Przed założeniem kont produkcyjnych właściciel usługi potwierdza:

- DPA, listę podprocesorów, region i mechanizm transferu;
- SSO/MFA, role, najmniejsze uprawnienia i osobne projekty dev/stage/prod;
- retencję, eksport, usunięcie i procedurę po zakończeniu umowy;
- alert kosztowy i twardy limit tam, gdzie jest dostępny;
- status page, backup, RPO/RTO i kanał eskalacji;
- brak klucza dostawcy w bundle mobilnym lub panelu webowym.

## 4. Właściciele usług

| Grupa | DRI | Zastępca |
|---|---|---|
| Render/Postgres/S3/SES/GitHub | DevOps/SRE | Backend Lead |
| OpenAI/translation/TTS | AI Lead | Backend Lead |
| Expo/push/sklepy | Mobile Lead | DevOps/SRE |
| PostHog | Product Manager | Data/Backend Lead |
| Sentry | QA Lead | DevOps/SRE |
| RevenueCat/płatności | Backend Lead | Product Manager |

## 5. Źródła cen i możliwości

- [Render pricing](https://render.com/pricing) i [region Frankfurt](https://render.com/docs/regions)
- [Amazon S3 pricing](https://aws.amazon.com/s3/pricing/) i [endpoint Frankfurt](https://docs.aws.amazon.com/general/latest/gr/s3.html)
- [Amazon SES pricing](https://aws.amazon.com/ses/pricing/) i [endpoint Frankfurt](https://docs.aws.amazon.com/general/latest/gr/ses.html)
- [Expo EAS pricing](https://expo.dev/pricing) oraz [Expo Push FAQ](https://docs.expo.dev/push-notifications/faq/)
- [OpenAI models/pricing](https://developers.openai.com/api/docs/models) i [data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint)
- [PostHog pricing i region EU](https://posthog.com/pricing) oraz [kontrola danych](https://posthog.com/docs/privacy/data-storage)
- [Sentry pricing](https://sentry.io/pricing/)
- [Google Cloud Translation — języki](https://docs.cloud.google.com/translate/docs/languages) i [cennik](https://cloud.google.com/translate/pricing)
- [Google Cloud Text-to-Speech — głosy](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types) i [cennik](https://cloud.google.com/text-to-speech/pricing)
- [RevenueCat pricing](https://www.revenuecat.com/pricing/)
- [Apple Developer Program](https://developer.apple.com/programs/whats-included/)
