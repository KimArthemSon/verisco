import { palette, useTheme } from "@core/ui/theme";
import { daysBetween, todayISO } from "@core/utils/dates";
import type { Journey } from "@modules/journeys/repository";
import type { ActiveSession } from "@modules/session-player/repository";
import {
  useActiveSession,
  useStartSession,
  useTodayWorkouts,
} from "@modules/session-player/useSessionPlayer";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Dumbbell,
  Lightbulb,
  Map,
  Play,
} from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export function HelperCard() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Lightbulb size={22} color={palette.green} />
      <View style={{ gap: 2, flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>
          What is a journey?
        </Text>
        <Text style={[styles.sub, { color: colors.subtext }]}>
          A time-boxed transformation: a before photo, a purpose, and workouts
          that move you forward.
        </Text>
      </View>
    </View>
  );
}

export function ResumeSessionCard({ session }: { session: ActiveSession }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/session/${session.id}`)}
      style={styles.resume}
    >
      <View style={styles.resumeIcon}>
        <Play size={18} color={palette.green} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.resumeTitle}>Resume: {session.workout_name}</Text>
        <Text style={styles.resumeSub}>
          session in progress — tap to continue
        </Text>
      </View>
    </Pressable>
  );
}

export function PinnedJourneyCard({
  journey,
  workoutCount,
  nextWorkoutName,
  nextWorkoutId,
}: {
  journey: Journey;
  workoutCount: number;
  nextWorkoutName?: string;
  nextWorkoutId?: number;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: activeSession } = useActiveSession();
  const { data: todayWorkoutIds } = useTodayWorkouts(journey.id);
  const startSession = useStartSession();

  const dayX = Math.max(1, daysBetween(journey.start_date, todayISO()) + 1);
  const total = journey.end_date
    ? daysBetween(journey.start_date, journey.end_date) + 1
    : null;
  const hasWorkouts = workoutCount > 0;
  const hasTodayWorkout = todayWorkoutIds && todayWorkoutIds.length > 0;

  const handlePlay = () => {
    // Resume first if a session is in progress
    if (activeSession) {
      router.push(`/session/${activeSession.id}`);
      return;
    }
    // No workouts yet → go to create
    if (!hasWorkouts || !nextWorkoutId) {
      router.push(`/workout/create?journeyId=${journey.id}`);
      return;
    }
    // Start a new session for the next workout
    startSession.mutate(
      { workoutId: nextWorkoutId, journeyId: journey.id },
      { onSuccess: (sessionId) => router.push(`/session/${sessionId}`) },
    );
  };

  const buttonLabel = !hasWorkouts
    ? "Set Up First Workout"
    : activeSession
      ? `Resume: ${activeSession.workout_name}`
      : "Play Session";

  const ButtonIcon = hasWorkouts ? Play : Dumbbell;

  const subtitleNext = hasTodayWorkout
    ? ` • Today: ${nextWorkoutName}`
    : hasWorkouts && nextWorkoutName
      ? ` • next: ${nextWorkoutName}`
      : "";

  return (
    <View style={[styles.pinned, { backgroundColor: colors.surface }]}>
      {/* top row → journey detail */}
      <Pressable
        onPress={() => router.push(`/journey/${journey.id}`)}
        style={styles.cardTop}
      >
        {journey.before_photo_uri ? (
          <Image
            source={{ uri: journey.before_photo_uri }}
            style={styles.thumb}
          />
        ) : (
          <View style={[styles.thumb, { backgroundColor: colors.border }]}>
            <Map size={20} color={palette.green} />
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.title, { color: colors.text }]}>
            {journey.name}
          </Text>
          <Text style={[styles.sub, { color: colors.subtext }]}>
            {total ? `Day ${dayX} of ${total}` : `Day ${dayX}`}
            {subtitleNext}
          </Text>
          {!hasWorkouts && (
            <Text style={[styles.sub, { color: colors.subtext }]}>
              no workouts yet
            </Text>
          )}
        </View>
        <ChevronRight size={18} color={colors.subtext} />
      </Pressable>

      {/* state-aware action */}
      <Pressable onPress={handlePlay} style={styles.actionBtn}>
        <ButtonIcon size={18} color="#FFFFFF" />
        <Text style={styles.actionText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

export function JourneyRow({ journey }: { journey: Journey }) {
  const { colors } = useTheme();
  const router = useRouter();
  const active = journey.status === "active";

  return (
    <Pressable
      onPress={() => router.push(`/journey/${journey.id}`)}
      style={[styles.card, { backgroundColor: colors.surface }]}
    >
      {journey.before_photo_uri ? (
        <Image
          source={{ uri: journey.before_photo_uri }}
          style={styles.thumbSm}
        />
      ) : (
        <View style={[styles.thumbSm, { backgroundColor: colors.border }]}>
          <Map size={16} color={palette.green} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.title, { color: colors.text }]}>
          {journey.name}
        </Text>
        <Text style={[styles.sub, { color: colors.subtext }]}>
          {journey.start_date} → {journey.end_date ?? "ongoing"}
        </Text>
      </View>
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
      <ChevronRight size={16} color={colors.subtext} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 16,
  },
  pinned: { borderRadius: 16, padding: 16, gap: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  title: { fontSize: 15, fontWeight: "600" },
  sub: { fontSize: 12 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbSm: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: palette.green,
    borderRadius: 12,
    paddingVertical: 13,
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  resume: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: palette.green,
    borderRadius: 16,
    padding: 16,
  },
  resumeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  resumeTitle: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  resumeSub: { color: "#FFFFFFBB", fontSize: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  chipText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
});
