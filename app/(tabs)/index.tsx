import { Header } from '@core/ui/Header';
import { palette, useTheme } from '@core/ui/theme';
import { GalleryHorizontalEnd, Map, Play, Plus, TrendingUp, type LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function InfoCard({ Icon, title, sub }: { Icon: LucideIcon; title: string; sub: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Icon size={22} color={palette.green} />
      <View style={{ gap: 2 }}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.cardSub, { color: colors.subtext }]}>{sub}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <InfoCard Icon={GalleryHorizontalEnd} title="Hero carousel" sub="rotating highlights — Phase 3" />
        <InfoCard Icon={TrendingUp} title="Trend line" sub="consistency at a glance — Phase 3" />
        <InfoCard Icon={Play} title="Resume session" sub="appears when a workout is in progress" />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your journeys</Text>
        <InfoCard Icon={Map} title="Journeys list" sub="active + completed — Phase 1" />

        <Pressable style={styles.createBtn}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createText}>Create Journey</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, gap: 12, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 18,
  },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardSub: { fontSize: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.green,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  createText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
});