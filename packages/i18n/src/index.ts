export const locales = ["pl", "en", "th"] as const;
export type Locale = (typeof locales)[number];

const pl = {
  greeting: "Cześć!",
  foundationTitle: "Twój warsztat do nauki języków jest gotowy",
  foundationBody:
    "Aplikacja mobilna, API i panel administracyjny działają na wspólnym fundamencie.",
  action: "Sprawdź połączenie",
  apiOnline: "API działa poprawnie",
  apiOffline: "API jest niedostępne — uruchom je lokalnie i spróbuj ponownie.",
  localeLabel: "Język interfejsu",
} as const;

type TranslationKey = keyof typeof pl;
type TranslationMap = Record<TranslationKey, string>;

export const translations: Record<Locale, TranslationMap> = {
  pl,
  en: {
    greeting: "Hello!",
    foundationTitle: "Your language-learning workspace is ready",
    foundationBody:
      "The mobile app, API, and admin panel now share one foundation.",
    action: "Check connection",
    apiOnline: "The API is healthy",
    apiOffline: "The API is unavailable — start it locally and try again.",
    localeLabel: "Interface language",
  },
  th: {
    greeting: "สวัสดี!",
    foundationTitle: "พื้นที่การเรียนภาษาของคุณพร้อมแล้ว",
    foundationBody: "แอปมือถือ API และแผงผู้ดูแลใช้รากฐานเดียวกันแล้ว",
    action: "ตรวจสอบการเชื่อมต่อ",
    apiOnline: "API ทำงานปกติ",
    apiOffline:
      "ไม่สามารถเชื่อมต่อ API ได้ — โปรดเปิดเซิร์ฟเวอร์แล้วลองอีกครั้ง",
    localeLabel: "ภาษาของอินเทอร์เฟซ",
  },
};

export function getCopy(locale: Locale): TranslationMap {
  return translations[locale];
}
