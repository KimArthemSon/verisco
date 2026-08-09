import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export const palette = {
  green: '#2D5F3F',
  greenDark: '#1A3C2A',
  offWhite: '#F5F5F0',
  gray: '#8A8A8A',
};

export type ThemeColors = {
  bg: string;
  surface: string;
  text: string;
  subtext: string;
  border: string;
};

const light: ThemeColors = {
  bg: '#FFFFFF', surface: '#F5F5F0', text: '#1A1A1A', subtext: '#8A8A8A', border: '#E8E8E3',
};
const dark: ThemeColors = {
  bg: '#1A1A1A', surface: '#242424', text: '#FFFFFF', subtext: '#9A9A9A', border: '#2E2E2E',
};

type ThemeCtx = { mode: 'light' | 'dark'; colors: ThemeColors; toggle: () => void };

const Ctx = createContext<ThemeCtx>({ mode: 'light', colors: light, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme() ?? 'light';
  const [mode, setMode] = useState<'light' | 'dark'>(system);

  useEffect(() => {
    AsyncStorage.getItem('viresco-theme').then((v) => {
      if (v === 'light' || v === 'dark') setMode(v);
    });
  }, []);

  const toggle = () =>
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem('viresco-theme', next);
      return next;
    });

  return (
    <Ctx.Provider value={{ mode, colors: mode === 'light' ? light : dark, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);