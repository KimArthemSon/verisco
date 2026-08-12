import { Chip } from "@core/ui/Chip";
import { Section } from "@core/ui/Section";
import { palette, useTheme } from "@core/ui/theme";
import { useCreateExercise } from "@modules/exercises/useExercises";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Full Body",
];

export default function CreateExerciseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const create = useCreateExercise();

  const [name, setName] = useState("");
  const [group, setGroup] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && !create.isPending;

  const save = () => {
    if (!canSave) return;
    create.mutate(
      { name: name.trim(), muscle_group: group },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Section title="Exercise details">
          <Text style={[styles.label, { color: colors.subtext }]}>
            Exercise name *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Bench Press"
            placeholderTextColor={colors.subtext}
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
          />

          <Text style={[styles.label, { color: colors.subtext }]}>
            Muscle group
          </Text>
          <View style={styles.chipRow}>
            {MUSCLE_GROUPS.map((g) => (
              <Chip
                key={g}
                label={g}
                selected={group === g}
                onPress={() => setGroup(g === group ? null : g)}
              />
            ))}
          </View>
        </Section>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.bg, borderTopColor: colors.border },
        ]}
      >
        <Text style={[styles.helper, { color: colors.subtext }]}>
          {canSave ? "Ready to save this exercise." : "Add a name to continue."}
        </Text>
        <Pressable
          onPress={save}
          disabled={!canSave}
          style={[styles.saveBtn, !canSave && { opacity: 0.5 }]}
        >
          {create.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveText}>Create Exercise</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 120, gap: 16 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  helper: {
    fontSize: 12,
    marginBottom: 10,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: palette.green,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
