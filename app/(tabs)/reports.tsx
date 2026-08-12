import { palette, useTheme } from "@core/ui/theme";
import { useFocusRefresh, usePullRefresh } from "@core/ui/usePullRefresh";
import { useJourneys } from "@modules/journeys/useJourneys";
import {
  daysTrained,
  getReportSessions,
  inLastDays,
  journeyRollups,
  totals,
  weeklyVolume,
} from "@modules/reports/analytics";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronRight, Map } from "lucide-react-native";
import { useMemo } from "react";
import {
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

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const router = useRouter();

  const journeysQuery = useJourneys();
  const allReportsQuery = useQuery({
    queryKey: ["reports", "all"],
    queryFn: () => getReportSessions(null),
  });

  const allSessions = allReportsQuery.data ?? [];
  const journeys = journeysQuery.data ?? [];

  const orderedJourneys = useMemo(
    () =>
      [...journeys].sort((a, b) => {
        const activeA = a.status === "active" ? 1 : 0;
        const activeB = b.status === "active" ? 1 : 0;
        return activeB - activeA;
      }),
    [journeys],
  );

  const journeyStats = useMemo(
    () =>
      journeyRollups(allSessions).reduce<
        Record<number, { sessions: number; sets: number; volume: number }>
      >((acc, item) => {
        acc[item.journey_id] = {
          sessions: item.sessions,
          sets: item.sets,
          volume: item.volume,
        };
        return acc;
      }, {}),
    [allSessions],
  );

  const refreshAll = async () => {
    await Promise.all([journeysQuery.refetch(), allReportsQuery.refetch()]);
  };

  const { refreshing, onRefresh } = usePullRefresh(refreshAll);
  useFocusRefresh(refreshAll);

  const overall = totals(allSessions);
  const overallDays = daysTrained(allSessions);
  const chartData = weeklyVolume(inLastDays(allSessions, 84));

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.green}
            colors={[palette.green]}
          />
        }
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Reports</Text>

        <View style={styles.metricGrid}>
          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.metricLabel, { color: colors.subtext }]}>
              workouts
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {overall.sessions}
            </Text>
          </View>
          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.metricLabel, { color: colors.subtext }]}>
              days trained
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {overallDays}
            </Text>
          </View>
          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.metricLabel, { color: colors.subtext }]}>
              total volume
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {overall.volume.toLocaleString()} kg
            </Text>
          </View>
          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.metricLabel, { color: colors.subtext }]}>
              sets done
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {overall.sets}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Volume trend
          </Text>
          {chartData.length > 0 ? (
            <LineChart
              data={chartData.map((point) => ({
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
              no data available
            </Text>
          )}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your journeys
          </Text>
        </View>

        {orderedJourneys.map((journey) => {
          const summary = journeyStats[journey.id] ?? {
            sessions: 0,
            sets: 0,
            volume: 0,
          };
          const active = journey.status === "active";
          return (
            <Pressable
              key={journey.id}
              onPress={() =>
                router.push({
                  pathname: "/report/[id]",
                  params: { id: String(journey.id) },
                })
              }
              style={[
                styles.journeyRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.photoWrap}>
                {journey.before_photo_uri ? (
                  <Image
                    source={{ uri: journey.before_photo_uri }}
                    style={styles.thumb}
                  />
                ) : (
                  <View
                    style={[
                      styles.thumb,
                      {
                        backgroundColor: colors.bg,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <Map size={18} color={palette.green} />
                  </View>
                )}
              </View>

              <View style={styles.rowCopy}>
                <Text style={[styles.journeyName, { color: colors.text }]}>
                  {journey.name}
                </Text>
                <Text style={[styles.journeyMeta, { color: colors.subtext }]}>
                  {summary.sessions} sessions •{" "}
                  {summary.volume.toLocaleString()} kg
                </Text>
              </View>

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

              <ChevronRight size={18} color={colors.subtext} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700" },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
    justifyContent: "space-between",
  },
  metricLabel: { fontSize: 12, fontWeight: "600", textTransform: "lowercase" },
  metricValue: { fontSize: 22, fontWeight: "700" },
  card: { borderRadius: 16, padding: 16, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  empty: { fontSize: 12, textAlign: "center", paddingVertical: 16 },
  sectionHeaderRow: { marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  journeyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  photoWrap: { width: 52, height: 52, borderRadius: 12, overflow: "hidden" },
  thumb: { width: "100%", height: "100%" },
  rowCopy: { flex: 1, gap: 2 },
  journeyName: { fontSize: 15, fontWeight: "700" },
  journeyMeta: { fontSize: 12 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
});
