import { palette, useTheme } from '@core/ui/theme';
import { daysBetween, todayISO, toISODate } from '@core/utils/dates';
import { pickJourneyPhoto, takeJourneyPhoto } from '@core/utils/media';
import { useCreateJourney } from '@modules/journeys/useJourneys';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { CalendarDays, Camera, ChevronRight, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';

function DateField({
  label, value, optional, onChange,
}: {
  label: string;
  value: string | null;
  optional?: boolean;
  onChange: (v: string | null) => void;
}) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);
  const date = value ? new Date(`${value}T00:00:00`) : new Date();

  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
      <Pressable onPress={() => setShow((s) => !s)} style={[styles.field, { backgroundColor: colors.surface }]}>
        <CalendarDays size={18} color={palette.green} />
        <Text style={[styles.fieldText, { color: colors.text }]}>
          {value ?? (optional ? 'optional — tap to set' : 'tap to set')}
        </Text>
        {value && optional ? (
          <Pressable hitSlop={8} onPress={() => onChange(null)}>
            <Trash2 size={16} color={colors.subtext} />
          </Pressable>
        ) : (
          <ChevronRight size={16} color={colors.subtext} />
        )}
      </Pressable>

      {show && (
        <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface }}>
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => {
              if (Platform.OS === 'android') {
                setShow(false);
                if (e.type === 'set' && d) onChange(toISODate(d));
              } else if (d) {
                onChange(toISODate(d));
              }
            }}
          />
          {Platform.OS === 'ios' && (
            <Pressable onPress={() => setShow(false)} style={styles.doneBtn}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default function CreateJourneyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const create = useCreateJourney();

  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [start, setStart] = useState(todayISO());
  const [end, setEnd] = useState<string | null>(null);
  const [quote, setQuote] = useState('');

  const canSave = name.trim().length > 0 && !create.isPending;

  const photoActions = () =>
    Alert.alert('Before photo', 'Future you will want to see where you started.', [
      { text: 'Take photo', onPress: async () => setPhoto(await takeJourneyPhoto()) },
      { text: 'Choose from gallery', onPress: async () => setPhoto(await pickJourneyPhoto()) },
      ...(photo ? [{ text: 'Remove', style: 'destructive' as const, onPress: () => setPhoto(null) }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  const save = () => {
    if (!canSave) return;
    if (end && daysBetween(start, end) < 0) {
      Alert.alert('Check dates', 'End date must be after the start date.');
      return;
    }
    create.mutate(
      {
        name: name.trim(),
        start_date: start,
        end_date: end,
        before_photo_uri: photo,
        purpose_quote: quote.trim() || null,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.bg }]} keyboardShouldPersistTaps="handled">
      <Pressable onPress={photoActions} style={styles.photoWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoEmpty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Camera size={28} color={palette.green} />
            <Text style={[styles.photoHint, { color: colors.subtext }]}>
              add your before photo{'\n'}(optional, but worth it)
            </Text>
          </View>
        )}
      </Pressable>

      <Text style={[styles.label, { color: colors.subtext }]}>Journey name *</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Summer Cut 2026"
        placeholderTextColor={colors.subtext}
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
      />

      <DateField label="Start date" value={start} onChange={(v) => v && setStart(v)} />
      <DateField label="Target end date" value={end} optional onChange={setEnd} />

      <Text style={[styles.label, { color: colors.subtext }]}>Purpose / quote</Text>
      <TextInput
        value={quote}
        onChangeText={setQuote}
        placeholder="e.g. stronger every day"
        placeholderTextColor={colors.subtext}
        multiline
        style={[styles.input, styles.quote, { backgroundColor: colors.surface, color: colors.text }]}
      />

      <Pressable onPress={save} disabled={!canSave} style={[styles.saveBtn, !canSave && { opacity: 0.5 }]}>
        {create.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveText}>Start Journey</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  photoWrap: { borderRadius: 20 },
  photo: { width: '100%', height: 200, borderRadius: 20 },
  photoEmpty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoHint: { fontSize: 12, textAlign: 'center' },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 16,
  },
  fieldText: { flex: 1, fontSize: 15 },
  doneBtn: { backgroundColor: palette.green, paddingVertical: 12, alignItems: 'center' },
  doneText: { color: '#FFFFFF', fontWeight: '700' },
  input: { borderRadius: 14, padding: 16, fontSize: 15 },
  quote: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: palette.green, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', marginTop: 6,
  },
  saveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
});