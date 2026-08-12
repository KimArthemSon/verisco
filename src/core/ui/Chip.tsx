import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { useTheme } from "./theme";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: "primary" | "neutral";
  style?: ViewStyle;
  disabled?: boolean;
};

export function Chip({
  label,
  selected = false,
  onPress,
  tone = "neutral",
  style,
  disabled = false,
}: ChipProps) {
  const { colors } = useTheme();
  const isPrimary = tone === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected
            ? isPrimary
              ? colors.accent
              : colors.surface
            : colors.bg,
          borderColor: selected ? colors.accent : colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: selected
              ? isPrimary
                ? colors.onAccent
                : colors.text
              : colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
});
