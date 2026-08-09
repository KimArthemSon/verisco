import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createJourney,
  deleteJourney,
  getJourney,
  getJourneys,
  updateJourney,
  type JourneyInput,
} from './repository';

export function useJourneys() {
  return useQuery({ queryKey: ['journeys'], queryFn: getJourneys });
}

export function useJourney(id: number) {
  return useQuery({ queryKey: ['journeys', id], queryFn: () => getJourney(id) });
}

export function useCreateJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: JourneyInput) => createJourney(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journeys'] }),
  });
}

export function useUpdateJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; patch: Parameters<typeof updateJourney>[1] }) =>
      updateJourney(v.id, v.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journeys'] }),
  });
}

export function useDeleteJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteJourney(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journeys'] }),
  });
}