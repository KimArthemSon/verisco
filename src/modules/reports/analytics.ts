import { getDb } from '@core/db';

export type ReportSet = {
  exercise_id: number;
  exercise_name: string;
  reps: number | null;
  weight: number;
};

export type ReportSession = {
  id: number;
  journey_id: number;
  status: string;
  started_at: string | null;
  workout_name: string;
  sets: ReportSet[];
};

export type CertificateStats = {
  sessionsCount: number;
  setsDone: number;
  volume: number;
  prs: { exercise_name: string; weight: number; reps: number }[];
  weekly: { label: string; value: number }[];
  workouts: string[];
  consistency: number | null;
};

export async function getReportSessions(journeyId: number | null): Promise<ReportSession[]> {
  const db = await getDb();
  const sessions = journeyId
    ? await db.getAllAsync<any>(
        `SELECT s.id, s.journey_id, s.status, s.started_at, w.name AS workout_name
         FROM sessions s JOIN workouts w ON w.id = s.workout_id
         WHERE s.journey_id = ? ORDER BY s.started_at`,
        [journeyId],
      )
    : await db.getAllAsync<any>(
        `SELECT s.id, s.journey_id, s.status, s.started_at, w.name AS workout_name
         FROM sessions s JOIN workouts w ON w.id = s.workout_id
         ORDER BY s.started_at`,
      );

  const sets = await db.getAllAsync<any>(
    `SELECT ss.session_id, ss.exercise_id, e.name AS exercise_name, ss.reps, ss.weight
     FROM session_sets ss JOIN exercises e ON e.id = ss.exercise_id
     WHERE ss.completed = 1`,
  );

  const bySession = new Map<number, ReportSet[]>();
  for (const s of sets) {
    if (!bySession.has(s.session_id)) bySession.set(s.session_id, []);
    bySession.get(s.session_id)!.push({
      exercise_id: s.exercise_id,
      exercise_name: s.exercise_name,
      reps: s.reps,
      weight: s.weight,
    });
  }

  return sessions.map((s) => ({ ...s, sets: bySession.get(s.id) ?? [] }));
}

export function inLastDays(sessions: ReportSession[], days: number): ReportSession[] {
  const from = Date.now() - days * 86400000;
  return sessions.filter(
    (s) => s.started_at && new Date(s.started_at.replace(' ', 'T')).getTime() >= from,
  );
}

export function sessionVolume(s: ReportSession): number {
  return s.sets.reduce((acc, set) => acc + (set.weight > 0 ? (set.reps ?? 0) * set.weight : 0), 0);
}

export function totals(sessions: ReportSession[]) {
  const completed = sessions.filter((s) => s.status === 'completed');
  return {
    sessions: completed.length,
    sets: completed.reduce((a, s) => a + s.sets.length, 0),
    volume: Math.round(completed.reduce((a, s) => a + sessionVolume(s), 0)),
  };
}

export function weeklyVolume(sessions: ReportSession[]): { label: string; value: number }[] {
  const map = new Map<string, number>();
  sessions
    .filter((s) => s.status === 'completed' && s.started_at)
    .forEach((s) => {
      const d = new Date(s.started_at!.replace(' ', 'T'));
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = `${monday.getMonth() + 1}/${monday.getDate()}`;
      map.set(key, (map.get(key) ?? 0) + sessionVolume(s));
    });
  return Array.from(map.entries()).map(([label, value]) => ({ label, value: Math.round(value) }));
}

export function personalRecords(sessions: ReportSession[]) {
  const best = new Map<string, { exercise_name: string; weight: number; reps: number }>();
  sessions
    .filter((s) => s.status === 'completed')
    .forEach((s) =>
      s.sets.forEach((set) => {
        if (set.weight <= 0) return;
        const cur = best.get(set.exercise_name);
        if (!cur || set.weight > cur.weight) {
          best.set(set.exercise_name, {
            exercise_name: set.exercise_name,
            weight: set.weight,
            reps: set.reps ?? 0,
          });
        }
      }),
    );
  return Array.from(best.values()).sort((a, b) => b.weight - a.weight);
}

export function scheduledOccurrences(
  schedules: { schedule_type: string; target_date: string | null; days_of_week: string | null }[],
  days: number,
): number {
  const from = Date.now() - days * 86400000;
  let occ = 0;
  schedules.forEach((sc) => {
    if (sc.schedule_type === 'once' && sc.target_date) {
      const t = new Date(`${sc.target_date}T00:00:00`).getTime();
      if (t >= from && t <= Date.now()) occ += 1;
    } else if (sc.schedule_type === 'weekly' && sc.days_of_week) {
      let arr: number[] = [];
      try {
        arr = JSON.parse(sc.days_of_week);
      } catch {
        arr = [];
      }
      occ += Math.round((days / 7) * arr.length);
    }
  });
  return occ;
}

export function buildStats(
  sessions: ReportSession[],
  schedules: { schedule_type: string; target_date: string | null; days_of_week: string | null }[],
  days: number,
): CertificateStats {
  const scoped = inLastDays(sessions, days);
  const t = totals(scoped);
  const occ = scheduledOccurrences(schedules, days);
  return {
    sessionsCount: t.sessions,
    setsDone: t.sets,
    volume: t.volume,
    prs: personalRecords(scoped).slice(0, 3),
    weekly: weeklyVolume(scoped).slice(-8),
    workouts: Array.from(new Set(scoped.filter((s) => s.status === 'completed').map((s) => s.workout_name))),
    consistency: occ > 0 ? Math.min(100, Math.round((t.sessions / occ) * 100)) : null,
  };
}