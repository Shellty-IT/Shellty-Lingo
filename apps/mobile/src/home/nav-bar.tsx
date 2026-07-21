import { Pressable, Text, View } from "react-native";
import type { TranslationMap } from "@shellty/i18n";

import type { Tab } from "./types";
import { styles } from "./styles";

export function NavBar({
  tab,
  onSelect,
  aiAvailable,
  copy,
}: {
  tab: Tab;
  onSelect: (tab: Tab) => void;
  aiAvailable: boolean;
  copy: TranslationMap;
}) {
  return (
    <View style={styles.nav} accessibilityRole="tablist">
      {(
        [
          ["today", "⌂", copy.today],
          ["learn", "▤", copy.learn],
          ["chat", "✦", copy.chat],
          ["progress", "▥", copy.progress],
          ["profile", "◉", copy.profile],
        ] as Array<[Tab, string, string]>
      )
        .filter(([name]) => name !== "chat" || aiAvailable)
        .map(([name, icon, label]) => (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: tab === name }}
            style={styles.navItem}
            onPress={() => onSelect(name)}
          >
            <Text style={[styles.navIcon, tab === name && styles.navActive]}>
              {icon}
            </Text>
            <Text style={[styles.navLabel, tab === name && styles.navActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
    </View>
  );
}
