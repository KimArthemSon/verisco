import { useTheme } from "@core/ui/theme";
import { fmtSetSummary } from "@core/utils/format";
import { useWorkout } from "@modules/workouts/useWorkouts";
import { Play, X } from "lucide-react-native";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function SessionPreviewModal({
  open,
  workoutId,
  resume,
  onClose,
  onConfirm,
}: {
  open: boolean;
  workoutId: number;
  resume?: { done: number; total: number } | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: workout } = useWorkout(workoutId);

  const exercises = workout?.exercises ?? [];
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const firstSetSummary = (exercise: (typeof exercises)[number]) => {
    const first = exercise.sets[0];
    if (!first) return "0 sets";
    const rest = first.rest_seconds ?? 0;
    return `${exercise.sets.length} sets • ${fmtSetSummary(first)} • rest ${rest}s`;
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheetWrap, { paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]}>
              {workout?.name ?? "Workout"}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={18} color={colors.subtext} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {exercises.length === 0 ? (
              <Text style={[styles.empty, { color: colors.subtext }]}>
                No exercises in this workout.
              </Text>
            ) : (
              exercises.map((exercise) => (
                <View
                  key={exercise.id}
                  style={[
                    styles.exerciseRow,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Text style={[styles.exerciseName, { color: colors.text }]}>
                    {exercise.exercise_name}
                  </Text>
                  <Text
                    style={[styles.exerciseMeta, { color: colors.subtext }]}
                  >
                    {firstSetSummary(exercise)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.subtext }]}>
              {exercises.length} exercises • {totalSets} total sets
            </Text>
          </View>

          {resume && (
            <View
              style={[
                styles.resumeNote,
                {
                  backgroundColor: `${colors.accent}22`,
                  borderColor: `${colors.accent}66`,
                },
              ]}
            >
              <Text style={[styles.resumeText, { color: colors.accent }]}>
                Resume: {resume.done}/{resume.total} sets done
              </Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <Pressable
              onPress={onClose}
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.secondaryText, { color: colors.text }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            >
              <Play size={16} color="#FFFFFF" />
              <Text style={styles.primaryText}>
                {resume ? "Resume Workout" : "Start Workout"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    minHeight: 420,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },
  list: {
    maxHeight: 260,
  },
  listContent: {
    gap: 10,
    paddingBottom: 8,
  },
  exerciseRow: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  exerciseMeta: {
    fontSize: 12,
    lineHeight: 18,
  },
  empty: {
    textAlign: "center",
    paddingVertical: 18,
    fontSize: 14,
  },
  footerRow: {
    marginTop: 14,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
  },
  resumeNote: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  resumeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontWeight: "700",
    fontSize: 14,
  },
});
