# Mapa zdarzeń analitycznych

## 1. Kontrakt i prywatność

Nazwy zdarzeń używają `snake_case` i czasu przeszłego. Zdarzenie opisuje fakt biznesowy, a nie kliknięcie konkretnego przycisku, chyba że klik jest samodzielną hipotezą.

Wspólne właściwości:

- `event_id`, `occurred_at`, `schema_version`;
- pseudonimowy `actor_id` oraz `actor_type=user|qa|staff|automation`;
- `anonymous_id` przed logowaniem; po aktywacji łączenie tylko po stronie kontrolowanego pipeline'u;
- `platform=ios|android|admin|api`, `app_version`, `build_number`, `environment`;
- `interface_language`, `explanation_language`, `course_language`;
- `user_course_id`, `plan=free|premium|beta`, `is_first_time`;
- `session_id` oraz `correlation_id`, jeśli zdarzenie pochodzi z API;
- `experiment_id` i `variant`, wyłącznie dla zarejestrowanego eksperymentu.

Zakazane właściwości: e-mail, imię, IP zapisane w analityce, token push, surowy prompt, treść rozmowy lub odpowiedzi, wpisana odpowiedź, zaznaczony tekst, tłumaczenie, transkrypcja, URL podpisany, pełny komunikat błędu i identyfikator dostawcy powiązany z osobą.

## 2. Zdarzenia MVP

### Konto i onboarding

| Zdarzenie | Kiedy emitować | Właściwości dodatkowe | KPI |
|---|---|---|---|
| `app_opened` | aktywna sesja aplikacji po wejściu na foreground | `entry_point`, `days_since_last_active_bucket` | DAU/MAU |
| `registration_started` | pokazano formularz po intencji rejestracji | `method=email` | lejek |
| `registration_completed` | API utworzyło konto | `method` | lejek |
| `email_verified` | token został poprawnie wykorzystany | `hours_to_verify_bucket` | aktywacja |
| `login_completed` | utworzono sesję | `method`, `result=success` | powroty |
| `onboarding_started` | pierwszy ekran konfiguracji kursu | `source` | lejek |
| `interface_language_selected` | zatwierdzono język UI | `selected_language`, `step_index` | UX |
| `course_selected` | utworzono/wybrano kurs | `selected_course`, `step_index` | segmentacja |
| `learning_goal_selected` | zatwierdzono cel | `goal`, `step_index` | personalizacja |
| `placement_test_started` | pobrano pierwsze pytanie | `test_version` | lejek |
| `placement_test_completed` | zapisano wynik | `test_version`, `assigned_level`, `duration_bucket`, `question_count` | aktywacja |
| `placement_test_skipped` | użytkownik świadomie pominął | `default_level` | lejek |
| `onboarding_completed` | zapisano komplet ustawień | `duration_bucket`, `steps_completed` | aktywacja |

### Lekcje, ćwiczenia i powtórki

| Zdarzenie | Kiedy emitować | Właściwości dodatkowe | KPI |
|---|---|---|---|
| `daily_plan_viewed` | pokazano gotowy plan | `item_count`, `due_review_count`, `generation_source=rules|ai` | regularność |
| `lesson_started` | utworzono sesję lekcji | `lesson_id`, `content_version`, `level`, `module_id` | lejek |
| `exercise_answered` | wynik próby zapisano idempotentnie | `exercise_id`, `exercise_type`, `is_correct`, `attempt_number`, `response_time_bucket` | skuteczność |
| `lesson_paused` | użytkownik wyszedł, a postęp zapisano | `lesson_id`, `completion_bucket`, `reason=user|background|network` | drop-off |
| `lesson_completed` | spełniono reguły ukończenia | `lesson_id`, `duration_bucket`, `accuracy_bucket`, `hint_count` | ukończenie |
| `review_session_started` | pobrano kolejkę SRS | `due_count`, `algorithm_version` | powtórki |
| `review_item_answered` | zapisano ocenę elementu | `result=again|hard|good|easy`, `was_overdue`, `overdue_days_bucket` | SRS |
| `review_session_completed` | zakończono lub wyczerpano kolejkę | `reviewed_count`, `due_remaining`, `duration_bucket` | terminowość |
| `course_switched` | aktywny kurs uległ zmianie | `from_course`, `to_course` | rozdzielenie EN/TH |

### Słownik, tłumaczenie i TTS

