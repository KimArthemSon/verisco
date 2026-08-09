import { palette, useTheme } from '@core/ui/theme';
import { todayISO, toISODate, WEEK_DAYS } from '@core/utils/dates';
import { useDraftStore } from '@modules/workouts/draftStore';
import { getSchedulesByWorkout, saveSchedule } from '@modules/workouts/schedules';
import { createWorkout, updateWorkout, type WorkoutInput } from '@modules/workouts/repository';
import { useTemplates, useWorkoutDetail } from '@modules/workouts/useWorkouts';
import { useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, ChevronDown, ChevronRight, Clock, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet,
  Switch, Text, TextInput, View,
} from 'react-native';

export default function CreateWorkoutScreen() {
  const params = useLocalSearchParams<{ journeyId?: string; workoutId?: string; asTemplate?: string }>();
  const journeyId = params.journeyId ? Number(params.journeyId) : null;
  const editId = params.workoutId ? Number(params.workoutId) : null;
  const asTemplate = params.asTemplate === '1';

  const { colors } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const draft = useDraftStore();

  const { data: templates } = useTemplates();
  const { data: editDetail } = useWorkoutDetail(editId ?? 0);
  const { data: templateDetail } = useWorkoutDetail(templateId ?? 0);

  const [name, setName] = useState('');
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const [schedType, setSchedType] = useState<'once' | 'weekly'>('weekly');
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [days, setDays] = useState<number[]>([1]);
  const [time, setTime] = useState('18:00');
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
        sets: we.sets.map((s) => ({ reps: s.reps, weight: s.weight, rest_seconds: s.rest_seconds })),
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
          sets: we.sets.map((s) => ({ reps: s.reps, weight: s.weight, rest_seconds: s.rest_seconds })),
        })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateDetail]);

  const canSave = name.trim().length > 0 && draft.exercises.length > 0 && !saving;

  const save = async () => {
    if (!canSave) return;
    if (schedType === 'once' && !targetDate) return Alert.alert('Pick a date for the schedule.');
    if (schedType === 'weekly' && days.length === 0) return Alert.alert('Pick at least one day.');

    const input: WorkoutInput = {
      name: name.trim(),
      journey_id: editId ? editDetail?.journey_id ?? null : journeyId,
      is_template: editId ? editDetail?.is_template === 1 : asTemplate,
      exercises: draft.exercises.map((e) => ({ exercise_id: e.exercise_id, sets: e.sets })),
    };

    setSaving(true);
    try {
      const id = editId ?? (await createWorkout(input));
      if (editId) await updateWorkout(editId, input);
      await saveSchedule({
        workout_id: id,
        schedule_type: schedType,
        target_date: schedType === 'once' ? targetDate : null,
        days_of_week: schedType === 'weekly' ? days : undefined,
        time,
        reminder_enabled: reminder,
      });
      draft.reset();
      qc.invalidateQueries({ queryKey: ['workouts'] });
      router.back();
    } catch (e) {
      Alert.alert('Save failed', String(e));
    }
    setSaving(false);
  };

  const timeDate = (() => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  })();

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.bg }]} keyboardShouldPersistTaps="handled">
      {/* NAME */}
      <Text style={[styles.label, { color: colors.subtext }]}>Workout name *</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Push Day A"
        placeholderTextColor={colors.subtext}
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
      />

      {/* TEMPLATE */}
      {!editId && !asTemplate && (
        <>
          <View style={styles.toggleRow}>
            <Text style={[styles.label, { color: colors.subtext }]}>Start from template</Text>
            <Switch value={useTemplate} onValueChange={setUseTemplate} trackColor={{ true: palette.green }} />
          </View>
          {useTemplate && (
            <View style={styles.chipRow}>
              {(templates ?? []).map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setTemplateId(t.id)}
                  style={[styles.chip, { backgroundColor: templateId === t.id ? palette.green : colors.surface }]}
                >
                  <Text style={[styles.chipText, { color: templateId === t.id ? '#FFFFFF' : colors.text }]}>{t.name}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => router.push('/workout/create?asTemplate=1')} style={[styles.chip, { borderColor: palette.green, borderWidth: 1 }]}>
                <Text style={[styles.chipText, { color: palette.green }]}>+ blank template</Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      {/* EXERCISES */}
      <Text style={[styles.section, { color: colors.text }]}>Exercises *</Text>
      {draft.exercises.map((e) => (
        <View key={e.exercise_id} style={[styles.exCard, { backgroundColor: colors.surface }]}>
          <Pressable style={styles.exHead} onPress={() => setExpanded(expanded === e.exercise_id ? null : e.exercise_id)}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.exName, { color: colors.text }]}>{e.name}</Text>
              <Text style={[styles.exSub, { color: colors.subtext }]}>{e.sets.length} sets</Text>
            </View>
            <Pressable hitSlop={8} onPress={() => draft.removeExercise(e.exercise_id)}>
              <Trash2 size={16} color={colors.subtext} />
            </Pressable>
            {expanded === e.exercise_id ? <ChevronDown size={16} color={colors.subtext} /> : <ChevronRight size={16} color={colors.subtext} />}
          </Pressable>

          {expanded === e.exercise_id && (
            <View style={styles.setsWrap}>
              <View style={styles.setRow}>
                <Text style={[styles.setHead, { color: colors.subtext }]}>#</Text>
                <Text style={[styles.setHead, styles.setInput, { color: colors.subtext }]}>reps</Text>
                <Text style={[styles.setHead, styles.setInput, { color: colors.subtext }]}>kg</Text>
                <Text style={[styles.setHead, styles.setInput, { color: colors.subtext }]}>rest s</Text>
                <View style={{ width: 14 }} />
              </View>
              {e.sets.map((st, i) => (
                <View key={i} style={styles.setRow}>
                  <Text style={[styles.setNum, { color: colors.subtext }]}>{i + 1}</Text>
                  <TextInput
                    style={[styles.setInput, { backgroundColor: colors.bg, color: colors.text }]}
                    keyboardType="number-pad"
                    value={st.reps?.toString() ?? ''}
                    placeholder="8"
                    placeholderTextColor={colors.subtext}
                    onChangeText={(t) => draft.updateSet(e.exercise_id, i, { reps: t === '' ? null : Number(t) })}
                  />
                  <TextInput
                    style={[styles.setInput, { backgroundColor: colors.bg, color: colors.text }]}
                    keyboardType="number-pad"
                    value={st.weight.toString()}
                    placeholder="0"
                    placeholderTextColor={colors.subtext}
                    onChangeText={(t) => draft.updateSet(e.exercise_id, i, { weight: Number(t) || 0 })}
                  />
                  <TextInput
                    style={[styles.setInput, { backgroundColor: colors.bg, color: colors.text }]}
                    keyboardType="number-pad"
                    value={st.rest_seconds.toString()}
                    placeholder="60"
                    placeholderTextColor={colors.subtext}
                    onChangeText={(t) => draft.updateSet(e.exercise_id, i, { rest_seconds: Number(t) || 0 })}
                  />
                  <Pressable hitSlop={8} onPress={() => draft.removeSet(e.exercise_id, i)}>
                    <Trash2 size={14} color={colors.subtext} />
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={() => draft.addSet(e.exercise_id)} style={styles.addSet}>
                <Plus size={14} color={palette.green} />
                <Text style={styles.addSetText}>add set</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
      <Pressable onPress={() => router.push('/exercise/list')} style={[styles.addExBtn, { borderColor: palette.green, borderWidth: 1.5, borderStyle: 'dashed' }]}>
        <Plus size={18} color={palette.green} />
        <Text style={[styles.addSetText, { fontSize: 14 }]}>add exercises</Text>
      </Pressable>

      {/* SCHEDULE */}
      <Text style={[styles.section, { color: colors.text }]}>Schedule & alerts</Text>
      <View style={styles.chipRow}>
        {(['once', 'weekly'] as const).map((t) => (
          <Pressable key={t} onPress={() => setSchedType(t)} style={[styles.chip, { backgroundColor: schedType === t ? palette.green : colors.surface }]}>
            <Text style={[styles.chipText, { color: schedType === t ? '#FFFFFF' : colors.text }]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {schedType === 'once' ? (
        <View style={{ gap: 6 }}>
          <Pressable onPress={() => setShowDate((s) => !s)} style={[styles.field, { backgroundColor: colors.surface }]}>
            <CalendarDays size={18} color={palette.green} />
            <Text style={[styles.fieldText, { color: colors.text }]}>{targetDate ?? 'tap to pick a date'}</Text>
          </Pressable>
          {showDate && (
            <DateTimePicker
              value={targetDate ? new Date(`${targetDate}T00:00:00`) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => {
                if (Platform.OS === 'android') setShowDate(false);
                if (d) setTargetDate(toISODate(d));
              }}
            />
          )}
        </View>
      ) : (
        <View style={styles.chipRow}>
          {WEEK_DAYS.map((d) => (
            <Pressable
              key={d.label}
              onPress={() => setDays((prev) => (prev.includes(d.value) ? prev.filter((x) => x !== d.value) : [...prev, d.value]))}
              style={[styles.chip, { backgroundColor: days.includes(d.value) ? palette.green : colors.surface }]}
            >
              <Text style={[styles.chipText, { color: days.includes(d.value) ? '#FFFFFF' : colors.text }]}>{d.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable onPress={() => setShowTime((s) => !s)} style={[styles.field, { backgroundColor: colors.surface }]}>
        <Clock size={18} color={palette.green} />
        <Text style={[styles.fieldText, { color: colors.text }]}>{time}</Text>
      </Pressable>
      {showTime && (
        <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface }}>
          <DateTimePicker
            value={timeDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => {
              if (Platform.OS === 'android') setShowTime(false);
              if (d) setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
            }}
          />
          {Platform.OS === 'ios' && (
            <Pressable onPress={() => setShowTime(false)} style={styles.doneBtn}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.toggleRow}>
        <Text style={[styles.fieldText, { color: colors.text }]}>Remind me at scheduled time</Text>
        <Switch value={reminder} onValueChange={setReminder} trackColor={{ true: palette.green }} />
      </View>

      <Pressable onPress={save} disabled={!canSave} style={[styles.saveBtn, !canSave && { opacity: 0.5 }]}>
        {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>{editId ? 'Save Changes' : asTemplate ? 'Create Template' : 'Create Workout'}</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  section: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  input: { borderRadius: 14, padding: 16, fontSize: 15 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  chipText: { fontSize: 13, fontWeight: '600' },
  exCard: { borderRadius: 14, overflow: 'hidden' },
  exHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  exName: { fontSize: 15, fontWeight: '600' },
  exSub: { fontSize: 12 },
  setsWrap: { paddingHorizontal: 14, paddingBottom: 14, gap: 6 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setHead: { fontSize: 11, fontWeight: '700' },
  setNum: { width: 12, fontSize: 13 },
  setInput: { width: 56, borderRadius: 10, padding: 8, fontSize: 13, textAlign: 'center' },
  addSet: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 },
  addSetText: { color: palette.green, fontSize: 12, fontWeight: '700' },
  addExBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 16 },
  fieldText: { flex: 1, fontSize: 15 },
  doneBtn: { backgroundColor: palette.green, paddingVertical: 12, alignItems: 'center' },
  doneText: { color: '#FFFFFF', fontWeight: '700' },
  saveBtn: { backgroundColor: palette.green, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 6 },
  saveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
});