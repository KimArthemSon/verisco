import { dialog } from "@core/ui/dialogStore";
import { palette, useTheme } from "@core/ui/theme";
import { useFocusRefresh, usePullRefresh } from "@core/ui/usePullRefresh";
import { daysBetween, todayISO } from "@core/utils/dates";
import { exportCertificate } from "@core/utils/pdf";
import { useJourney } from "@modules/journeys/useJourneys";
import {
  buildStats,
  finishRate,
  getReportSessions,
  personalRecords,
  totals,
  weeklyVolume,
} from "@modules/reports/analytics";
import { getWorkoutsByJourney } from "@modules/workouts/repository";
import { useAllSchedules } from "@modules/workouts/useSchedules";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  ChevronRight,
  FileText,
  Map,
  Quote,
  Trophy,
} from "lucide-react-native";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function JourneyReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const journeyId = Number(id);
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const journeyQuery = useJourney(journeyId);
  const journey = journeyQuery.data ?? null;
  const sessionsQuery = useQuery({
    queryKey: ["reports", journeyId],
    queryFn: () => getReportSessions(journeyId),
  });
  const workoutsQuery = useQuery({
    queryKey: ["workouts", journeyId],
    queryFn: () => getWorkoutsByJourney(journeyId),
  });
  const schedulesQuery = useAllSchedules();

  const sessions = sessionsQuery.data ?? [];
  const workouts = workoutsQuery.data ?? [];
  const allSchedules = schedulesQuery.data ?? [];
  const summary = totals(sessions);
  const finishPct = finishRate(sessions);
  const prs = personalRecords(sessions).slice(0, 5);
  const chart = weeklyVolume(sessions);

  const refreshAll = async () => {
    await Promise.all([
      journeyQuery.refetch(),
      sessionsQuery.refetch(),
      workoutsQuery.refetch(),
      schedulesQuery.refetch(),
    ]);
  };

  const { refreshing, onRefresh } = usePullRefresh(refreshAll);
  useFocusRefresh(refreshAll);

  const exportReport = async () => {
    if (!journey) return;
    try {
      const reportSessions = await getReportSessions(journey.id);
      const workoutList = await getWorkoutsByJourney(journey.id);
      const ids = new Set(workoutList.map((w) => w.id));
      const scheds = allSchedules.filter((schedule) =>
        ids.has(schedule.workout_id),
      );
      const totalDays = Math.max(
        1,
        daysBetween(journey.start_date, todayISO()) + 1,
      );
      await exportCertificate(
        journey,
        buildStats(reportSessions, scheds, totalDays),
      );
    } catch (error) {
      dialog.alert("Export failed", String(error), [{ label: "OK" }], {
        icon: AlertTriangle,
      });
    }
  };

  if (!journey || !sessionsQuery.data) {
    return <View style={[styles.root, { backgroundColor: colors.bg }]} />;
  }

  const active = journey.status === "active";

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.green}
            colors={[palette.green]}
          />
        }
      >
        <View
          style={[
            styles.headerBlock,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.heroWrap}>
            {journey.before_photo_uri ? (
              <Image
                source={{ uri: journey.before_photo_uri }}
                style={styles.hero}
              />
            ) : (
              <View
                style={[
                  styles.hero,
                  {
                    backgroundColor: colors.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Map size={28} color={palette.green} />
              </View>
            )}
          </View>

          <View style={styles.headerCopy}>
            <Text style={[styles.name, { color: colors.text }]}>
              {journey.name}
            </Text>
            <Text style={[styles.meta, { color: colors.subtext }]}>
              {journey.start_date} → {journey.end_date ?? "ongoing"}
            </Text>
            <View
              style={[
                styles.statusChip,
                {
                  backgroundColor: active
                    ? palette.green + "22"
                    : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: active ? palette.green : colors.subtext },
                ]}
              >
                {journey.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metricGrid}>
          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.metricLabel, { color: colors.subtext }]}>
              sessions
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {summary.sessions}
            </Text>
          </View>
          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.metricLabel, { color: colors.subtext }]}>
              finish rate
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {finishPct === null ? "—" : `${finishPct}%`}
            </Text>
          </View>
          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.metricLabel, { color: colors.subtext }]}>
              volume
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {summary.volume.toLocaleString()} kg
            </Text>
          </View>
          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.metricLabel, { color: colors.subtext }]}>
              sets
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {summary.sets}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Volume trend
          </Text>
          {chart.length > 0 ? (
            <LineChart
              data={chart.map((point) => ({
                value: point.value,
                label: point.label,
              }))}
              color={palette.green}
              thickness={2}
              height={170}
              spacing={34}
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
              no completed sessions yet
            </Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.inlineTitleRow}>
            <Trophy size={16} color={palette.green} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Personal records
            </Text>
          </View>
          {prs.length === 0 ? (
            <Text style={[styles.empty, { color: colors.subtext }]}>
              no records yet
            </Text>
          ) : (
            prs.map((pr) => (
              <View key={pr.exercise_name} style={styles.prRow}>
                <Text style={[styles.prName, { color: colors.text }]}>
                  {pr.exercise_name}
                </Text>
                <Text style={[styles.prValue, { color: palette.green }]}>
                  {pr.weight} kg × {pr.reps}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            History
          </Text>
          {sessions.length === 0 ? (
            <Text style={[styles.empty, { color: colors.subtext }]}>
              no sessions yet
            </Text>
          ) : (
            sessions.map((session) => {
              const isDone = session.status === "completed";
              const isAborted = session.status === "aborted";
              return (
                <Pressable
                  key={session.id}
                  onPress={() => router.push(`/session/${session.id}`)}
                  style={styles.historyItem}
                >
                  <View style={styles.historyLeft}>
                    <Text style={[styles.historyName, { color: colors.text }]}>
                      {session.workout_name}
                    </Text>
                    <Text
                      style={[styles.historyMeta, { color: colors.subtext }]}
                    >
                      {session.started_at?.slice(0, 10)} • {session.sets.length}{" "}
                      sets •{" "}
                      {Math.round(
                        session.sets.reduce(
                          (total, set) =>
                            total +
                            (set.weight > 0 ? (set.reps ?? 0) * set.weight : 0),
                          0,
                        ),
                      ).toLocaleString()}{" "}
                      kg
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: isDone
                          ? palette.green + "22"
                          : isAborted
                            ? "#B3261E22"
                            : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: isDone
                            ? palette.green
                            : isAborted
                              ? "#B3261E"
                              : colors.subtext,
                        },
                      ]}
                    >
                      {session.status}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.subtext} />
                </Pressable>
              );
            })
          )}
        </View>

        {journey.completion_note && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.inlineTitleRow}>
              <Quote size={16} color={palette.green} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Reflection
              </Text>
            </View>
            <Text style={[styles.reflection, { color: colors.text }]}>
              “{journey.completion_note}”
            </Text>
          </View>
        )}

        <Pressable
          onPress={exportReport}
          style={[
            styles.exportBtn,
            {
              backgroundColor: palette.green,
              opacity: journeyQuery.isFetching ? 0.7 : 1,
            },
          ]}
          disabled={journeyQuery.isFetching}
        >
          {journeyQuery.isFetching ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <FileText size={18} color="#FFFFFF" />
              <Text style={styles.exportText}>Export certificate</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  headerBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  heroWrap: { width: 88, height: 88, borderRadius: 16, overflow: "hidden" },
  hero: { width: "100%", height: "100%" },
  headerCopy: { flex: 1, gap: 6 },
  name: { fontSize: 20, fontWeight: "700" },
  meta: { fontSize: 12 },
  statusChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: { width: "47%", borderRadius: 16, padding: 16, gap: 4 },
  metricLabel: { fontSize: 11, fontWeight: "600", textTransform: "lowercase" },
  metricValue: { fontSize: 22, fontWeight: "700" },
  card: { borderRadius: 16, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  inlineTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  empty: { fontSize: 12, textAlign: "center", paddingVertical: 8 },
  prRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  prName: { fontSize: 14 },
  prValue: { fontSize: 14, fontWeight: "700" },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  historyLeft: { flex: 1, gap: 2 },
  historyName: { fontSize: 14, fontWeight: "600" },
  historyMeta: { fontSize: 12 },
  reflection: { fontSize: 15, fontStyle: "italic", lineHeight: 22 },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 16,
  },
  exportText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
