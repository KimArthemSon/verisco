import { palette, useTheme } from "@core/ui/theme";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = {
  seconds: number;
  totalSeconds: number;
};

export function RestRing({ seconds, totalSeconds }: Props) {
  const { colors } = useTheme();
  const size = 220;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = totalSeconds > 0 ? seconds / totalSeconds : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  const timeColor = seconds <= 10 ? "#E5A43B" : colors.text;

  return (
    <View style={styles.container}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border + "80"}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.green}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
      <View style={styles.textWrap}>
        <Text style={[styles.time, { color: timeColor }]}>
          {mins}:{secs}
        </Text>
        <Text style={[styles.label, { color: colors.subtext }]}>REST</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { position: "absolute", alignItems: "center" },
  time: { fontSize: 48, fontWeight: "700", fontVariant: ["tabular-nums"] },
  label: { fontSize: 14, fontWeight: "700", letterSpacing: 2 },
});
