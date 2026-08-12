import { dialog } from "@core/ui/dialogStore";
import { useRouter } from "expo-router";
import { Bell, Moon, Plus, Sun } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, useTheme } from "./theme";

function ScalePressable({
  onPress,
  style,
  children,
}: {
  onPress?: () => void;
  style?: any;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
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
        style={StyleSheet.flatten([style])}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function Header() {
  const insets = useSafeAreaInsets();
  const { colors, mode, toggle } = useTheme();
  const router = useRouter();
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopScale = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.06,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
      ]),
    );
    const loopGlow = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseGlow, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(pulseGlow, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ]),
    );

    loopScale.start();
    loopGlow.start();
    return () => {
      loopScale.stop();
      loopGlow.stop();
    };
  }, [pulseGlow, pulseScale]);

  const pulseBackground = pulseGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, `${colors.accent}40`],
  });

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top,
          backgroundColor: colors.bg,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.brand}>
          <Image
            source={require("@/assets/images/icon.jpg")}
            style={styles.logo}
            resizeMode="cover"
          />
          <Text style={[styles.wordmark, { color: colors.text }]}>Viresco</Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.pulseWrap}>
            <Animated.View
              style={[
                styles.pulseHalo,
                {
                  backgroundColor: pulseBackground,
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />
            <ScalePressable
              onPress={() => router.push("/journey/create")}
              style={[
                styles.createBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Plus size={18} color={colors.text} />
            </ScalePressable>
          </View>

          <Pressable onPress={toggle} hitSlop={8} style={styles.iconBtn}>
            {mode === "dark" ? (
              <Sun size={20} color={colors.text} />
            ) : (
              <Moon size={20} color={colors.text} />
            )}
          </Pressable>

          <Pressable
            onPress={() =>
              dialog.alert(
                "Reminders",
                "Notification center arrives in Phase 4.",
                [{ label: "OK" }],
              )
            }
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Bell size={20} color={colors.text} />
            <View style={[styles.badge, { borderColor: colors.bg }]} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: palette.green,
  },
  wordmark: { fontSize: 20, fontWeight: "700", letterSpacing: 1 },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
  pulseWrap: {
    position: "relative",
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseHalo: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  iconBtn: { position: "relative", padding: 2 },
  createBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  badge: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.green,
    borderWidth: 1.5,
  },
});
