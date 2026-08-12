import { Carousel, type Slide } from "@core/ui/Carousel";
import { Header } from "@core/ui/Header";
import { useTheme } from "@core/ui/theme";
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
import { Search } from "lucide-react-native";
import { useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Internet images for now. To go fully offline later, replace with:
// require('@/assets/images/carousel/c1.png') etc.
const slides: Slide[] = [
  {
    image: require("@/assets/images/carousel-1.jpg"),
    quote: "grow strong.",
  },
  {
    image: require("@/assets/images/carousel-2.jpg"),
    quote: "one journey at a time.",
  },
  {
    image: require("@/assets/images/carousel-3.jpg"),
    quote: "document your transformation.",
  },
];

function ScalePressable({
  onPress,
  children,
  style,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  style?: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View
      style={[{ transform: [{ scale }] }, style]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          Animated.timing(scale, {
            toValue: 0.96,
            duration: 100,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.timing(scale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }).start()
        }
        style={StyleSheet.flatten([{ width: "100%", height: "100%" }, style])}
      >
        <View style={styles.searchInner}>{children}</View>
      </Pressable>
    </Animated.View>
  );
}

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
        <ScalePressable
          onPress={() => router.push("/search")}
          style={[
            styles.searchTrigger,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.searchInner}>
            <Search size={18} color={colors.subtext} />
            <Text style={[styles.searchText, { color: colors.subtext }]}>
              Search journeys…
            </Text>
          </View>
        </ScalePressable>

        <Carousel slides={slides} />

        {activeSession && <ResumeSessionCard session={activeSession} />}

        {!hasJourneys && <HelperCard />}

        {pinned && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Current Journey
            </Text>
            <PinnedJourneyCard
              journey={pinned}
              workoutCount={pinnedWorkouts?.length ?? 0}
              nextWorkoutName={pinnedWorkouts?.[0]?.name}
              nextWorkoutId={pinnedWorkouts?.[0]?.id}
            />
          </>
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
  searchTrigger: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
  },
  searchInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 10,
  },
  searchText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginTop: 6 },
});
