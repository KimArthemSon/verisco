import { create } from 'zustand';

type View = 'overview' | 'playing' | 'resting' | 'summary';

type PlayerState = {
  view: View;
  currentExerciseIndex: number;
  currentSetIndex: number;
  restSeconds: number;
  timerRunning: boolean;

  setView: (view: View) => void;
  setIndices: (exIdx: number, setIdx: number) => void;
  startRest: (seconds: number) => void;
  tickRest: () => void;
  stopRest: () => void;
  addTime: (seconds: number) => void;
  setTimerRunning: (running: boolean) => void;
  showSummary: () => void;
  reset: () => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  view: 'overview',
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  restSeconds: 0,
  timerRunning: false,

  setView: (view) => set({ view }),
  setIndices: (exIdx, setIdx) => set({ currentExerciseIndex: exIdx, currentSetIndex: setIdx }),

  startRest: (seconds) => set({ restSeconds: seconds, timerRunning: true, view: 'resting' }),

  tickRest: () =>
    set((s) => {
      if (s.restSeconds <= 1) return { restSeconds: 0, timerRunning: false };
      return { restSeconds: s.restSeconds - 1 };
    }),

  stopRest: () => set({ timerRunning: false, view: 'playing' }),
  addTime: (s) => set((st) => ({ restSeconds: st.restSeconds + s })),
  setTimerRunning: (running) => set({ timerRunning: running }),

  showSummary: () => set({ view: 'summary', timerRunning: false }),

  reset: () =>
    set({
      view: 'overview',
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      restSeconds: 0,
      timerRunning: false,
    }),
}));