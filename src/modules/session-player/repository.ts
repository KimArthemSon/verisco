import { getDb } from '@core/db';

export type SessionDetail = {
  id: number;
  workout_id: number;
  journey_id: number;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  exercises: {
    exercise_id: number;
    exercise_name: string;
    exercise_muscle_group: string | null;
    exercise_media_uri: string | null;
    sets: {
      id: number;
      set_number: number;
      reps: number | null;
      weight: number;
      completed: number;
      completed_at: string | null;
      rest_seconds: number;
    }[];
  }[];
};

export async function startSession(workoutId: number, journeyId: number) {
  const db = await getDb();
  
  // 1. Create the session
  const sessionRes = await db.runAsync(
    "INSERT INTO sessions (workout_id, journey_id, started_at, status) VALUES (?, ?, datetime('now'), 'in_progress')",
    [workoutId, journeyId]
  );
  const sessionId = sessionRes.lastInsertRowId;

  // 2. Pre-populate session_sets from the workout plan
  await db.runAsync(`
    INSERT INTO session_sets (session_id, exercise_id, set_number, reps, weight)
    SELECT ?, we.exercise_id, ws.set_number, ws.reps, ws.weight
    FROM workout_exercises we
    JOIN workout_sets ws ON ws.workout_exercise_id = we.id
    WHERE we.workout_id = ?
  `, [sessionId, workoutId]);

  return sessionId;
}

export async function getSessionDetail(sessionId: number): Promise<SessionDetail | null> {
  const db = await getDb();
  const session = await db.getFirstAsync<any>('SELECT * FROM sessions WHERE id = ?', [sessionId]);
  if (!session) return null;

  // Join with workout plan to get rest_seconds and preserve exercise order
  const sets = await db.getAllAsync<any>(`
    SELECT ss.id, ss.exercise_id, ss.set_number, ss.reps, ss.weight, ss.completed, ss.completed_at,
           e.name AS exercise_name, e.muscle_group AS exercise_muscle_group, e.media_uri AS exercise_media_uri,
           COALESCE(ws.rest_seconds, 60) as rest_seconds
    FROM session_sets ss
    JOIN exercises e ON e.id = ss.exercise_id
    LEFT JOIN workout_exercises we ON we.workout_id = ? AND we.exercise_id = ss.exercise_id
    LEFT JOIN workout_sets ws ON ws.workout_exercise_id = we.id AND ws.set_number = ss.set_number
    WHERE ss.session_id = ?
    ORDER BY we.position, ss.set_number
  `, [session.workout_id, sessionId]);

  // Group sets by exercise
  const exerciseMap = new Map<number, any>();
  for (const s of sets) {
    if (!exerciseMap.has(s.exercise_id)) {
      exerciseMap.set(s.exercise_id, {
        exercise_id: s.exercise_id,
        exercise_name: s.exercise_name,
        exercise_muscle_group: s.exercise_muscle_group,
        exercise_media_uri: s.exercise_media_uri,
        sets: []
      });
    }
    exerciseMap.get(s.exercise_id).sets.push({
      id: s.id, set_number: s.set_number, reps: s.reps, weight: s.weight,
      completed: s.completed, completed_at: s.completed_at, rest_seconds: s.rest_seconds
    });
  }

  return { ...session, exercises: Array.from(exerciseMap.values()) };
}

export async function updateSessionSet(setId: number, reps: number | null, weight: number) {
  const db = await getDb();
  await db.runAsync('UPDATE session_sets SET reps = ?, weight = ? WHERE id = ?', [reps, weight, setId]);
}

export async function toggleSessionSetComplete(setId: number, completed: boolean) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE session_sets SET completed = ?, completed_at = ? WHERE id = ?',
    [completed ? 1 : 0, completed ? new Date().toISOString() : null, setId]
  );
}

export async function finishSession(sessionId: number, status: 'completed' | 'aborted') {
  const db = await getDb();
  await db.runAsync(
    "UPDATE sessions SET status = ?, finished_at = datetime('now') WHERE id = ?",
    [status, sessionId]
  );
}

// ── Active session (Home Resume card) ────────────────────────────
export type ActiveSession = {
  id: number;
  workout_id: number;
  journey_id: number;
  started_at: string | null;
  status: string;
  workout_name: string;
};

export async function getActiveSession(): Promise<ActiveSession | null> {
  const db = await getDb();
  return db.getFirstAsync<ActiveSession>(
    `SELECT s.id, s.workout_id, s.journey_id, s.started_at, s.status, w.name AS workout_name
     FROM sessions s
     JOIN workouts w ON w.id = s.workout_id
     WHERE s.status = 'in_progress'
     ORDER BY s.started_at DESC
     LIMIT 1`,
  );
}

