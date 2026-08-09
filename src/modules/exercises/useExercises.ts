import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createExercise,
  deleteExercise,
  getExercise,
  getExercises,
  updateExercise,
  type ExerciseInput,
} from './repository';

export function useExercises() {
  return useQuery({ queryKey: ['exercises'], queryFn: getExercises });
}

export function useExercise(id: number) {
  return useQuery({ queryKey: ['exercises', id], queryFn: () => getExercise(id) });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExerciseInput) => createExercise(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; patch: Parameters<typeof updateExercise>[1] }) =>
      updateExercise(v.id, v.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteExercise(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  });
}