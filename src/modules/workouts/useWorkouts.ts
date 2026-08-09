import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createWorkout,
  deleteWorkout,
  getTemplates,
  getWorkoutDetail,
  getWorkoutsByJourney,
  promoteToTemplate,
  updateWorkout,
  type WorkoutInput,
} from "./repository";

export function useWorkoutsByJourney(journeyId: number) {
  return useQuery({
    queryKey: ["workouts", "journey", journeyId],
    queryFn: () => getWorkoutsByJourney(journeyId),
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ["workouts", "templates"],
    queryFn: getTemplates,
  });
}

export function useWorkoutDetail(id: number) {
  return useQuery({
    queryKey: ["workouts", id],
    queryFn: () => getWorkoutDetail(id),
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkoutInput) => createWorkout(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteWorkout(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts"] }),
  });
}

export function usePromoteToTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => promoteToTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts"] }),
  });
}

export function useUpdateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; input: WorkoutInput }) =>
      updateWorkout(v.id, v.input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts"] }),
  });
}


