import { palette, useTheme } from "@core/ui/theme";
import { useAllSessions } from "@modules/session-player/useSessionPlayer";
import { Clock, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();
  const { data: sessions } = useAllSessions();

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Days with a completed session → solid green
  const doneDates = useMemo(() => {
    const set = new Set<string>();
    (sessions ?? []).forEach((s) => {
      if (s.status === "completed" && s.started_at)
        set.add(s.started_at.slice(0, 10));
    });
    return set;
  }, [sessions]);

  // Marks: done = green fill • selected = gray ring (green fill + ring if both)
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    doneDates.forEach((date) => {
      marks[date] = {
        customStyles: {
          container: { backgroundColor: palette.green, borderRadius: 20 },
          text: { color: "#FFFFFF", fontWeight: "700" },
        },
      };
    });

    if (selectedDay) {
      if (marks[selectedDay]) {
        marks[selectedDay].customStyles.container.borderWidth = 2;
        marks[selectedDay].customStyles.container.borderColor = colors.subtext;
      } else {
        marks[selectedDay] = {
          customStyles: {
            container: {
              borderWidth: 2,
              borderColor: colors.subtext,
              borderRadius: 20,
            },
            text: { color: colors.text },
          },
        };
      }
    }

    return marks;
  }, [doneDates, selectedDay, colors.subtext, colors.text]);

  const history = useMemo(() => {
    if (selectedDay) {
      return (sessions ?? []).filter(
        (s) => s.started_at?.slice(0, 10) === selectedDay,
      );
    }
    return (sessions ?? []).slice(0, 20);
  }, [sessions, selectedDay]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* ONE scroll for the whole page */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>

        <Calendar
          key={mode} // ← forces re-theme on light/dark switch
          markingType="custom"
          firstDay={1}
          onDayPress={(day) =>
            setSelectedDay(
              selectedDay === day.dateString ? null : day.dateString,
            )
          }
          markedDates={markedDates}
          theme={{
            backgroundColor: colors.bg,
            calendarBackground: colors.bg,
            textSectionTitleColor: colors.subtext,
            textDayColor: colors.text,
            textMonthColor: colors.text,
            textDayHeaderColor: colors.subtext,
            monthTextColor: colors.text,
            todayTextColor: palette.green,
            textDisabledColor: colors.border,
          }}
        />

        {/* Legend — done only */}
        <View style={styles.legend}>
          <View
            style={[styles.legendDot, { backgroundColor: palette.green }]}
          />
          <Text style={[styles.legendText, { color: colors.subtext }]}>
            workout done
          </Text>
        </View>

        {/* History */}
        <View style={styles.historyHeader}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>
            {selectedDay ? "Sessions on this day" : "Latest history"}
          </Text>
          {selectedDay && (
            <Pressable
              onPress={() => setSelectedDay(null)}
              style={[
                styles.filterChip,
                { backgroundColor: palette.green + "22" },
              ]}
            >
              <Text style={[styles.filterChipText, { color: palette.green }]}>
                {selectedDay}
              </Text>
              <X size={12} color={palette.green} />
            </Pressable>
          )}
        </View>

        <View style={styles.historyList}>
          {history.length === 0 && (
            <Text style={[styles.empty, { color: colors.subtext }]}>
              {selectedDay
                ? "no sessions on this day"
                : "no sessions yet — complete your first workout"}
            </Text>
          )}

          {history.map((s) => {
            const done = s.status === "completed";
            const aborted = s.status === "aborted";
            return (
              <View
                key={s.id}
                style={[styles.historyRow, { backgroundColor: colors.surface }]}
              >
                <Clock size={16} color={colors.subtext} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.historyName, { color: colors.text }]}>
                    {s.workout_name}
                  </Text>
                  <Text style={[styles.historySub, { color: colors.subtext }]}>
                    {s.journey_name} • {s.started_at?.slice(0, 10)}
                  </Text>
                  <Text style={[styles.historySub, { color: colors.subtext }]}>
                    {s.sets_done} sets • {Math.round(s.volume).toLocaleString()}{" "}
                    kg
                  </Text>
                </View>
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: done
                        ? palette.green + "22"
                        : aborted
                          ? "#B3261E22"
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: done
                          ? palette.green
                          : aborted
                            ? "#B3261E"
                            : colors.subtext,
                      },
                    ]}
                  >
                    {s.status}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 32 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 6,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11 },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  historyTitle: { fontSize: 16, fontWeight: "700" },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  filterChipText: { fontSize: 12, fontWeight: "700" },
  historyList: { padding: 20, gap: 10 },
  empty: { fontSize: 13, textAlign: "center", marginTop: 12 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
  },
  historyName: { fontSize: 14, fontWeight: "600" },
  historySub: { fontSize: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  chipText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
});
