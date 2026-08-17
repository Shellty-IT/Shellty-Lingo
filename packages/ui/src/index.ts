const lightColors = {
  backgroundCanvas: "#EAF1F8",
  backgroundApp: "#F3F7FC",
  backgroundCard: "#FFFFFF",
  backgroundInverse: "#0B1A30",
  textPrimary: "#0E2038",
  textSecondary: "#52647C",
  // Placeholders must stay readable, so this is the lightest tone that still
  // clears WCAG AA (4.9:1) on backgroundCard — §19. Never rely on the platform
  // default: on some Android skins it renders nearly white on a white field.
  textPlaceholder: "#5F7188",
  textInverse: "#FFFFFF",
  actionPrimary: "#1F6FEB",
  actionSupport: "#0D8F85",
  accentCoral: "#E76F3E",
  borderDefault: "#DCE5F0",
  error: "#B93838",
  warning: "#8B5B00",
  success: "#08796E",
  focus: "#FFB020",

  // Soft tint surfaces (light theme). Named by role so a dark theme can remap
  // them in one place instead of hunting hex literals across screens.
  surfaceTeal: "#E8F7F4",
  surfaceBlue: "#EFF5FF",
  surfaceBlueRaised: "#EAF2FF",
  surfaceRose: "#FFF0EA",
  surfaceAmber: "#FFF6DF",

  // Accents.
  accentTeal: "#12B5A8",
  accentGold: "#F0A000",
  accentSky: "#5FA6FF",

  // On dark (inverse) surfaces.
  accentTealOnInverse: "#7FE3D8",
  textOnInverseMuted: "#9FB5D3",
  linkOnInverse: "#9FC4FF",
  progressTrackInverse: "#233A59",

  // Subtle structure.
  borderSubtle: "#F0F4F9",
  borderBlue: "#BDD3F7",
  switchTrackOff: "#D3DEEC",

  // Listening & speaking (recording) surfaces and accents.
  accentCyan: "#5BC9E8",
  surfaceRoseDeep: "#FDF1F1",
  borderRose: "#F4C9C9",
  accentRed: "#E4453F",
  accentRedDeep: "#C2453F",
} as const;

export type ColorTokenName = keyof typeof lightColors;
export type ColorTokens = Record<ColorTokenName, string>;

export const darkColors = {
  backgroundCanvas: "#07111F",
  backgroundApp: "#0B1422",
  backgroundCard: "#142033",
  backgroundInverse: "#F4F7FB",
  textPrimary: "#F4F7FB",
  textSecondary: "#C4D0DF",
  textPlaceholder: "#AAB8CA",
  textInverse: "#07111F",
  actionPrimary: "#6EA8FF",
  actionSupport: "#5DD4C8",
  accentCoral: "#FF936C",
  borderDefault: "#40516A",
  error: "#FF8C8C",
  warning: "#FFD27A",
  success: "#63D8C8",
  focus: "#FFD166",
  surfaceTeal: "#123A3A",
  surfaceBlue: "#142B4D",
  surfaceBlueRaised: "#1A3358",
  surfaceRose: "#48262B",
  surfaceAmber: "#44351B",
  accentTeal: "#5DD4C8",
  accentGold: "#FFC857",
  accentSky: "#8CC0FF",
  accentTealOnInverse: "#08796E",
  textOnInverseMuted: "#52647C",
  linkOnInverse: "#1F6FEB",
  progressTrackInverse: "#D5DEEA",
  borderSubtle: "#26364C",
  borderBlue: "#375D8F",
  switchTrackOff: "#53647B",
  accentCyan: "#72D7EE",
  surfaceRoseDeep: "#42242A",
  borderRose: "#75414A",
  accentRed: "#FF6B67",
  accentRedDeep: "#FF9B98",
} as const satisfies ColorTokens;

export const highContrastColors = {
  ...lightColors,
  backgroundCanvas: "#FFFFFF",
  backgroundApp: "#FFFFFF",
  textPrimary: "#000000",
  textSecondary: "#243247",
  textPlaceholder: "#35455C",
  actionPrimary: "#004DBA",
  actionSupport: "#006B63",
  borderDefault: "#66758A",
  error: "#930000",
  warning: "#704600",
  success: "#00665D",
  focus: "#A54300",
} as const satisfies ColorTokens;

/** The existing export remains the light palette until screen-level migration is complete. */
export const colors = lightColors;

export const themes = {
  light: lightColors,
  dark: darkColors,
  highContrast: highContrastColors,
} as const;

export type ThemeMode = keyof typeof themes;

export const resolveTheme = (mode: ThemeMode): ColorTokens => themes[mode];

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
} as const;

export const radii = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

export const typography = {
  display: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 30,
    lineHeight: 36,
  },
  heading: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 24,
    lineHeight: 30,
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    lineHeight: 24,
  },
  body: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 16,
    lineHeight: 24,
  },
  thai: { fontFamily: "NotoSansThai_500Medium", fontSize: 17, lineHeight: 28 },
} as const;

export const minimumTouchTarget = { ios: 44, android: 48 } as const;
