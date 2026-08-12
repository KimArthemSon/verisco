import { useStartSession } from "@/src/modules/session-player/useSessionPlayer";
import { dialog } from "@core/ui/dialogStore";
import { palette, useTheme } from "@core/ui/theme";
import { WEEK_DAYS } from "@core/utils/dates";
import { deleteSchedule } from "@modules/workouts/schedules";
import { useSchedulesByWorkout } from "@modules/workouts/useSchedules";
import {
  useDeleteWorkout,
  usePromoteToTemplate,
  useWorkoutDetail,
} from "@modules/workouts/useWorkouts";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  BookmarkPlus,
  CalendarDays,
  History,
  Pencil,
  Play,
  Trash2,
} from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const wid = Number(id);
  const { colors, mode } = useTheme();
  const router = useRouter();
  const { data: workout } = useWorkoutDetail(wid);
  const { data: schedules } = useSchedulesByWorkout(wid);
  const del = useDeleteWorkout();
  const promote = usePromoteToTemplate();
  const startSession = useStartSession();

  if (!workout)
    return <View style={[styles.root, { backgroundColor: colors.bg }]} />;

  const sc = schedules?.[0];
  const dayLabels = sc?.days_of_week
    ? (JSON.parse(sc.days_of_week) as number[])
        .map((d) => WEEK_DAYS.find((x) => x.value === d)?.label)
        .join(" · ")
    : null;

  const handlePlay = async () => {
    if (workout.is_template)
      return dialog.alert(
        "Templates",
        "Create a workout from this template first.",
        [{ label: "OK" }],
        { icon: AlertTriangle },
      );

    // Check for last completed session
    const lastSession = await import("@modules/session-player/repository").then(
      (m) => m.getLastSessionForWorkout(wid),
    );

    if (lastSession) {
      dialog.alert(
        "Session History",
        `You completed this on ${lastSession.started_at?.slice(0, 10)} (${lastSession.sets_done} sets, ${Math.round(lastSession.volume)} kg)`,
        [
          {
            label: "View Last Session",
            onPress: () => router.push(`/session/${lastSession.id}`),
          },
          { label: "Start Fresh", onPress: () => doStartSession() },
        ],
        { variant: "sheet", icon: History },
      );
    } else {
      doStartSession();
    }
  };

  const doStartSession = () => {
    startSession.mutate(
      { workoutId: workout.id, journeyId: workout.journey_id! },
      { onSuccess: (sessionId) => router.push(`/session/${sessionId}`) },
    );
  };

  const destroy = () =>
    dialog.alert(
      "Delete workout",
      "Sets and schedule will also be removed.",
      [
        {
          label: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteSchedule(wid);
            del.mutate(wid, { onSuccess: () => router.back() });
          },
        },
      ],
      { icon: Trash2 },
    );

  const saveAsTemplate = () =>
    dialog.alert(
      "Save as template",
      "Creates a reusable blueprint of this workout.",
      [
        {
          label: "Save",
          onPress: () =>
            promote.mutate(wid, {
              onSuccess: () =>
                dialog.alert("Template saved", undefined, [{ label: "OK" }], {
                  icon: BookmarkPlus,
                }),
            }),
        },
      ],
      { icon: BookmarkPlus },
    );

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { backgroundColor: colors.bg }]}
    >
      <Text style={[styles.name, { color: colors.text }]}>{workout.name}</Text>
      <Text style={[styles.sub, { color: colors.subtext }]}>
        {workout.is_template ? "template" : "workout"} •{" "}
        {workout.exercises.length} exercises
      </Text>

      {sc && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <CalendarDays
            size={18}
            color={mode === "dark" ? "#FFFFFF" : "#000000"}
          />
          <Text style={[styles.cardText, { color: colors.text }]}>
            {sc.schedule_type === "once"
              ? `${sc.target_date} @ ${sc.time}`
              : `${dayLabels} @ ${sc.time}`}
          </Text>
          <Text style={[styles.remind, { color: colors.subtext }]}>
            {sc.reminder_enabled ? "reminder on" : "reminder off"}
          </Text>
        </View>
      )}

      {workout.exercises.map((we) => (
        <View
          key={we.id}
          style={[styles.exCard, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.exName, { color: colors.text }]}>
            {we.exercise_name}
          </Text>
          {we.sets.map((s) => (
            <Text
              key={s.id}
              style={[styles.setText, { color: colors.subtext }]}
            >
              {s.set_number}. {s.reps ?? "—"} reps ×{" "}
              {s.weight === 0 ? "BW" : `${s.weight} kg`} • rest {s.rest_seconds}
              s
            </Text>
          ))}
        </View>
      ))}

      <Pressable onPress={handlePlay} style={styles.playBtn}>
        <Play size={18} color="#FFFFFF" />
        <Text style={styles.btnText}>Play Session</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push(`/workout/create?workoutId=${wid}`)}
        style={[styles.secondaryBtn, { borderColor: colors.border }]}
      >
        <Pencil size={16} color={colors.text} />
        <Text style={[styles.btnText, { color: colors.text }]}>Edit</Text>
      </Pressable>

      {!workout.is_template && (
        <Pressable
          onPress={saveAsTemplate}
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
        >
          <BookmarkPlus size={16} color={colors.text} />
          <Text style={[styles.btnText, { color: colors.text }]}>
            Save as template
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={destroy}
        style={[styles.secondaryBtn, { borderColor: "#B3261E" }]}
      >
        <Trash2 size={16} color="#B3261E" />
        <Text style={[styles.btnText, { color: "#B3261E" }]}>Delete</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  name: { fontSize: 24, fontWeight: "700" },
  sub: { fontSize: 13, marginTop: -8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
  },
  cardText: { flex: 1, fontSize: 14 },
  remind: { fontSize: 11 },
  exCard: { borderRadius: 14, padding: 14, gap: 6 },
  exName: { fontSize: 15, fontWeight: "600" },
  setText: { fontSize: 13 },
  playBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.green,
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 6,
  },
  secondaryBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
