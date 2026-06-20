import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { workspaceFiles, workspaceSignals } from "./src/data/sampleWorkspace";
import type { WorkspaceFile, WorkspaceSignal } from "./src/types";
import { buildCursorPrompt } from "./src/utils/cursorPrompt";

const cursorCloudUrl = "https://cursor.com/agents";

function createInitialBuffers(): Record<string, string> {
  return workspaceFiles.reduce<Record<string, string>>((buffers, file) => {
    buffers[file.id] = file.content;
    return buffers;
  }, {});
}

export default function App() {
  const [selectedFileId, setSelectedFileId] = useState(workspaceFiles[0].id);
  const [buffers, setBuffers] = useState<Record<string, string>>(createInitialBuffers);
  const [request, setRequest] = useState(
    "Turn this prototype into a shippable mobile editor with real repo sync.",
  );

  const selectedFile = workspaceFiles.find((file) => file.id === selectedFileId) ?? workspaceFiles[0];
  const activeContent = buffers[selectedFile.id] ?? selectedFile.content;
  const dirtyFileCount = workspaceFiles.filter((file) => buffers[file.id] !== file.content).length;
  const lineCount = activeContent.split("\n").length;

  const cursorPrompt = useMemo(
    () =>
      buildCursorPrompt({
        activeFile: selectedFile,
        activeContent,
        workspaceFiles,
        request,
      }),
    [activeContent, request, selectedFile],
  );

  const updateActiveBuffer = (value: string) => {
    setBuffers((currentBuffers) => ({
      ...currentBuffers,
      [selectedFile.id]: value,
    }));
  };

  const resetActiveBuffer = () => {
    setBuffers((currentBuffers) => ({
      ...currentBuffers,
      [selectedFile.id]: selectedFile.content,
    }));
  };

  const shareWithCursor = async () => {
    await Share.share({
      title: "Cursor Pocket handoff",
      message: cursorPrompt,
    });
  };

  const openCursorCloud = async () => {
    await Linking.openURL(cursorCloudUrl);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroEyebrow}>
            <Ionicons name="phone-portrait-outline" size={16} color={palette.accentSoft} />
            <Text style={styles.eyebrowText}>Cursor Pocket</Text>
          </View>
          <Text style={styles.heroTitle}>A mobile code editor built for Cursor handoffs.</Text>
          <Text style={styles.heroCopy}>
            Review code on your phone, tweak the active buffer, and send the exact context to Cursor
            Cloud when the edit needs an agent.
          </Text>
        </View>

        <View style={styles.signalGrid}>
          {workspaceSignals.map((signal) => (
            <SignalBadge key={signal.label} signal={signal} />
          ))}
        </View>

        <View style={styles.workspaceShell}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>Workspace</Text>
              <Text style={styles.sectionTitle}>Files</Text>
            </View>
            <View style={styles.dirtyPill}>
              <Text style={styles.dirtyPillText}>
                {dirtyFileCount === 0 ? "Clean" : `${dirtyFileCount} dirty`}
              </Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fileTabs}>
            {workspaceFiles.map((file) => (
              <FileTab
                key={file.id}
                file={file}
                isDirty={buffers[file.id] !== file.content}
                isSelected={file.id === selectedFile.id}
                onPress={() => setSelectedFileId(file.id)}
              />
            ))}
          </ScrollView>

          <View style={styles.editorCard}>
            <View style={styles.editorToolbar}>
              <View>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.filePath}>{selectedFile.path}</Text>
              </View>
              <View style={styles.languageBadge}>
                <Text style={styles.languageBadgeText}>{selectedFile.language}</Text>
              </View>
            </View>

            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              onChangeText={updateActiveBuffer}
              selectionColor={palette.accent}
              spellCheck={false}
              style={styles.editorInput}
              textAlignVertical="top"
              value={activeContent}
            />

            <View style={styles.editorFooter}>
              <Text style={styles.editorMeta}>{lineCount} lines</Text>
              <Pressable accessibilityRole="button" onPress={resetActiveBuffer} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset buffer</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.cursorPanel}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>Cursor bridge</Text>
              <Text style={styles.sectionTitle}>Agent handoff</Text>
            </View>
            <Ionicons name="sparkles-outline" size={24} color={palette.accentSoft} />
          </View>

          <Text style={styles.panelCopy}>
            Describe the outcome you want. Cursor Pocket bundles that ask with your active file,
            current edits, and related workspace context.
          </Text>

          <TextInput
            multiline
            onChangeText={setRequest}
            placeholder="Ask Cursor to build, refactor, explain, or test something..."
            placeholderTextColor={palette.muted}
            selectionColor={palette.accent}
            style={styles.requestInput}
            value={request}
          />

          <View style={styles.promptPreview}>
            <Text style={styles.promptLabel}>Prompt preview</Text>
            <Text numberOfLines={8} style={styles.promptText}>
              {cursorPrompt}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <ActionButton
              icon="share-outline"
              label="Share prompt"
              onPress={shareWithCursor}
              variant="primary"
            />
            <ActionButton icon="open-outline" label="Open Cursor" onPress={openCursorCloud} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SignalBadge({ signal }: { signal: WorkspaceSignal }) {
  const iconName = signal.tone === "warning" ? "warning-outline" : "checkmark-circle-outline";

  return (
    <View style={[styles.signalBadge, signal.tone === "active" && styles.signalBadgeActive]}>
      <Ionicons name={iconName} size={16} color={signal.tone === "warning" ? palette.warning : palette.success} />
      <View style={styles.signalTextWrap}>
        <Text style={styles.signalLabel}>{signal.label}</Text>
        <Text style={styles.signalValue}>{signal.value}</Text>
      </View>
    </View>
  );
}

