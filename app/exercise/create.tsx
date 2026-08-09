import { palette, useTheme } from '@core/ui/theme';
import { useCreateExercise } from '@modules/exercises/useExercises';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body',
];

export default function CreateExerciseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const create = useCreateExercise();

  const [name, setName] = useState('');
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
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.subtext }]}>Exercise name *</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Bench Press"
        placeholderTextColor={colors.subtext}
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
      />

      <Text style={[styles.label, { color: colors.subtext }]}>Muscle group</Text>
      <View style={styles.chipRow}>
        {MUSCLE_GROUPS.map((g) => (
          <Pressable
            key={g}
            onPress={() => setGroup(g === group ? null : g)}
            style={[
              styles.chip,
              { backgroundColor: g === group ? palette.green : colors.surface },
            ]}
          >
            <Text style={[styles.chipText, { color: g === group ? '#FFFFFF' : colors.text }]}>
              {g}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={save} disabled={!canSave} style={[styles.saveBtn, !canSave && { opacity: 0.5 }]}>
        {create.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveText}>Create Exercise</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  input: { borderRadius: 14, padding: 16, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  chipText: { fontSize: 13, fontWeight: '600' },
  saveBtn: {
    backgroundColor: palette.green, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', marginTop: 10,
  },
  saveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
});