import { palette, useTheme } from "@core/ui/theme";
import { daysBetween, todayISO } from "@core/utils/dates";
import { pickJourneyPhoto, takeJourneyPhoto } from "@core/utils/media";
import {
  useDeleteJourney,
  useJourney,
  useUpdateJourney,
} from "@modules/journeys/useJourneys";
import {
  getActiveSessionForWorkout,
  getLastSessionForWorkout,
} from "@modules/session-player/repository";
import {
  useDeleteSession,
  useSessionsByJourney,
  useStartSession,
  useTodayWorkouts,
} from "@modules/session-player/useSessionPlayer";
import { useWorkoutsByJourney } from "@modules/workouts/useWorkouts";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Map,
  Play,
  Plus,
  Trash2,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const HISTORY_LIMIT = 3;

export default function JourneyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: journey } = useJourney(Number(id));
  const { data: workouts } = useWorkoutsByJourney(Number(id));
  const { data: sessions } = useSessionsByJourney(Number(id));
  const { data: todayWorkoutIds } = useTodayWorkouts(Number(id));
  const update = useUpdateJourney();
  const remove = useDeleteJourney();
  const startSession = useStartSession();
  const deleteSession = useDeleteSession();
  const router = useRouter();
  const { colors } = useTheme();

  const [showAllSessions, setShowAllSessions] = useState(false);

  if (!journey)
    return <View style={[styles.root, { backgroundColor: colors.bg }]} />;

  const dayX = Math.max(1, daysBetween(journey.start_date, todayISO()) + 1);
  const total = journey.end_date
    ? daysBetween(journey.start_date, journey.end_date) + 1
    : null;
  const active = journey.status === "active";

  // Sort workouts: today's first, then rest
  const sortedWorkouts = [...(workouts ?? [])].sort((a, b) => {
    const aToday = todayWorkoutIds?.includes(a.id) ? 0 : 1;
    const bToday = todayWorkoutIds?.includes(b.id) ? 0 : 1;
    return aToday - bToday;
  });

  const photoActions = () =>
    Alert.alert("Journey photo", undefined, [
      {
        text: "Take photo",
        onPress: async () => {
          const uri = await takeJourneyPhoto();
          if (uri)
            update.mutate({ id: journey.id, patch: { before_photo_uri: uri } });
        },
      },
      {
        text: "Choose from gallery",
        onPress: async () => {
          const uri = await pickJourneyPhoto();
          if (uri)
            update.mutate({ id: journey.id, patch: { before_photo_uri: uri } });
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);

  const complete = () =>
    Alert.alert("Complete journey", "Mark this journey as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: () =>
          update.mutate({ id: journey.id, patch: { status: "completed" } }),
      },
    ]);

  const destroy = () =>
    Alert.alert(
      "Delete journey",
      "This also deletes its workouts and sessions. Cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            remove.mutate(journey.id, { onSuccess: () => router.back() }),
        },
      ],
    );

  // ✅ Play: resume in-progress first, then offer review/fresh for completed
  const playWorkout = async (workoutId: number) => {
    try {
      // 1) Resume if there's an in-progress session for this workout
      const activeSession = await getActiveSessionForWorkout(workoutId);
      if (activeSession) {
        router.push(`/session/${activeSession.id}`);
        return;
      }

      // 2) Completed before? Offer review or fresh start
      const lastSession = await getLastSessionForWorkout(workoutId);
      if (lastSession) {
        Alert.alert(
          "Session History",
          `You completed this on ${lastSession.started_at?.slice(0, 10)} (${lastSession.sets_done} sets, ${Math.round(lastSession.volume).toLocaleString()} kg)`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "View Last Session",
              onPress: () => router.push(`/session/${lastSession.id}`),
            },
            { text: "Start Fresh", onPress: () => doStartSession(workoutId) },
          ],
        );
      } else {
        doStartSession(workoutId);
      }
    } catch {
      doStartSession(workoutId);
    }
  };

  const doStartSession = (workoutId: number) => {
    startSession.mutate(
      { workoutId, journeyId: journey.id },
      { onSuccess: (sessionId) => router.push(`/session/${sessionId}`) },
    );
  };

  const handleDeleteSession = (sessionId: number) => {
    Alert.alert(
      "Delete session?",
      "This will remove the session from history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteSession.mutate(sessionId),
        },
      ],
    );
  };

  const visibleSessions = showAllSessions
    ? sessions
    : sessions?.slice(0, HISTORY_LIMIT);

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { backgroundColor: colors.bg }]}
    >
      <Pressable onPress={photoActions}>
        {journey.before_photo_uri ? (
          <Image
            source={{ uri: journey.before_photo_uri }}
            style={styles.hero}
          />
        ) : (
          <View style={[styles.hero, { backgroundColor: colors.surface }]}>
            <Map size={32} color={palette.green} />
            <Text style={[styles.heroHint, { color: colors.subtext }]}>
              tap to add a photo
            </Text>
          </View>
        )}
      </Pressable>

      <View style={styles.titleRow}>
        <Text style={[styles.name, { color: colors.text }]}>
          {journey.name}
        </Text>
        <View
          style={[
            styles.chip,
            { backgroundColor: active ? palette.green + "22" : colors.border },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              { color: active ? palette.green : colors.subtext },
            ]}
          >
            {journey.status}
          </Text>
        </View>
      </View>

      <Text style={[styles.day, { color: colors.subtext }]}>
        {total ? `Day ${dayX} of ${total}` : `Day ${dayX}`} •{" "}
        {journey.start_date} → {journey.end_date ?? "ongoing"}
      </Text>

      {journey.purpose_quote && (
        <View
          style={[
            styles.quoteCard,
            { backgroundColor: colors.surface, borderLeftColor: palette.green },
          ]}
        >
          <Text style={[styles.quote, { color: colors.text }]}>
            “{journey.purpose_quote}”
          </Text>
        </View>
      )}

      {/* ── Workouts ──────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Workouts
      </Text>

      {sortedWorkouts.length === 0 && (
        <Text style={[styles.heroHint, { color: colors.subtext }]}>
          no workouts yet — add your first one
        </Text>
      )}

      {sortedWorkouts.map((w) => {
        const isToday = todayWorkoutIds?.includes(w.id);
        return (
          <View
            key={w.id}
            style={[
              styles.workoutRow,
              {
                backgroundColor: colors.surface,
                borderLeftColor: isToday ? palette.green : colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => router.push(`/workout/${w.id}`)}
              style={styles.workoutInfo}
            >
              <Dumbbell
                size={18}
                color={isToday ? palette.green : colors.subtext}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.quote,
                    { color: colors.text, fontStyle: "normal" },
                  ]}
                >
                  {w.name}
                </Text>
                {isToday && <Text style={styles.todayBadge}>TODAY</Text>}
              </View>
            </Pressable>
            <Pressable
              onPress={() => playWorkout(w.id)}
              style={styles.playCircle}
            >
              <Play size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        );
      })}

      <Pressable
        onPress={() => router.push(`/workout/create?journeyId=${journey.id}`)}
        style={styles.primaryBtn}
      >
        <Plus size={18} color="#FFFFFF" />
        <Text style={styles.btnText}>Add Workout</Text>
      </Pressable>

      {/* ── Session History ───────────────────────────── */}
      <Text
        style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}
      >
        Session History
      </Text>

      {(!sessions || sessions.length === 0) && (
        <Text style={[styles.heroHint, { color: colors.subtext }]}>
          no sessions yet — play your first workout
        </Text>
      )}

      {visibleSessions?.map((s) => {
        const done = s.status === "completed";
        const aborted = s.status === "aborted";
        return (
          <Pressable
            key={s.id}
            onPress={() => router.push(`/session/${s.id}`)}
            style={[styles.historyRow, { backgroundColor: colors.surface }]}
          >
            <Clock size={16} color={colors.subtext} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.historyName, { color: colors.text }]}>
                {s.workout_name}
              </Text>
              <Text style={[styles.historySub, { color: colors.subtext }]}>
                {s.started_at?.slice(0, 10)} • {s.sets_done} sets •{" "}
                {Math.round(s.volume).toLocaleString()} kg
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
            <Pressable onPress={() => handleDeleteSession(s.id)} hitSlop={8}>
              <Trash2 size={16} color="#B3261E" />
            </Pressable>
          </Pressable>
        );
      })}

      {(sessions?.length ?? 0) > HISTORY_LIMIT && (
        <Pressable
          onPress={() => setShowAllSessions(!showAllSessions)}
          style={styles.showMoreBtn}
        >
          {showAllSessions ? (
            <ChevronUp size={16} color={palette.green} />
          ) : (
            <ChevronDown size={16} color={palette.green} />
          )}
          <Text style={styles.showMoreText}>
            {showAllSessions ? "Show Less" : `Show All (${sessions!.length})`}
          </Text>
        </Pressable>
      )}

      {/* ── Bottom actions ────────────────────────────── */}
      {active && (
        <Pressable
          onPress={complete}
          style={[styles.primaryBtn, { marginTop: 24 }]}
        >
          <CheckCircle2 size={18} color="#FFFFFF" />
          <Text style={styles.btnText}>Mark as completed</Text>
        </Pressable>
      )}

      <Pressable
        onPress={destroy}
        style={[styles.deleteBtn, { borderColor: colors.border }]}
      >
        <Trash2 size={18} color="#B3261E" />
        <Text style={[styles.btnText, { color: "#B3261E" }]}>
          Delete journey
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  hero: {
    width: "100%",
    height: 240,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  heroHint: { fontSize: 12 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  name: { fontSize: 22, fontWeight: "700", flex: 1 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  chipText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  day: { fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 6 },
  quoteCard: { borderRadius: 14, padding: 16, borderLeftWidth: 3 },
  quote: { fontSize: 15, fontStyle: "italic", lineHeight: 22 },
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 3,
  },
  workoutInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  todayBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: palette.green,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  playCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.green,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.green,
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 6,
  },
  deleteBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1,
    marginTop: 6,
  },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
  },
  historyName: { fontSize: 14, fontWeight: "600" },
  historySub: { fontSize: 12 },
  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  showMoreText: { fontSize: 13, fontWeight: "600", color: palette.green },
});