function FileTab({
  file,
  isDirty,
  isSelected,
  onPress,
}: {
  file: WorkspaceFile;
  isDirty: boolean;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.fileTab, isSelected && styles.fileTabSelected]}
    >
      <Ionicons
        name={isSelected ? "document-text" : "document-text-outline"}
        size={18}
        color={isSelected ? palette.text : palette.muted}
      />
      <View>
        <Text style={[styles.fileTabName, isSelected && styles.fileTabNameSelected]}>{file.name}</Text>
        <Text style={styles.fileTabPath}>{file.language}</Text>
      </View>
      {isDirty ? <View style={styles.dirtyDot} /> : null}
    </Pressable>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  variant = "secondary",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.actionButton, isPrimary ? styles.actionButtonPrimary : styles.actionButtonSecondary]}
    >
      <Ionicons name={icon} size={18} color={isPrimary ? palette.text : palette.accentSoft} />
      <Text style={[styles.actionButtonText, !isPrimary && styles.actionButtonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

const palette = {
  background: "#07111f",
  backgroundGlow: "#12213a",
  panel: "#0d1a2d",
  panelElevated: "#13243d",
  border: "#223652",
  text: "#f5f8ff",
  subdued: "#a9b7d0",
  muted: "#74839b",
  accent: "#7c5cff",
  accentSoft: "#b9adff",
  success: "#35e4a4",
  warning: "#ffd166",
};

const editorFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
    paddingTop: Platform.OS === "android" ? 28 : 0,
  },
  screen: {
    gap: 18,
    padding: 18,
    paddingBottom: 36,
  },
  hero: {
    backgroundColor: palette.backgroundGlow,
    borderColor: palette.border,
    borderRadius: 30,
    borderWidth: 1,
    overflow: "hidden",
    padding: 24,
  },
  heroEyebrow: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(124, 92, 255, 0.16)",
    borderColor: "rgba(185, 173, 255, 0.26)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  eyebrowText: {
    color: palette.accentSoft,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: palette.text,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 38,
  },
  heroCopy: {
    color: palette.subdued,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
  },
  signalGrid: {
    gap: 10,
  },
  signalBadge: {
    alignItems: "center",
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  signalBadgeActive: {
    borderColor: "rgba(124, 92, 255, 0.62)",
  },
  signalTextWrap: {
    flex: 1,
  },
  signalLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  signalValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  workspaceShell: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionKicker: {
    color: palette.accentSoft,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  dirtyPill: {
    backgroundColor: "rgba(53, 228, 164, 0.12)",
    borderColor: "rgba(53, 228, 164, 0.28)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dirtyPillText: {
    color: palette.success,
    fontSize: 12,
    fontWeight: "800",
  },
  fileTabs: {
    gap: 10,
    paddingVertical: 16,
  },
  fileTab: {
    alignItems: "center",
    backgroundColor: palette.panelElevated,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minWidth: 142,
    padding: 12,
  },
  fileTabSelected: {
    backgroundColor: "rgba(124, 92, 255, 0.22)",
    borderColor: "rgba(185, 173, 255, 0.5)",
  },
  fileTabName: {
    color: palette.subdued,
    fontSize: 14,
    fontWeight: "800",
  },
  fileTabNameSelected: {
    color: palette.text,
  },
  fileTabPath: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 2,
  },
  dirtyDot: {
    backgroundColor: palette.warning,
    borderRadius: 999,
    height: 8,
    marginLeft: "auto",
    width: 8,
  },
  editorCard: {
    backgroundColor: "#081321",
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  editorToolbar: {
    alignItems: "center",
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
  },
  fileName: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
  },
  filePath: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 3,
  },
  languageBadge: {
    backgroundColor: "rgba(124, 92, 255, 0.18)",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  languageBadgeText: {
    color: palette.accentSoft,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  editorInput: {
    color: palette.text,
    fontFamily: editorFont,
    fontSize: 14,
    lineHeight: 21,
    minHeight: 260,
    padding: 16,
  },
  editorFooter: {
    alignItems: "center",
    borderTopColor: palette.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  editorMeta: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  resetButton: {
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  resetButtonText: {
    color: palette.subdued,
    fontSize: 12,
    fontWeight: "800",
  },
  cursorPanel: {
    backgroundColor: palette.panel,
    borderColor: "rgba(124, 92, 255, 0.38)",
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  panelCopy: {
    color: palette.subdued,
    fontSize: 15,
    lineHeight: 22,
  },
  requestInput: {
    backgroundColor: palette.panelElevated,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 92,
    padding: 14,
  },
  promptPreview: {
    backgroundColor: "#07101d",
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  promptLabel: {
    color: palette.accentSoft,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  promptText: {
    color: palette.subdued,
    fontFamily: editorFont,
    fontSize: 12,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 12,
  },
  actionButtonPrimary: {
    backgroundColor: palette.accent,
  },
  actionButtonSecondary: {
    backgroundColor: "rgba(185, 173, 255, 0.1)",
    borderColor: "rgba(185, 173, 255, 0.24)",
    borderWidth: 1,
  },
  actionButtonText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "900",
  },
  actionButtonTextSecondary: {
    color: palette.accentSoft,
  },
});
