import { PillButton } from "@core/ui/PillButton";
import { ProgressRing } from "@core/ui/ProgressRing";
import { palette, useTheme } from "@core/ui/theme";
import { daysBetween, todayISO } from "@core/utils/dates";
import { SessionPreviewModal } from "@modules/home/SessionPreviewModal";
import type { Journey } from "@modules/journeys/repository";
import type { ActiveSession } from "@modules/session-player/repository";
import {
  useActiveSession,
  useStartSession,
  useTodayWorkouts,
} from "@modules/session-player/useSessionPlayer";
import { useRouter } from "expo-router";
import { ChevronRight, Dumbbell, Lightbulb, Play } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
    <PillButton
      label={`Resume: ${session.workout_name}`}
      icon={Play}
      variant="primary"
      onPress={() => router.push(`/session/${session.id}`)}
    />
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
  const [previewWorkoutId, setPreviewWorkoutId] = useState<number | null>(null);

  const dayX = Math.max(1, daysBetween(journey.start_date, todayISO()) + 1);
  const total = journey.end_date
    ? daysBetween(journey.start_date, journey.end_date) + 1
    : null;
  const hasWorkouts = workoutCount > 0;
  const hasTodayWorkout = !!todayWorkoutIds && todayWorkoutIds.length > 0;
  const progress = total && total > 1 ? (dayX - 1) / (total - 1) : 0;

  const handlePlay = () => {
    if (activeSession) {
      router.push(`/session/${activeSession.id}`);
      return;
    }
    if (!hasWorkouts || !nextWorkoutId) {
      router.push(`/workout/create?journeyId=${journey.id}`);
      return;
    }
    setPreviewWorkoutId(nextWorkoutId);
  };

  const confirmPlay = () => {
    if (!previewWorkoutId) return;
    startSession.mutate(
      { workoutId: previewWorkoutId, journeyId: journey.id },
      {
        onSuccess: (sessionId) => {
          setPreviewWorkoutId(null);
          router.push(`/session/${sessionId}`);
        },
        onSettled: () => setPreviewWorkoutId(null),
      },
    );
  };

  const buttonLabel = !hasWorkouts
    ? "Set Up First Workout"
    : activeSession
      ? `Resume: ${activeSession.workout_name}`
      : "Play Session";

  const subtitleNext = hasTodayWorkout
    ? ` • Today: ${nextWorkoutName}`
    : hasWorkouts && nextWorkoutName
      ? ` • next: ${nextWorkoutName}`
      : "";

  return (
    <View style={[styles.pinned, { backgroundColor: colors.surface }]}>
      <Pressable
        onPress={() => router.push(`/journey/${journey.id}`)}
        style={styles.cardTop}
      >
        <ProgressRing
          size={54}
          stroke={5}
          progress={Math.min(1, Math.max(0, progress))}
          color={colors.accent}
        >
          <Text style={[styles.ringValue, { color: colors.accent }]}>
            {dayX}
          </Text>
          <Text style={[styles.ringSub, { color: colors.subtext }]}>
            {total ? `of ${total}` : "day"}
          </Text>
        </ProgressRing>

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

      <PillButton
        label={buttonLabel}
        icon={!hasWorkouts ? Dumbbell : Play}
        variant="primary"
        onPress={handlePlay}
      />

      <SessionPreviewModal
        open={previewWorkoutId !== null}
        workoutId={previewWorkoutId ?? 0}
        onClose={() => setPreviewWorkoutId(null)}
        onConfirm={confirmPlay}
      />
    </View>
  );
}

export function JourneyRow({ journey }: { journey: Journey }) {
  const { colors } = useTheme();
  const router = useRouter();
  const active = journey.status === "active";

  const dayX = Math.max(1, daysBetween(journey.start_date, todayISO()) + 1);
  const total = journey.end_date
    ? daysBetween(journey.start_date, journey.end_date) + 1
    : null;
  const progress =
    total && total > 1 ? Math.min(1, Math.max(0, (dayX - 1) / (total - 1))) : 0;

  return (
    <Pressable
      onPress={() => router.push(`/journey/${journey.id}`)}
      style={[styles.card, { backgroundColor: colors.surface }]}
    >
      <ProgressRing
        size={40}
        stroke={4}
        progress={progress}
        color={colors.accent}
      >
        <Text style={[styles.ringMini, { color: colors.accent }]}>{dayX}</Text>
      </ProgressRing>

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
          { backgroundColor: active ? colors.accent + "22" : colors.border },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            { color: active ? colors.accent : colors.subtext },
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
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pinned: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  title: { fontSize: 15, fontWeight: "600" },
  sub: { fontSize: 12 },
  ringValue: { fontSize: 12, fontWeight: "700" },
  ringSub: { fontSize: 8, fontWeight: "600", letterSpacing: 0.3 },
  ringMini: { fontSize: 10, fontWeight: "700" },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  chipText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
});
