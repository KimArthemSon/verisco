import { getDb } from '@core/db';
import { Loader } from '@core/ui/Loader';
import { ThemeProvider, useTheme } from '@core/ui/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

/** Holds the branded loader until DB is ready (+1s minimum), then fades it out. */
function Boot({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
    const minimum = new Promise((r) => setTimeout(r, 1000));
    Promise.all([getDb(), minimum])
      .then(() => setReady(true))
      .catch(() => setReady(true)); // never trap the user on the loader
  }, []);

  return (
    <>
      {children}
      {showLoader && <Loader done={ready} onHidden={() => setShowLoader(false)} />}
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
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </Boot>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}