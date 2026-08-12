import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "./theme";

type ToggleProps = {
  label?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
};

export function Toggle({ label, value, onValueChange }: ToggleProps) {
  const { colors } = useTheme();

  const trackStyle = useMemo(
    () => ({
      backgroundColor: value ? colors.accent : colors.border,
      borderColor: value ? colors.accent : colors.border,
    }),
    [colors.accent, colors.border, value],
  );

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={styles.row}
      hitSlop={8}
    >
      {label ? (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      ) : null}
      <View style={[styles.track, trackStyle]}>
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: colors.onAccent,
              transform: [{ translateX: value ? 18 : 0 }],
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  track: {
    width: 44,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
});
