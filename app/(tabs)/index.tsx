import { Carousel, type Slide } from "@core/ui/Carousel";
import { Header } from "@core/ui/Header";
import { palette, useTheme } from "@core/ui/theme";
import {
  HelperCard,
  JourneyRow,
  PinnedJourneyCard,
  ResumeSessionCard,
} from "@modules/home/components";
import { useJourneys } from "@modules/journeys/useJourneys";
import { useActiveSession } from "@modules/session-player/useActiveSession";
import { useWorkoutsByJourney } from "@modules/workouts/useWorkouts";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

// Internet images for now. To go fully offline later, replace with:
// require('@/assets/images/carousel/c1.png') etc.
const slides: Slide[] = [
  {
    image: {
      uri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop",
    },
    quote: "grow strong.",
  },
  {
    image: {
      uri: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1600&auto=format&fit=crop",
    },
    quote: "one journey at a time.",
  },
  {
    image: {
      uri: "https://images.unsplash.com/photo-1571902943202-507ec2618e8b?q=80&w=1600&auto=format&fit=crop",
    },
    quote: "document your transformation.",
  },
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const { data: journeys } = useJourneys();
  const { data: activeSession } = useActiveSession();
  const router = useRouter();

  const hasJourneys = (journeys?.length ?? 0) > 0;
  const pinned = journeys?.find((j) => j.status === "active");
  const { data: pinnedWorkouts } = useWorkoutsByJourney(pinned?.id ?? 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <Carousel slides={slides} />

        <Pressable
          style={styles.createBtn}
          onPress={() => router.push("/journey/create")}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createText}>Create Journey</Text>
        </Pressable>

        {activeSession && <ResumeSessionCard session={activeSession} />}

        {!hasJourneys && <HelperCard />}

        {pinned && (
          <PinnedJourneyCard
            journey={pinned}
            workoutCount={pinnedWorkouts?.length ?? 0}
            nextWorkoutName={pinnedWorkouts?.[0]?.name}
            nextWorkoutId={pinnedWorkouts?.[0]?.id}
          />
        )}

        {hasJourneys && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your journeys
            </Text>
            {journeys!.map((j) => (
              <JourneyRow key={j.id} journey={j} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 32 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: palette.green,
    borderRadius: 16,
    paddingVertical: 16,
  },
  createText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginTop: 6 },
});
