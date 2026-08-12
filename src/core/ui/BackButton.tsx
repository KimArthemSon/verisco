import { useTheme } from "@core/ui/theme";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

export function BackButton() {
  const { colors } = useTheme();
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
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
        hitSlop={8}
        style={[
          styles.button,
          {
            backgroundColor: colors.surface,
            borderColor: colors.accent,
          },
        ]}
      >
        <ArrowLeft size={18} color={colors.accent} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginLeft: 12 },
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
