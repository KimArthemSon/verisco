import { Bell, Leaf, Moon, Sun } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, useTheme } from './theme';

export function Header() {
  const insets = useSafeAreaInsets();
  const { colors, mode, toggle } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top, backgroundColor: colors.bg, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.brand}>
          <Leaf size={20} color={palette.green} />
          <Text style={[styles.wordmark, { color: colors.text }]}>Viresco</Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={toggle} hitSlop={8} style={styles.iconBtn}>
            {mode === 'dark' ? (
              <Sun size={20} color={colors.text} />
            ) : (
              <Moon size={20} color={colors.text} />
            )}
          </Pressable>

          <Pressable
            onPress={() => Alert.alert('Reminders', 'Notification center arrives in Phase 4.')}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Bell size={20} color={colors.text} />
            <View style={[styles.badge, { borderColor: colors.bg }]} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontSize: 20, fontWeight: '700', letterSpacing: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBtn: { position: 'relative', padding: 2 },
  badge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.green,
    borderWidth: 1.5,
  },
});