import { Section } from "@core/ui/Section";
import { palette, useTheme } from "@core/ui/theme";
import { useExercises } from "@modules/exercises/useExercises";
import { useDraftStore } from "@modules/workouts/draftStore";
import { useRouter } from "expo-router";
import { Check, Dumbbell, Plus, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ExerciseListScreen() {
  const { colors } = useTheme();
  const { data: exercises } = useExercises();
  const draft = useDraftStore();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const inDraft = (id: number) =>
    draft.exercises.some((e) => e.exercise_id === id);

  const filtered = useMemo(() => {
    if (!exercises) return [];
    const q = query.toLowerCase().trim();
    return q
      ? exercises.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.muscle_group?.toLowerCase().includes(q),
        )
      : exercises;
  }, [exercises, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const group = e.muscle_group || "Other";
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Section title="Exercise library">
          <View
            style={[
              styles.searchRow,
              { backgroundColor: colors.bg, borderColor: colors.border },
            ]}
          >
            <Search size={18} color={colors.subtext} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="search by name or muscle group"
              placeholderTextColor={colors.subtext}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          <Text style={[styles.hint, { color: colors.subtext }]}>
            tap to add or remove items from this workout
          </Text>
        </Section>

        {grouped.map(([group, list]) => (
          <Section key={group} title={group}>
            {list.map((e) => {
              const added = inDraft(e.id);
              return (
                <Pressable
                  key={e.id}
                  onPress={() =>
                    added ? draft.removeExercise(e.id) : draft.addExercise(e)
                  }
                  style={[
                    styles.row,
                    {
                      backgroundColor: added ? colors.bg : colors.bg,
                      borderColor: added ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Dumbbell
                    size={18}
                    color={added ? colors.accent : colors.subtext}
                  />
                  <Text style={[styles.rowName, { color: colors.text }]}>
                    {e.name}
                  </Text>
                  {added ? (
                    <Check size={18} color={colors.accent} />
                  ) : (
                    <Plus size={18} color={colors.subtext} />
                  )}
                </Pressable>
              );
            })}
          </Section>
        ))}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.bg, borderTopColor: colors.border },
        ]}
      >
        <Text style={[styles.footerText, { color: colors.subtext }]}>
          {draft.exercises.length > 0
            ? `${draft.exercises.length} exercise(s) selected`
            : "No exercises selected yet"}
        </Text>
        <Pressable
          onPress={() => router.push("/exercise/create")}
          style={[styles.fab, { backgroundColor: palette.green }]}
        >
          <Plus size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 120 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  hint: { fontSize: 12, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  rowName: { flex: 1, fontSize: 15 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  footerText: { fontSize: 12, marginBottom: 10 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
