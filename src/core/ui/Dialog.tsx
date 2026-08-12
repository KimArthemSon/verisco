import { palette, useTheme } from "@core/ui/theme";
import * as Haptics from "expo-haptics";
import { type LucideIcon } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDialogStore } from "./dialogStore";

export function GlobalDialog() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const open = useDialogStore((state) => state.open);
  const title = useDialogStore((state) => state.title);
  const message = useDialogStore((state) => state.message);
  const buttons = useDialogStore((state) => state.buttons);
  const variant = useDialogStore((state) => state.variant);
  const icon = useDialogStore((state) => state.icon);
  const hide = useDialogStore((state) => state.hide);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (!open) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.94,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 40,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, backdropOpacity, scale, translateY]);

  const handleButtonPress = async (button: {
    label: string;
    style?: "default" | "cancel" | "destructive";
    onPress?: () => void | Promise<void>;
  }) => {
    hide();
    if (button.onPress) await button.onPress();
  };

  const IconNode = icon as LucideIcon | undefined;

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={hide}
    >
      <Pressable style={styles.backdrop} onPress={hide}>
        <Animated.View
          style={[
            styles.backdropFill,
            { opacity: backdropOpacity, backgroundColor: "rgba(0,0,0,0.45)" },
          ]}
        />
      </Pressable>

      {variant === "center" ? (
        <Animated.View
          style={[
            styles.centerWrap,
            {
              opacity: backdropOpacity,
              transform: [{ scale }],
            },
          ]}
        >
          <View
            style={[
              styles.centerCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {IconNode ? (
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: palette.green + "22" },
                ]}
              >
                <IconNode size={22} color={palette.green} />
              </View>
            ) : null}

            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {message ? (
              <Text style={[styles.message, { color: colors.subtext }]}>
                {message}
              </Text>
            ) : null}

            <View style={styles.buttonColumn}>
              {buttons.map((button, index) => {
                const isCancel = button.style === "cancel";
                const isDestructive = button.style === "destructive";
                const isDefault = button.style === "default" || !button.style;

                const buttonStyle = isCancel
                  ? [styles.cancelBtn, { backgroundColor: "transparent" }]
                  : isDestructive
                    ? [
                        styles.actionBtn,
                        { backgroundColor: "#FFFFFF", borderColor: "#B3261E" },
                      ]
                    : [styles.actionBtn, { backgroundColor: palette.green }];

                return (
                  <Pressable
                    key={`${button.label}-${index}`}
                    onPress={() => handleButtonPress(button)}
                    style={[
                      buttonStyle,
                      isCancel && { borderWidth: 0 },
                      isDefault &&
                        !isCancel &&
                        !isDestructive && { borderWidth: 0 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        {
                          color: isCancel
                            ? colors.subtext
                            : isDestructive
                              ? "#B3261E"
                              : "#FFFFFF",
                        },
                      ]}
                    >
                      {button.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>
      ) : (
        <Animated.View
          style={[
            styles.sheetWrap,
            {
              opacity: backdropOpacity,
              transform: [{ translateY }],
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View
            style={[
              styles.sheetCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.sheetHandle, { backgroundColor: colors.border }]}
            />
            <View style={styles.sheetHeader}>
              {IconNode ? (
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: palette.green + "22" },
                  ]}
                >
                  <IconNode size={20} color={palette.green} />
                </View>
              ) : null}
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {title}
              </Text>
            </View>

            {message ? (
              <Text style={[styles.sheetMessage, { color: colors.subtext }]}>
                {message}
              </Text>
            ) : null}

            <View style={styles.sheetButtons}>
              {buttons.map((button, index) => {
                const isCancel = button.style === "cancel";
                const isDestructive = button.style === "destructive";
                const isDefault = button.style === "default" || !button.style;
                return (
                  <Pressable
                    key={`${button.label}-${index}`}
                    onPress={() => handleButtonPress(button)}
                    style={[
                      styles.sheetButton,
                      {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                      },
                      isDestructive && {
                        borderColor: "#B3261E22",
                        backgroundColor: "#B3261E11",
                      },
                      isCancel && {
                        backgroundColor: "transparent",
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {IconNode && !isCancel ? (
                      <IconNode
                        size={18}
                        color={isDestructive ? "#B3261E" : palette.green}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.sheetButtonText,
                        {
                          color: isDestructive
                            ? "#B3261E"
                            : isCancel
                              ? colors.subtext
                              : colors.text,
                        },
                      ]}
                    >
                      {button.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  centerCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  buttonColumn: {
    gap: 10,
    marginTop: 6,
  },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cancelBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  sheetWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
  },
  sheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  sheetMessage: {
    fontSize: 13,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  sheetButtons: {
    gap: 10,
  },
  sheetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
  },
  sheetButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
