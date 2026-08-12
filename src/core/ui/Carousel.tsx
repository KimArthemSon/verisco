import { LinearGradient } from "expo-linear-gradient";
import { Dumbbell } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { palette, useTheme } from "./theme";

export type Slide = { image: ImageSourcePropType; quote: string };

export function Carousel({
  slides,
  height = 210,
}: {
  slides: Slide[];
  height?: number;
}) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const paused = useRef(false);
  const ref = useRef<ScrollView>(null);
  const width = Dimensions.get("window").width - 40;

  // auto-advance until the user touches it
  useEffect(() => {
    const t = setInterval(() => {
      if (paused.current) return;
      setIndex((i) => {
        const next = (i + 1) % slides.length;
        ref.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(t);
  }, [slides.length, width]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => (paused.current = true)}
        onMomentumScrollEnd={onMomentumEnd}
      >
        {slides.map((s, i) => {
          const hasImage = !!s.image && !failed[i];

          return (
            <View
              key={i}
              style={[
                styles.slide,
                { width, height, backgroundColor: colors.surface },
              ]}
            >
              {hasImage ? (
                <Image
                  source={s.image}
                  style={styles.img}
                  resizeMode="cover"
                  onError={() => setFailed((prev) => ({ ...prev, [i]: true }))}
                />
              ) : (
                <View style={styles.fallback}>
                  <Dumbbell size={28} color={colors.accent} />
                </View>
              )}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                start={[0, 0.35]}
                end={[0, 1]}
                style={styles.overlay}
              />
              <Text style={styles.quote}>{s.quote}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { borderRadius: 20, overflow: "hidden" },
  img: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#101010",
  },
  overlay: { ...StyleSheet.absoluteFillObject },
  quote: {
    position: "absolute",
    left: 18,
    bottom: 16,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#8A8A8A55" },
  dotActive: { width: 18, backgroundColor: palette.green },
});
