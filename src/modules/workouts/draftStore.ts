import { create } from "zustand";

export type DraftSet = {
  set_type: "reps" | "time";
  reps: number | null;
  weight: number;
  rest_seconds: number;
};
export type DraftExercise = {
  exercise_id: number;
  name: string;
  muscle_group: string | null;
  sets: DraftSet[];
};

type DraftState = {
  exercises: DraftExercise[];
  addExercise: (ex: {
    id: number;
    name: string;
    muscle_group: string | null;
  }) => void;
  removeExercise: (id: number) => void;
  addSet: (id: number) => void;
  removeSet: (id: number, index: number) => void;
  updateSet: (id: number, index: number, patch: Partial<DraftSet>) => void;
  loadTemplate: (exercises: DraftExercise[]) => void;
  reset: () => void;
};

const defaultSets = (): DraftSet[] => [
  { set_type: "reps", reps: 8, weight: 0, rest_seconds: 60 },
  { set_type: "reps", reps: 8, weight: 0, rest_seconds: 60 },
  { set_type: "reps", reps: 8, weight: 0, rest_seconds: 60 },
];

export const useDraftStore = create<DraftState>((set) => ({
  exercises: [],
  addExercise: (ex) =>
    set((s) =>
      s.exercises.some((e) => e.exercise_id === ex.id)
        ? s
        : {
            exercises: [
              ...s.exercises,
              {
                exercise_id: ex.id,
                name: ex.name,
                muscle_group: ex.muscle_group,
                sets: defaultSets(),
              },
            ],
          },
    ),
  removeExercise: (id) =>
    set((s) => ({
      exercises: s.exercises.filter((e) => e.exercise_id !== id),
    })),
  addSet: (id) =>
    set((s) => ({
      exercises: s.exercises.map((e) => {
        if (e.exercise_id !== id) return e;
        const last = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [
            ...e.sets,
            {
              set_type: last?.set_type ?? "reps",
              reps: last?.reps ?? 8,
              weight: last?.weight ?? 0,
              rest_seconds: last?.rest_seconds ?? 60,
            },
          ],
        };
      }),
    })),
  removeSet: (id, index) =>
    set((s) => ({
      exercises: s.exercises.map((e) => {
        if (e.exercise_id !== id) return e;
        if (e.sets.length <= 1) return e;
        return { ...e, sets: e.sets.filter((_, i) => i !== index) };
      }),
    })),
  updateSet: (id, index, patch) =>
    set((s) => ({
      exercises: s.exercises.map((e) =>
        e.exercise_id === id
          ? {
              ...e,
              sets: e.sets.map((st, i) =>
                i === index ? { ...st, ...patch } : st,
              ),
            }
          : e,
      ),
    })),
  loadTemplate: (exercises) => set({ exercises }),
  reset: () => set({ exercises: [] }),
}));
