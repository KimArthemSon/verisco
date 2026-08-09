import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteSession,
  finishSession,
  getActiveSession,
  getAllSessionsWithNames,
  getLastSessionForWorkout,
  getSessionDetail,
  getSessionsByJourney,
  getTodayWorkouts,
  startSession,
  toggleSessionSetComplete,
  updateSessionSet,
} from "./repository";

export function useSessionDetail(id: number) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => getSessionDetail(id),
    enabled: id > 0,
  });
}

export function useActiveSession() {
  return useQuery({
    queryKey: ["session", "active"],
    queryFn: getActiveSession,
  });
}

export function useSessionsByJourney(journeyId: number) {
  return useQuery({
    queryKey: ["session", "journey", journeyId],
    queryFn: () => getSessionsByJourney(journeyId),
  });
}

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { workoutId: number; journeyId: number }) =>
      startSession(v.workoutId, v.journeyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session"] }),
  });
}

export function useUpdateSessionSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { setId: number; reps: number | null; weight: number }) =>
      updateSessionSet(v.setId, v.reps, v.weight),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session"] }),
  });
}

export function useToggleSessionSetComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { setId: number; completed: boolean }) =>
      toggleSessionSetComplete(v.setId, v.completed),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session"] }),
  });
}

export function useFinishSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { sessionId: number; status: "completed" | "aborted" }) =>
      finishSession(v.sessionId, v.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session"] });
      qc.invalidateQueries({ queryKey: ["journeys"] });
      qc.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: number) => deleteSession(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session"] }),
  });
}

export function useLastSessionForWorkout(workoutId: number) {
  return useQuery({
    queryKey: ["session", "last", workoutId],
    queryFn: () => getLastSessionForWorkout(workoutId),
    enabled: workoutId > 0,
  });
}

export function useTodayWorkouts(journeyId: number) {
  return useQuery({
    queryKey: ["workouts", "today", journeyId],
    queryFn: () => getTodayWorkouts(journeyId),
  });
}

export function useAllSessions() {
  return useQuery({
    queryKey: ["session", "all"],
    queryFn: getAllSessionsWithNames,
  });
}
