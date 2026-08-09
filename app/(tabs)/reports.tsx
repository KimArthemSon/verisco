import { palette, useTheme } from "@core/ui/theme";
import { daysBetween, todayISO } from "@core/utils/dates";
import { exportCertificate } from "@core/utils/pdf";
import { useJourneys } from "@modules/journeys/useJourneys";
import {
  buildStats,
  getReportSessions,
  inLastDays,
  personalRecords,
  scheduledOccurrences,
  totals,
  weeklyVolume,
} from "@modules/reports/analytics";
import { getWorkoutsByJourney } from "@modules/workouts/repository";
import { useAllSchedules } from "@modules/workouts/useSchedules";
import { useQuery } from "@tanstack/react-query";
import { FileText, Trophy } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PERIODS = [
  { label: "W", days: 7 },
  { label: "M", days: 30 },
  { label: "3M", days: 90 },
  { label: "Y", days: 365 },
];

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data: journeys } = useJourneys();
  const { data: allSchedules } = useAllSchedules();

  const [journeyId, setJourneyId] = useState<number | null>(null);
  const [period, setPeriod] = useState(30);
  const [exporting, setExporting] = useState(false);

  const selectedJourney = journeys?.find((j) => j.id === journeyId) ?? null;

  const { data: sessions } = useQuery({
    queryKey: ["reports", journeyId],
    queryFn: () => getReportSessions(journeyId),
  });

  const scoped = inLastDays(sessions ?? [], period);
  const t = totals(scoped);
  const weekly = weeklyVolume(scoped);
  const prs = personalRecords(scoped).slice(0, 5);

  const consistency = (() => {
    if (!selectedJourney || !allSchedules) return null;
    const occ = scheduledOccurrences(
      allSchedules.filter((s) => true), // filtered below when journey selected
      period,
    );
    return occ > 0 ? Math.min(100, Math.round((t.sessions / occ) * 100)) : null;
  })();

  const handleExport = async () => {
    if (!selectedJourney) {
      return Alert.alert(
        "Select a journey",
        "Pick a journey chip above to export its certificate.",
      );
    }
    setExporting(true);
    try {
      const all = await getReportSessions(selectedJourney.id);
      const workouts = await getWorkoutsByJourney(selectedJourney.id);
      const ids = new Set(workouts.map((w) => w.id));
      const scheds = (allSchedules ?? []).filter((s) => ids.has(s.workout_id));
      const days = Math.max(
        1,
        daysBetween(selectedJourney.start_date, todayISO()) + 1,
      );
      await exportCertificate(selectedJourney, buildStats(all, scheds, days));
    } catch (e) {
      Alert.alert("Export failed", String(e));
    }
    setExporting(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Reports</Text>

        {/* Journey chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 4 }}
          contentContainerStyle={styles.chipRow}
        >
          <Pressable
            onPress={() => setJourneyId(null)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  journeyId === null ? palette.green : colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: journeyId === null ? "#FFFFFF" : colors.text },
              ]}
            >
              All
            </Text>
          </Pressable>
          {(journeys ?? []).map((j) => (
            <Pressable
              key={j.id}
              onPress={() => setJourneyId(j.id)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    journeyId === j.id ? palette.green : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: journeyId === j.id ? "#FFFFFF" : colors.text },
                ]}
              >
                {j.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Period chips */}
        <View style={styles.chipRow}>
          {PERIODS.map((p) => (
            <Pressable
              key={p.label}
              onPress={() => setPeriod(p.days)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    period === p.days ? palette.green : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: period === p.days ? "#FFFFFF" : colors.text },
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Volume trend */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Volume trend
          </Text>
          {weekly.length > 0 ? (
            <LineChart
              data={weekly.map((w) => ({ value: w.value, label: w.label }))}
              color={palette.green}
              thickness={2}
              height={150}
              spacing={44}
              hideRules
              dataPointsColor={palette.green}
              dataPointsRadius={3}
              xAxisColor={colors.border}
              yAxisColor={colors.border}
              xAxisLabelTextStyle={{ color: colors.subtext, fontSize: 9 }}
              yAxisTextStyle={{ color: colors.subtext, fontSize: 9 }}
            />
          ) : (
            <Text style={[styles.empty, { color: colors.subtext }]}>
              no completed sessions in this period
            </Text>
          )}
        </View>

        {/* Stat cards */}
        <View style={styles.statGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {t.sessions}
            </Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>
              sessions
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {consistency !== null ? `${consistency}%` : "—"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>
              consistency
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {t.volume.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>
              kg volume
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {t.sets}
            </Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>
              sets done
            </Text>
          </View>
        </View>

        {/* Personal records */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.prHead}>
            <Trophy size={16} color={palette.green} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Personal records
            </Text>
          </View>
          {prs.length === 0 && (
            <Text style={[styles.empty, { color: colors.subtext }]}>
              no records yet
            </Text>
          )}
          {prs.map((p) => (
            <View key={p.exercise_name} style={styles.prRow}>
              <Text style={[styles.prName, { color: colors.text }]}>
                {p.exercise_name}
              </Text>
              <Text style={[styles.prValue, { color: palette.green }]}>
                {p.weight} kg × {p.reps}
              </Text>
            </View>
          ))}
        </View>

        {/* Export certificate */}
        <Pressable
          onPress={handleExport}
          disabled={exporting}
          style={[styles.exportBtn, !selectedJourney && { opacity: 0.6 }]}
        >
          {exporting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <FileText size={18} color="#FFFFFF" />
              <Text style={styles.exportText}>
                Export Portfolio Certificate
              </Text>
            </>
          )}
        </Pressable>
        {!selectedJourney && (
          <Text style={[styles.hint, { color: colors.subtext }]}>
            select a journey above to enable export
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, gap: 14, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700" },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 0,
    paddingVertical: 2,
  },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  chipText: { fontSize: 12, fontWeight: "700" },
  card: { borderRadius: 16, padding: 16, gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  empty: { fontSize: 12, textAlign: "center", paddingVertical: 20 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { flexBasis: "47%", borderRadius: 14, padding: 14, gap: 2 },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, letterSpacing: 0.5 },
  prHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  prRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  prName: { fontSize: 13 },
  prValue: { fontSize: 13, fontWeight: "700" },
  exportBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.green,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
  },
  exportText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  hint: { fontSize: 11, textAlign: "center", marginTop: -6 },
});
