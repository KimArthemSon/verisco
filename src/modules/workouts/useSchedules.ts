import { useQuery } from '@tanstack/react-query';
import { getAllSchedules, getSchedulesByWorkout, } from './schedules';

export function useSchedulesByWorkout(workoutId: number) {
  return useQuery({
    queryKey: ['schedules', workoutId],
    queryFn: () => getSchedulesByWorkout(workoutId),
  });
}

export function useAllSchedules() {
  return useQuery({ queryKey: ['schedules', 'all'], queryFn: getAllSchedules });
}