// ── History per journey ──────────────────────────────────────────
export type JourneySession = {
  id: number;
  status: 'completed' | 'aborted' | 'in_progress';
  started_at: string | null;
  workout_name: string;
  sets_done: number;
  volume: number;
};

export async function getSessionsByJourney(journeyId: number): Promise<JourneySession[]> {
  const db = await getDb();
  return db.getAllAsync<JourneySession>(
    `SELECT s.id, s.status, s.started_at, w.name AS workout_name,
       (SELECT COUNT(*) FROM session_sets ss
          WHERE ss.session_id = s.id AND ss.completed = 1) AS sets_done,
       (SELECT COALESCE(SUM(ss.reps * ss.weight), 0) FROM session_sets ss
          WHERE ss.session_id = s.id AND ss.completed = 1 AND ss.weight > 0) AS volume
     FROM sessions s
     JOIN workouts w ON w.id = s.workout_id
     WHERE s.journey_id = ?
     ORDER BY s.started_at DESC`,
    [journeyId],
  );
}


// ── Delete session (history cleanup) ─────────────────────────────
export async function deleteSession(sessionId: number) {
  const db = await getDb();
  // session_sets cascade deletes automatically due to ON DELETE CASCADE
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [sessionId]);
}

// ── Last session for a workout (replay detection) ────────────────
export type LastSession = {
  id: number;
  status: string;
  started_at: string | null;
  volume: number;
  sets_done: number;
};

export async function getLastSessionForWorkout(workoutId: number): Promise<LastSession | null> {
  const db = await getDb();
  return db.getFirstAsync<LastSession>(
    `SELECT s.id, s.status, s.started_at,
       (SELECT COUNT(*) FROM session_sets ss
          WHERE ss.session_id = s.id AND ss.completed = 1) AS sets_done,
       (SELECT COALESCE(SUM(ss.reps * ss.weight), 0) FROM session_sets ss
          WHERE ss.session_id = s.id AND ss.completed = 1 AND ss.weight > 0) AS volume
     FROM sessions s
     WHERE s.workout_id = ? AND s.status = 'completed'
     ORDER BY s.started_at DESC
     LIMIT 1`,
    [workoutId],
  );
}

// ── Today's workouts for a journey ───────────────────────────────
export async function getTodayWorkouts(journeyId: number): Promise<number[]> {
  const db = await getDb();
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const todayISO = today.toISOString().slice(0, 10);

  // Get workout IDs that are scheduled for today (either once or weekly)
  const results = await db.getAllAsync<{ workout_id: number }>(
    `SELECT DISTINCT w.id AS workout_id
     FROM workouts w
     LEFT JOIN schedules sc ON sc.workout_id = w.id
     WHERE w.journey_id = ?
       AND (
         (sc.schedule_type = 'once' AND sc.target_date = ?)
         OR (sc.schedule_type = 'weekly' AND sc.days_of_week LIKE ?)
       )`,
    [journeyId, todayISO, `%${dayOfWeek}%`],
  );
  return results.map((r) => r.workout_id);
}

// ── Active (in_progress) session for a workout → resume ──────────
export async function getActiveSessionForWorkout(
  workoutId: number,
): Promise<{ id: number } | null> {
  const db = await getDb();
  return db.getFirstAsync<{ id: number }>(
    `SELECT id FROM sessions
     WHERE workout_id = ? AND status = 'in_progress'
     ORDER BY started_at DESC
     LIMIT 1`,
    [workoutId],
  );
}

// ── All sessions with names (Calendar page) ──────────────────────
export type SessionWithNames = {
  id: number;
  status: 'completed' | 'aborted' | 'in_progress';
  started_at: string | null;
  workout_name: string;
  journey_name: string;
  sets_done: number;
  volume: number;
};

export async function getAllSessionsWithNames(): Promise<SessionWithNames[]> {
  const db = await getDb();
  return db.getAllAsync<SessionWithNames>(
    `SELECT s.id, s.status, s.started_at, w.name AS workout_name, j.name AS journey_name,
       (SELECT COUNT(*) FROM session_sets ss
          WHERE ss.session_id = s.id AND ss.completed = 1) AS sets_done,
       (SELECT COALESCE(SUM(ss.reps * ss.weight), 0) FROM session_sets ss
          WHERE ss.session_id = s.id AND ss.completed = 1 AND ss.weight > 0) AS volume
     FROM sessions s
     JOIN workouts w ON w.id = s.workout_id
     JOIN journeys j ON j.id = s.journey_id
     ORDER BY s.started_at DESC
     LIMIT 50`,
  );
}