| Zdarzenie | Kiedy emitować | Właściwości dodatkowe | KPI |
|---|---|---|---|
| `dictionary_opened` | otwarto panel dla zaznaczenia | `source=lesson|exercise|conversation`, `selection_type=word|phrase|sentence|task`, `entry_source=reviewed|dynamic` | użycie |
| `translation_requested` | API przyjęło dynamiczne tłumaczenie | `source_language`, `target_language`, `length_bucket`, `reveals_answer_requested` | koszt |
| `translation_completed` | dostarczono wynik | `provider`, `latency_bucket`, `cache_hit`, `result=success|fallback` | jakość/koszt |
| `tts_playback_started` | rozpoczął się odsłuch | `voice_language`, `content_type=source|translation`, `speed`, `asset_source=recorded|dynamic|system` | użycie |
| `vocabulary_saved` | element zapisano z kontekstem | `source`, `entry_source`, `course_language` | pętla nauki |
| `dictionary_closed` | panel zamknięto | `duration_bucket`, `action=resume|save|dismiss` | kontynuacja |

### Tutor AI

| Zdarzenie | Kiedy emitować | Właściwości dodatkowe | KPI |
|---|---|---|---|
| `ai_scenario_selected` | użytkownik zatwierdził scenariusz | `scenario_id`, `level`, `correction_mode` | odkrywalność |
| `ai_conversation_started` | pierwsza poprawna odpowiedź AI dotarła do klienta | `conversation_id`, `scenario_id`, `prompt_version`, `model_route`, `quota_remaining_bucket` | limit/aktywacja |
| `ai_turn_completed` | zapisano pełną turę | `turn_number`, `latency_bucket`, `input_token_bucket`, `output_token_bucket`, `schema_valid`, `moderation_outcome` | koszt/jakość |
| `ai_conversation_ended` | użytkownik lub limit zakończył sesję | `turn_count`, `duration_bucket`, `end_reason`, `estimated_cost_bucket` | ukończenie |
| `ai_summary_viewed` | pokazano poprawne podsumowanie | `correction_count`, `new_word_count`, `summary_schema_version` | wartość AI |
| `ai_feedback_submitted` | zapisano ocenę lub zgłoszenie | `reason_code`, `severity`, `source=message|summary` | bezpieczeństwo |
| `ai_limit_reached` | API odrzuciło start z powodu uprawnienia/budżetu | `limit_type=period|daily|global_budget`, `plan` | konwersja/koszt |

### Postęp, powiadomienia, prywatność i płatności

| Zdarzenie | Kiedy emitować | Właściwości dodatkowe | KPI |
|---|---|---|---|
| `progress_viewed` | wyświetlono dashboard kursu | `range`, `level`, `streak_bucket` | zaangażowanie |
| `learning_goal_changed` | zapisano nowy cel/czas | `goal`, `minutes_per_day` | personalizacja |
| `notification_permission_resolved` | system zwrócił decyzję | `result=granted|denied|provisional`, `prompt_context` | opt-in |
| `notification_opened` | wejście nastąpiło z push | `notification_type`, `delivery_delay_bucket` | skuteczność |
| `consent_changed` | zapisano nową wersję zgody | `consent_type`, `state`, `policy_version` | zgodność |
| `data_export_requested` | utworzono zadanie eksportu | `scope`, `request_source` | prawa osób |
| `account_deletion_requested` | utworzono proces usunięcia | `reason_code_optional`, `grace_period_days` | rezygnacja |
| `paywall_viewed` | pokazano ofertę z intencji premium | `source`, `offer_id` | konwersja |
| `subscription_started` | backend potwierdził uprawnienie | `product_id`, `period`, `trial` | przychód |
| `subscription_status_changed` | webhook zmienił uprawnienie | `from_status`, `to_status`, `reason_code` | odnowienia/rezygnacje |

## 3. Lejki i dashboardy

1. **Aktywacja:** `registration_completed → email_verified → onboarding_completed → placement_test_completed|placement_test_skipped → lesson_started → lesson_completed`.
2. **Pierwsza wartość AI:** `ai_scenario_selected → ai_conversation_started → ai_conversation_ended → ai_summary_viewed → vocabulary_saved`.
3. **Słownik bez przerwania:** `dictionary_opened → dictionary_closed(action=resume|save) → exercise_answered → lesson_completed` w obrębie 30 minut.
4. **Nawyk:** aktywne dni nauki, terminowość SRS, seria i D1/D7/D30 per kurs.
5. **Koszt AI:** rozmowy, tury, token buckets, szacowany koszt, timeouty, walidacja i zgłoszenia per model/prompt/scenariusz, bez treści.
6. **Jakość techniczna:** crash-free, błędy API, p95, idempotency conflict, nieudane zapisy i wersje aplikacji.

## 4. Własność i kontrola zmian

- Product Manager jest właścicielem semantyki i KPI;
- Tech Lead jest właścicielem schematów, wersjonowania i dostarczenia;
- Privacy/Security zatwierdza właściwości przed wdrożeniem;
- QA utrzymuje testy pojedynczej emisji, kolejności i działania offline;
- usunięcie/zmiana znaczenia wymaga `schema_version` i noty migracyjnej;
- zdarzenie istnieje dopiero po dodaniu go do tej mapy i testu kontraktowego.

