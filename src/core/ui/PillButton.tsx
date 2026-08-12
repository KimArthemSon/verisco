import { ArrowRight, type LucideIcon } from "lucide-react-native";
import { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "./theme";

type Variant = "primary" | "surface";

type PillButtonProps = {
  label: string;
  icon?: LucideIcon;
  variant?: Variant;
  compact?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PillButton({
  label,
  icon: Icon,
  variant = "primary",
  compact = false,
  onPress,
  style,
}: PillButtonProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isPrimary = variant === "primary";

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          compact && styles.compactButton,
          {
            backgroundColor: isPrimary ? colors.accent : colors.surface,
            borderColor: isPrimary ? colors.accent : colors.border,
          },
        ]}
      >
        <View style={styles.labelWrap}>
          {Icon && (
            <Icon
              size={compact ? 16 : 18}
              color={isPrimary ? colors.onAccent : colors.text}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.label,
              compact && styles.compactLabel,
              { color: isPrimary ? colors.onAccent : colors.text },
            ]}
          >
            {label}
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: "#FFFFFF" }]}>
          <ArrowRight
            size={compact ? 16 : 18}
            color={isPrimary ? colors.accent : "#1A1A1A"}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 999,
  },
  button: {
    height: 56,
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  compactButton: {
    height: 48,
  },
  labelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 8,
    flexShrink: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  compactLabel: {
    fontSize: 14,
  },
  icon: {
    marginRight: 2,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
