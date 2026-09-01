export const interfaceLocales = ["pl", "en", "th"] as const;
export type InterfaceLocale = (typeof interfaceLocales)[number];

export const courseLanguages = ["en", "th"] as const;
export type CourseLanguage = (typeof courseLanguages)[number];

export const learningLevels = ["A1", "A2", "B1", "B2"] as const;
export type LearningLevel = (typeof learningLevels)[number];
