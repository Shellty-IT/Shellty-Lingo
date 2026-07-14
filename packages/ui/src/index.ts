export const colors = {
  backgroundCanvas: "#EAF1F8",
  backgroundApp: "#F3F7FC",
  backgroundCard: "#FFFFFF",
  backgroundInverse: "#0B1A30",
  textPrimary: "#0E2038",
  textSecondary: "#52647C",
  textInverse: "#FFFFFF",
  actionPrimary: "#1F6FEB",
  actionSupport: "#0D8F85",
  accentCoral: "#E76F3E",
  borderDefault: "#DCE5F0",
  error: "#B93838",
  warning: "#8B5B00",
  success: "#08796E",
  focus: "#FFB020",
} as const;

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
