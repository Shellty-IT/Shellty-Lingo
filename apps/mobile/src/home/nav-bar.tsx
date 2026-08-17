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
          ["chat", "✦", copy.practice],
          ["progress", "▥", copy.progress],
          ["profile", "◉", copy.profile],
        ] as Array<[Tab, string, string]>
      ).map(([name, icon, label]) => (
        <Pressable
          key={name}
          accessibilityRole="tab"
          accessibilityLabel={label}
          accessibilityState={{
            selected: tab === name,
            disabled: name === "chat" && !aiAvailable,
          }}
          disabled={name === "chat" && !aiAvailable}
          style={[
            styles.navItem,
            name === "chat" && !aiAvailable && styles.navDisabled,
          ]}
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
