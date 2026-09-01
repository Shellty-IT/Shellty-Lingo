import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@shellty/ui";

export const speechRates = [0.5, 0.7, 1] as const;
export type SpeechRate = (typeof speechRates)[number];

export function SpeechRateControl({
  value,
  onChange,
  disabled = false,
}: {
  value: SpeechRate;
  onChange: (value: SpeechRate) => void;
  disabled?: boolean;
}) {
  return (
    <View accessibilityRole="radiogroup" style={styles.row}>
      {speechRates.map((rate) => {
        const selected = value === rate;
        const label = `${rate.toLocaleString("en-US")}×`;
        return (
          <Pressable
            key={rate}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(rate)}
            style={[
              styles.button,
              selected && styles.buttonSelected,
              disabled && styles.disabled,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
  },
  button: {
    minWidth: 48,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing[2],
  },
  buttonSelected: {
    borderColor: colors.actionPrimary,
    backgroundColor: colors.actionPrimary,
  },
  label: {
    ...typography.title,
    color: colors.textSecondary,
    fontSize: 12,
  },
  labelSelected: { color: colors.textInverse },
  disabled: { opacity: 0.45 },
});
