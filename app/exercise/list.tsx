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
    <ScrollView
      contentContainerStyle={[styles.content, { backgroundColor: colors.bg }]}
    >
      <View style={[styles.searchRow, { backgroundColor: colors.surface }]}>
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
        tap to add / remove • back arrow returns to the workout
      </Text>

      {grouped.map(([group, list]) => (
        <View key={group}>
          <Text style={[styles.groupTitle, { color: colors.text }]}>
            {group}
          </Text>
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
                    backgroundColor: added
                      ? palette.green + "22"
                      : colors.surface,
                  },
                ]}
              >
                <Dumbbell size={18} color={palette.green} />
                <Text style={[styles.rowName, { color: colors.text }]}>
                  {e.name}
                </Text>
                {added && <Check size={18} color={palette.green} />}
              </Pressable>
            );
          })}
        </View>
      ))}

      <Pressable
        onPress={() => router.push("/exercise/create")}
        style={[styles.fab, { backgroundColor: palette.green }]}
      >
        <Plus size={22} color="#FFFFFF" />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12, paddingBottom: 100 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  hint: { fontSize: 12, textAlign: "center" },
  groupTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
  },
  rowName: { flex: 1, fontSize: 15 },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
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
