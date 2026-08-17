import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ContextDictionaryResult } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";

import { StatePanel } from "../ui/state-panel";
import { PrimaryButton, SmallButton } from "./shared";
import { styles } from "./styles";

export function DictionarySheet({
  selection,
  dictionary,
  saved,
  saving,
  speechRate,
  copy,
  onClose,
  onPlaySource,
  onPlayTranslation,
  onToggleRate,
  onSave,
}: {
  selection: string | null;
  dictionary: ContextDictionaryResult | null;
  saved: boolean;
  saving: boolean;
  speechRate: number;
  copy: TranslationMap;
  onClose: () => void;
  onPlaySource: () => void;
  onPlayTranslation: () => void;
  onToggleRate: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={Boolean(selection)}
    >
      <SafeAreaView accessibilityViewIsModal style={styles.dictionaryModalSafe}>
        <View style={styles.dictionaryModalHeader}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>{copy.dictionary}</Text>
            <Text style={styles.dictionaryModalTitle}>
              {dictionary?.sourceText ?? selection}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.dismiss}
            onPress={onClose}
            style={styles.close}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.dictionaryModalContent}
          keyboardShouldPersistTaps="handled"
        >
          {!dictionary ? (
            <StatePanel
              kind="loading"
              title={copy.loadingDictionary}
              body={copy.loadingDictionaryBody}
            />
          ) : (
            <>
              {dictionary.dynamic ? (
                <View style={styles.dictionaryNotice}>
                  <Text style={styles.dynamicBadge}>
                    ✦ {copy.dynamicTranslation}
                  </Text>
                  <Text style={styles.dictionaryNoticeText}>
                    {copy.aiTranslationNotice}
                  </Text>
                </View>
              ) : null}
              {dictionary.transliteration ? (
                <Text style={styles.dictionaryTransliteration}>
                  {dictionary.transliteration}
                </Text>
              ) : null}
              <View style={styles.dictionarySection}>
                <Text style={styles.dictionarySectionLabel}>
                  {copy.dictionaryDefinition}
                </Text>
                <Text style={styles.dictionaryMeaning}>
                  {dictionary.definition || dictionary.translation}
                </Text>
              </View>
              <View style={styles.dictionarySection}>
                <Text style={styles.dictionarySectionLabel}>
                  {copy.inThisContext}
                </Text>
                <Text style={styles.dictionaryTranslation}>
                  {dictionary.translation}
                </Text>
                <Text style={styles.detail}>{dictionary.context}</Text>
              </View>
              <View style={styles.speechRow}>
                <SmallButton
                  label={`🔊 ${copy.listen} (${dictionary.sourceLanguage.toUpperCase()})`}
                  onPress={onPlaySource}
                />
                <SmallButton
                  label={`🔊 ${copy.listen} (${dictionary.targetLocale.toUpperCase()})`}
                  onPress={onPlayTranslation}
                />
                <SmallButton
                  label={speechRate < 1 ? `0.7× ${copy.slower}` : "1×"}
                  onPress={onToggleRate}
                  active={speechRate < 1}
                />
              </View>
              <PrimaryButton
                label={saved ? copy.savedReview : copy.saveReview}
                onPress={onSave}
                disabled={saved || saving}
                loading={saving}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
