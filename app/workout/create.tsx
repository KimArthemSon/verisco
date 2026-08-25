import { Chip } from "@core/ui/Chip";
import { dialog } from "@core/ui/dialogStore";
import { Section } from "@core/ui/Section";
import { palette, useTheme } from "@core/ui/theme";
import { Toggle } from "@core/ui/Toggle";
import { toISODate, WEEK_DAYS } from "@core/utils/dates";
import { useDraftStore } from "@modules/workouts/draftStore";
import {
  createWorkout,
  updateWorkout,
  type WorkoutInput,
} from "@modules/workouts/repository";
import {
  getSchedulesByWorkout,
  saveSchedule,
} from "@modules/workouts/schedules";
import { useTemplates, useWorkoutDetail } from "@modules/workouts/useWorkouts";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function CreateWorkoutScreen() {
  const params = useLocalSearchParams<{
    journeyId?: string;
    workoutId?: string;
    asTemplate?: string;
  }>();
  const journeyId = params.journeyId ? Number(params.journeyId) : null;
  const editId = params.workoutId ? Number(params.workoutId) : null;
  const asTemplate = params.asTemplate === "1";

  const { colors, mode } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const draft = useDraftStore();

  const { data: templates } = useTemplates();
  const [templateId, setTemplateId] = useState<number | null>(null);
  const { data: editDetail } = useWorkoutDetail(editId ?? 0);
  const { data: templateDetail } = useWorkoutDetail(templateId ?? 0);

  const [name, setName] = useState("");
  const [useTemplate, setUseTemplate] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const [schedType, setSchedType] = useState<"once" | "weekly">("weekly");
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [days, setDays] = useState<number[]>([1]);
  const [time, setTime] = useState("18:00");
  const [reminder, setReminder] = useState(true);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [saving, setSaving] = useState(false);

  // fresh start for new workouts
  useEffect(() => {
    if (!editId) draft.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // seed edit mode
  useEffect(() => {
    if (!editDetail) return;
    setName(editDetail.name);
    draft.loadTemplate(
      editDetail.exercises.map((we) => ({
        exercise_id: we.exercise_id,
        name: we.exercise_name,
        muscle_group: we.exercise_muscle_group,
        sets: we.sets.map((s) => ({
          set_type: s.set_type ?? "reps",
          reps: s.reps,
          weight: s.weight,
          rest_seconds: s.rest_seconds,
        })),
      })),
    );
    (async () => {
      const scheds = await getSchedulesByWorkout(editDetail.id);
      const sc = scheds[0];
      if (sc) {
        setSchedType(sc.schedule_type);
        setTargetDate(sc.target_date);
        if (sc.days_of_week) setDays(JSON.parse(sc.days_of_week));
        if (sc.time) setTime(sc.time);
        setReminder(!!sc.reminder_enabled);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editDetail]);

  // load chosen template into draft
  useEffect(() => {
    if (templateId && templateDetail) {
      draft.loadTemplate(
        templateDetail.exercises.map((we) => ({
          exercise_id: we.exercise_id,
          name: we.exercise_name,
          muscle_group: we.exercise_muscle_group,
          sets: we.sets.map((s) => ({
            set_type: s.set_type ?? "reps",
            reps: s.reps,
            weight: s.weight,
            rest_seconds: s.rest_seconds,
          })),
        })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateDetail]);

  const canSave =
    name.trim().length > 0 && draft.exercises.length > 0 && !saving;

  const save = async () => {
    if (!canSave) return;
    if (schedType === "once" && !targetDate)
      return dialog.alert(
        "Pick a date for the schedule.",
        undefined,
        [{ label: "OK" }],
        { icon: CalendarDays },
      );
    if (schedType === "weekly" && days.length === 0)
      return dialog.alert(
        "Pick at least one day.",
        undefined,
        [{ label: "OK" }],
        { icon: CalendarDays },
      );

    const input: WorkoutInput = {
      name: name.trim(),
      journey_id: editId ? (editDetail?.journey_id ?? null) : journeyId,
      is_template: editId ? editDetail?.is_template === 1 : asTemplate,
      exercises: draft.exercises.map((e) => ({
        exercise_id: e.exercise_id,
        sets: e.sets,
      })),
    };

    setSaving(true);
    try {
      const id = editId ?? (await createWorkout(input));
      if (editId) await updateWorkout(editId, input);
      await saveSchedule({
        workout_id: id,
        schedule_type: schedType,
        target_date: schedType === "once" ? targetDate : null,
        days_of_week: schedType === "weekly" ? days : undefined,
        time,
        reminder_enabled: reminder,
      });
      draft.reset();
      qc.invalidateQueries({ queryKey: ["workouts"] });
      router.back();
    } catch (e) {
      dialog.alert("Save failed", String(e), [{ label: "OK" }], {
        icon: AlertTriangle,
      });
    }
    setSaving(false);
  };

  const timeDate = (() => {
    const [h, m] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  })();

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Section title="Workout details">
          <Text style={[styles.label, { color: colors.subtext }]}>
            Workout name *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Push Day A"
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
        </Section>

        {!editId && !asTemplate && (
          <Section
            title="Template start"
            subtitle="Optional — reuse a saved workout as a base."
          >
            <Toggle
              label="Start from template"
              value={useTemplate}
              onValueChange={setUseTemplate}
            />
            {useTemplate && (
              <View style={styles.chipRow}>
                {(templates ?? []).map((t) => (
                  <Chip
                    key={t.id}
                    label={t.name}
                    selected={templateId === t.id}
                    onPress={() => setTemplateId(t.id)}
                  />
                ))}
                <Chip
                  label="+ blank template"
                  onPress={() => router.push("/workout/create?asTemplate=1")}
                />
              </View>
            )}
          </Section>
        )}

        <Section title="Exercises *" subtitle="Build your routine in order.">
          {draft.exercises.map((e) => (
            <View
              key={e.exercise_id}
              style={[
                styles.exCard,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
            >
              <Pressable
                style={styles.exHead}
                onPress={() =>
                  setExpanded(expanded === e.exercise_id ? null : e.exercise_id)
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exName, { color: colors.text }]}>
                    {e.name}
                  </Text>
                  <Text style={[styles.exSub, { color: colors.subtext }]}>
                    {e.sets.length} sets
                  </Text>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() => draft.removeExercise(e.exercise_id)}
                >
                  <Trash2 size={16} color={colors.subtext} />
                </Pressable>
                {expanded === e.exercise_id ? (
                  <ChevronDown size={16} color={colors.subtext} />
                ) : (
                  <ChevronRight size={16} color={colors.subtext} />
                )}
              </Pressable>

              {expanded === e.exercise_id && (
                <View style={styles.setsWrap}>
                  {/* header row */}
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
                        styles.setInput,
                        { color: colors.subtext },
                      ]}
                    >
                      type
                    </Text>
                    <Text
                      style={[
                        styles.setHead,
                        styles.setInput,
                        { color: colors.subtext },
                      ]}
                    >
                      value
                    </Text>
                    <Text
                      style={[
                        styles.setHead,
                        styles.setInput,
                        { color: colors.subtext },
                      ]}
                    >
                      kg
                    </Text>
                    <Text
                      style={[
                        styles.setHead,
                        styles.setInput,
                        { color: colors.subtext },
                      ]}
                    >
                      rest s
                    </Text>
                    <View style={{ width: 32 }} />
                  </View>

                  {/* set rows */}
                  {e.sets.map((st, i) => (
                    <View key={i} style={styles.setRow}>
                      <Text style={[styles.setNum, { color: colors.subtext }]}>
                        {i + 1}
                      </Text>

                      <Pressable
                        onPress={() =>
                          draft.updateSet(e.exercise_id, i, {
                            set_type: st.set_type === "time" ? "reps" : "time",
                            ...(st.set_type === "time" ? { weight: 0 } : {}),
                          })
                        }
                        style={[
                          styles.typePill,
                          {
                            backgroundColor:
                              st.set_type === "time"
                                ? colors.accent + "1A"
                                : colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.typePillText, { color: colors.text }]}
                        >
                          {st.set_type === "time" ? "Hold" : "Reps"}
                        </Text>
                      </Pressable>

                      <TextInput
                        style={[
                          styles.setInput,
                          {
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderColor: colors.border,
                          },
                        ]}
                        keyboardType="number-pad"
                        value={st.reps?.toString() ?? ""}
                        placeholder={st.set_type === "time" ? "30" : "8"}
                        placeholderTextColor={colors.subtext}
                        onChangeText={(t) =>
                          draft.updateSet(e.exercise_id, i, {
                            reps: t === "" ? null : Number(t),
                          })
                        }
                      />

                      {st.set_type === "reps" ? (
                        <TextInput
                          style={[
                            styles.setInput,
                            {
                              backgroundColor: colors.bg,
                              color: colors.text,
                              borderColor: colors.border,
                            },
                          ]}
                          keyboardType="number-pad"
                          value={st.weight.toString()}
                          placeholder="0"
                          placeholderTextColor={colors.subtext}
                          onChangeText={(t) =>
                            draft.updateSet(e.exercise_id, i, {
                              weight: Number(t) || 0,
                            })
                          }
                        />
                      ) : (
                        <View style={styles.setInputSpacer} />
                      )}

                      <TextInput
                        style={[
                          styles.setInput,
                          {
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderColor: colors.border,
                          },
                        ]}
                        keyboardType="number-pad"
                        value={st.rest_seconds.toString()}
                        placeholder="60"
                        placeholderTextColor={colors.subtext}
                        onChangeText={(t) =>
                          draft.updateSet(e.exercise_id, i, {
                            rest_seconds: Number(t) || 0,
                          })
                        }
                      />

                      {/* delete set */}
                      <Pressable
                        hitSlop={10}
                        disabled={e.sets.length <= 1}
                        onPress={() => draft.removeSet(e.exercise_id, i)}
                        style={[
                          styles.deleteSetBtn,
                          e.sets.length <= 1 && styles.deleteSetDisabled,
                        ]}
                      >
                        <Trash2
                          size={14}
                          color={
                            e.sets.length <= 1 ? colors.subtext : "#B3261E"
                          }
                        />
                      </Pressable>
                    </View>
                  ))}

                  <Pressable
                    onPress={() => draft.addSet(e.exercise_id)}
                    style={styles.addSet}
                  >
                    <Plus size={14} color={palette.green} />
                    <Text style={styles.addSetText}>add set</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
          <Pressable
            onPress={() => router.push("/exercise/list")}
            style={[
              styles.addExBtn,
              {
                borderColor: colors.accent,
                borderWidth: 1,
                borderStyle: "dashed",
                backgroundColor: colors.bg,
              },
            ]}
          >
            <Plus size={18} color={colors.accent} />
            <Text
              style={[
                styles.addSetText,
                { fontSize: 14, color: colors.accent },
              ]}
            >
              add exercises
            </Text>
          </Pressable>
        </Section>

        <Section title="Schedule & alerts">
          <View style={styles.chipRow}>
            {(["once", "weekly"] as const).map((t) => (
              <Chip
                key={t}
                label={t}
                selected={schedType === t}
                onPress={() => setSchedType(t)}
              />
            ))}
          </View>

          {schedType === "once" ? (
            <View style={{ gap: 6 }}>
              <Pressable
                onPress={() => setShowDate((s) => !s)}
                style={[
                  styles.field,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                ]}
              >
                <CalendarDays
                  size={18}
                  color={mode === "dark" ? "#FFFFFF" : "#000000"}
                />
                <Text style={[styles.fieldText, { color: colors.text }]}>
                  {targetDate ?? "tap to pick a date"}
                </Text>
              </Pressable>
              {showDate && (
                <DateTimePicker
                  value={
                    targetDate ? new Date(`${targetDate}T00:00:00`) : new Date()
                  }
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  themeVariant="light"
                  onChange={(e, d) => {
                    if (Platform.OS === "android") setShowDate(false);
                    if (d) setTargetDate(toISODate(d));
                  }}
                />
              )}
            </View>
          ) : (
            <View style={styles.chipRow}>
              {WEEK_DAYS.map((d) => (
                <Chip
                  key={d.label}
                  label={d.label}
                  selected={days.includes(d.value)}
                  onPress={() =>
                    setDays((prev) =>
                      prev.includes(d.value)
                        ? prev.filter((x) => x !== d.value)
                        : [...prev, d.value],
                    )
                  }
                />
              ))}
            </View>
          )}

          <Pressable
            onPress={() => setShowTime((s) => !s)}
            style={[
              styles.field,
              { backgroundColor: colors.bg, borderColor: colors.border },
            ]}
          >
            <Clock size={18} color={palette.green} />
            <Text style={[styles.fieldText, { color: colors.text }]}>
              {time}
            </Text>
          </Pressable>
          {showTime && (
            <View
              style={{
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: colors.surface,
              }}
            >
              <DateTimePicker
                value={timeDate}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(e, d) => {
                  if (Platform.OS === "android") setShowTime(false);
                  if (d)
                    setTime(
                      `${String(d.getHours()).padStart(2, "0")}:${String(
                        d.getMinutes(),
                      ).padStart(2, "0")}`,
                    );
                }}
              />
              {Platform.OS === "ios" && (
                <Pressable
                  onPress={() => setShowTime(false)}
                  style={styles.doneBtn}
                >
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              )}
            </View>
          )}

          <Toggle
            label="Remind me at scheduled time"
            value={reminder}
            onValueChange={setReminder}
          />
        </Section>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.bg, borderTopColor: colors.border },
        ]}
      >
        <Text style={[styles.helper, { color: colors.subtext }]}>
          {canSave
            ? "Ready to save this workout."
            : "Add a name and at least one exercise to continue."}
        </Text>
        <Pressable
          onPress={save}
          disabled={!canSave}
          style={[styles.saveBtn, !canSave && { opacity: 0.5 }]}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveText}>
              {editId
                ? "Save Changes"
                : asTemplate
                  ? "Create Template"
                  : "Create Workout"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 140 },
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  exCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  exHead: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  exName: { fontSize: 15, fontWeight: "600" },
  exSub: { fontSize: 12 },
  setsWrap: { paddingHorizontal: 14, paddingBottom: 14, gap: 6 },
  setRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  setHead: { fontSize: 11, fontWeight: "700" },
  setNum: { width: 16, fontSize: 12, fontWeight: "600" },
  typePill: {
    flex: 1,
    minWidth: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  typePillText: { fontSize: 10, fontWeight: "700" },
  setInput: {
    flex: 1,
    minWidth: 40,
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    fontSize: 13,
    textAlign: "center",
  },
  setInputSpacer: { flex: 1, minWidth: 40 },
  addSet: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 4 },
  deleteSetBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B3261E15",
  },
  deleteSetDisabled: { opacity: 0.3, backgroundColor: "transparent" },
  addSetText: { color: palette.green, fontSize: 12, fontWeight: "700" },
  addExBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  fieldText: { flex: 1, fontSize: 15 },
  doneBtn: {
    backgroundColor: palette.green,
    paddingVertical: 12,
    alignItems: "center",
  },
  doneText: { color: "#FFFFFF", fontWeight: "700" },
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
