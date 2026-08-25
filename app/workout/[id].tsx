import { useStartSession } from "@/src/modules/session-player/useSessionPlayer";
import { dialog } from "@core/ui/dialogStore";
import { Section } from "@core/ui/Section";
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
  Clock,
  History,
  Pencil,
  Play,
  Trash2,
} from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const wid = Number(id);
  const { colors, mode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 140 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.name, { color: colors.text }]}>
          {workout.name}
        </Text>
        <Text style={[styles.sub, { color: colors.subtext }]}>
          {workout.is_template ? "template" : "workout"} •{" "}
          {workout.exercises.length}{" "}
          {workout.exercises.length === 1 ? "exercise" : "exercises"}
        </Text>

        {sc && (
          <Section title="Schedule">
            <View style={styles.scheduleRow}>
              <View
                style={[
                  styles.iconTile,
                  { backgroundColor: colors.accent + "1A" },
                ]}
              >
                <CalendarDays size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.scheduleMain, { color: colors.text }]}>
                  {sc.schedule_type === "once"
                    ? `${sc.target_date} @ ${sc.time}`
                    : `${dayLabels} @ ${sc.time}`}
                </Text>
                <View style={styles.reminderRow}>
                  <Clock size={11} color={colors.subtext} />
                  <Text style={[styles.remind, { color: colors.subtext }]}>
                    {sc.reminder_enabled ? "reminder on" : "reminder off"}
                  </Text>
                </View>
              </View>
            </View>
          </Section>
        )}

        <Section title={`Exercises (${workout.exercises.length})`}>
          {workout.exercises.map((we) => (
            <View
              key={we.id}
              style={[
                styles.exCard,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
            >
              <View style={styles.exHead}>
                <Text style={[styles.exName, { color: colors.text }]}>
                  {we.exercise_name}
                </Text>
                <Text style={[styles.exCount, { color: colors.subtext }]}>
                  {we.sets.length} {we.sets.length === 1 ? "set" : "sets"}
                </Text>
              </View>

              <View style={styles.setRow}>
                <Text
                  style={[
                    styles.setHead,
                    styles.setNum,
                    { color: colors.subtext },
                  ]}
                >
                  #
                </Text>
                <Text
                  style={[
                    styles.setHead,
                    styles.setCol,
                    { color: colors.subtext },
                  ]}
                >
                  type
                </Text>
                <Text
                  style={[
                    styles.setHead,
                    styles.setCol,
                    { color: colors.subtext },
                  ]}
                >
                  value
                </Text>
                <Text
                  style={[
                    styles.setHead,
                    styles.setCol,
                    { color: colors.subtext },
                  ]}
                >
                  kg
                </Text>
                <Text
                  style={[
                    styles.setHead,
                    styles.setCol,
                    { color: colors.subtext },
                  ]}
                >
                  rest s
                </Text>
              </View>

              {we.sets.map((s) => {
                const type = s.set_type ?? "reps";
                const value =
                  type === "time"
                    ? `${s.reps ?? ""}`
                    : s.reps != null
                      ? String(s.reps)
                      : "—";
                const kg =
                  type === "time" ? "—" : s.weight ? String(s.weight) : "0";
                return (
                  <View key={s.id} style={styles.setRow}>
                    <Text style={[styles.setNum, { color: colors.subtext }]}>
                      {s.set_number}
                    </Text>
                    <View
                      style={[
                        styles.typePill,
                        {
                          backgroundColor:
                            type === "time"
                              ? colors.accent + "1A"
                              : colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.typePillText, { color: colors.text }]}
                      >
                        {type === "time" ? "Hold" : "Reps"}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.setCol,
                        styles.setCell,
                        { color: colors.text, borderColor: colors.border },
                      ]}
                    >
                      {value}
                    </Text>
                    <Text
                      style={[
                        styles.setCol,
                        styles.setCell,
                        { color: colors.text, borderColor: colors.border },
                      ]}
                    >
                      {kg}
                    </Text>
                    <Text
                      style={[
                        styles.setCol,
                        styles.setCell,
                        { color: colors.text, borderColor: colors.border },
                      ]}
                    >
                      {s.rest_seconds}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </Section>
      </ScrollView>

      {/* pinned actions */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.bg,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 18,
          },
        ]}
      >
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => router.push(`/workout/create?workoutId=${wid}`)}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
          >
            <Pencil size={16} color={colors.text} />
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              Edit
            </Text>
          </Pressable>
          {!workout.is_template && (
            <Pressable
              onPress={saveAsTemplate}
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
            >
              <BookmarkPlus size={16} color={colors.text} />
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                Template
              </Text>
            </Pressable>
          )}
        </View>
        <Pressable onPress={destroy} style={[styles.destroyBtn]}>
          <Trash2 size={16} color="#B3261E" />
          <Text style={[styles.secondaryBtnText, { color: "#B3261E" }]}>
            Delete
          </Text>
        </Pressable>
      </View>

      {/* play session floating primary */}
      {!workout.is_template && (
        <View style={[styles.playFloat, { paddingBottom: insets.bottom + 18 }]}>
          <Pressable
            onPress={handlePlay}
            disabled={startSession.isPending}
            style={[styles.playBtn, startSession.isPending && { opacity: 0.7 }]}
          >
            {startSession.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Play size={18} color="#FFFFFF" />
                <Text style={styles.playText}>Play Session</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 140 },
  name: { fontSize: 24, fontWeight: "700" },
  sub: { fontSize: 13, marginTop: -8 },
  scheduleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleMain: { fontSize: 15, fontWeight: "600" },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  remind: { fontSize: 11, letterSpacing: 0.5 },
  exCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 12,
  },
  exHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.15)",
  },
  exName: { fontSize: 15, fontWeight: "600", flex: 1 },
  exCount: { fontSize: 12, fontWeight: "600" },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  setHead: { fontSize: 11, fontWeight: "700" },
  setNum: { width: 16, fontSize: 12, fontWeight: "600" },
  setCol: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
  },
  setCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  typePill: {
    flex: 1,
    minWidth: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    alignItems: "center",
  },
  typePillText: { fontSize: 10, fontWeight: "700" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 80,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  actionRow: { flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  secondaryBtnText: { fontWeight: "700", fontSize: 14 },
  destroyBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#B3261E",
    backgroundColor: "#B3261E10",
  },
  playFloat: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  playBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.green,
    borderRadius: 16,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  playText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
