import { getDb } from "@core/db";
import { Loader } from "@core/ui/Loader";
import { ThemeProvider, useTheme } from "@core/ui/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, type ReactNode } from "react";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

// Expo Go can't do push tokens (SDK 53+). Local scheduled reminders still work.
// Silence the warning so it never blocks the app during development.
LogBox.ignoreLogs(["expo-notifications"]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === "dark" ? "light" : "dark"} />;
}

function Screens() {
  const { colors, mode } = useTheme();
  const header = {
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: mode === "dark" ? "#FFFFFF" : "#1A1A1A",
    headerTitleStyle: { fontWeight: "700" as const },
    headerShadowVisible: false,
  };

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
      <Stack.Screen
        name="journey/create"
        options={{ ...header, title: "New Journey" }}
      />
      <Stack.Screen
        name="journey/[id]"
        options={{ ...header, title: "Journey" }}
      />
      <Stack.Screen
        name="workout/create"
        options={{ ...header, title: "New Workout" }}
      />
      <Stack.Screen
        name="workout/[id]"
        options={{ ...header, title: "Workout" }}
      />
      <Stack.Screen
        name="exercise/list"
        options={{ ...header, title: "Exercise Library" }}
      />
      <Stack.Screen
        name="exercise/create"
        options={{ ...header, title: "New Exercise" }}
      />
      <Stack.Screen
        name="session/[id]"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
    </Stack>
  );
}

function Boot({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
    const minimum = new Promise((r) => setTimeout(r, 1000));
    Promise.all([
      getDb(),
      minimum,
      Notifications.requestPermissionsAsync().catch(() => null),
    ])
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  return (
    <>
      {children}
      {showLoader && (
        <Loader done={ready} onHidden={() => setShowLoader(false)} />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ThemedStatusBar />
          <Boot>
            <Screens />
          </Boot>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
