import { palette, useTheme } from '@core/ui/theme';
import { CalendarDays } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, backgroundColor: colors.bg }]}>
      <CalendarDays size={28} color={palette.green} />
      <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
      <Text style={[styles.sub, { color: colors.subtext }]}>month view + history — Phase 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  sub: { fontSize: 13 },
});