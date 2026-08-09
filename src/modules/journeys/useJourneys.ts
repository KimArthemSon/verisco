import { useQuery } from '@tanstack/react-query';
import { listJourneys } from './repository';

export function useJourneys() {
  return useQuery({ queryKey: ['journeys'], queryFn: listJourneys });
}