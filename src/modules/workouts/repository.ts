import { getDb } from "@core/db";

export type SetType = "reps" | "time";

export type WorkoutSet = {
  id: number;
  workout_exercise_id: number;
  set_number: number;
  set_type: SetType;
  reps: number | null;
  weight: number;
  rest_seconds: number;
};

export type WorkoutExercise = {
  id: number;
  workout_id: number;
  exercise_id: number;
  position: number;
  exercise_name: string;
  exercise_muscle_group: string | null;
};

export type Workout = {
  id: number;
  journey_id: number | null;
  name: string;
  is_template: number;
  created_at: string;
};

export type WorkoutExerciseWithSets = WorkoutExercise & { sets: WorkoutSet[] };

export type WorkoutDetail = Workout & {
  exercises: WorkoutExerciseWithSets[];
};

export type WorkoutInput = {
  name: string;
  journey_id?: number | null;
  is_template?: boolean;
  exercises: {
    exercise_id: number;
    sets: {
      set_type?: SetType;
      reps?: number | null;
      weight?: number;
      rest_seconds?: number;
    }[];
  }[];
};

export async function getWorkoutsByJourney(
  journeyId: number,
): Promise<Workout[]> {
  const db = await getDb();
  return db.getAllAsync<Workout>(
    "SELECT * FROM workouts WHERE journey_id = ? ORDER BY created_at",
    [journeyId],
  );
}

export async function getTemplates(): Promise<Workout[]> {
  const db = await getDb();
  return db.getAllAsync<Workout>(
    "SELECT * FROM workouts WHERE is_template = 1 ORDER BY name",
  );
}

export async function getWorkout(id: number): Promise<WorkoutDetail | null> {
  return getWorkoutDetail(id);
}

export async function getWorkoutDetail(
  id: number,
): Promise<WorkoutDetail | null> {
  const db = await getDb();
  const workout = await db.getFirstAsync<Workout>(
    "SELECT * FROM workouts WHERE id = ?",
    [id],
  );
  if (!workout) return null;

  const exercises = await db.getAllAsync<WorkoutExercise>(
    `SELECT we.*, e.name AS exercise_name, e.muscle_group AS exercise_muscle_group
     FROM workout_exercises we
     JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_id = ?
     ORDER BY we.position`,
    [id],
  );

  const withSets: WorkoutExerciseWithSets[] = [];
  for (const we of exercises) {
    withSets.push({
      ...we,
      sets: await db.getAllAsync<WorkoutSet>(
        "SELECT * FROM workout_sets WHERE workout_exercise_id = ? ORDER BY set_number",
        [we.id],
      ),
    });
  }

  return { ...workout, exercises: withSets };
}

export async function createWorkout(input: WorkoutInput) {
  const db = await getDb();
  const result = await db.runAsync(
    "INSERT INTO workouts (journey_id, name, is_template) VALUES (?, ?, ?)",
    [input.journey_id ?? null, input.name, input.is_template ? 1 : 0],
  );
  const workoutId = result.lastInsertRowId;

  for (let pos = 0; pos < input.exercises.length; pos++) {
    const ex = input.exercises[pos];
    const weResult = await db.runAsync(
      "INSERT INTO workout_exercises (workout_id, exercise_id, position) VALUES (?, ?, ?)",
      [workoutId, ex.exercise_id, pos],
    );
    const weId = weResult.lastInsertRowId;

    for (let s = 0; s < ex.sets.length; s++) {
      const set = ex.sets[s];
      await db.runAsync(
        "INSERT INTO workout_sets (workout_exercise_id, set_number, set_type, reps, weight, rest_seconds) VALUES (?, ?, ?, ?, ?, ?)",
        [
          weId,
          s + 1,
          set.set_type ?? "reps",
          set.reps ?? null,
          set.weight ?? 0,
          set.rest_seconds ?? 60,
        ],
      );
    }
  }

  return workoutId;
}

export async function deleteWorkout(id: number) {
  const db = await getDb();
  await db.runAsync("DELETE FROM workouts WHERE id = ?", [id]);
}

export async function promoteToTemplate(workoutId: number) {
  const db = await getDb();
  const detail = await getWorkoutDetail(workoutId);
  if (!detail) return null;

  return createWorkout({
    name: detail.name,
    journey_id: null,
    is_template: true,
    exercises: detail.exercises.map((we) => ({
      exercise_id: we.exercise_id,
      sets: we.sets.map((s) => ({
        set_type: s.set_type,
        reps: s.reps,
        weight: s.weight,
        rest_seconds: s.rest_seconds,
      })),
    })),
  });
}

async function insertExercises(
  workoutId: number,
  exercises: WorkoutInput["exercises"],
) {
  const db = await getDb();
  for (let pos = 0; pos < exercises.length; pos++) {
    const ex = exercises[pos];
    const weResult = await db.runAsync(
      "INSERT INTO workout_exercises (workout_id, exercise_id, position) VALUES (?, ?, ?)",
      [workoutId, ex.exercise_id, pos],
    );
    const weId = weResult.lastInsertRowId;
    for (let s = 0; s < ex.sets.length; s++) {
      const set = ex.sets[s];
      await db.runAsync(
        "INSERT INTO workout_sets (workout_exercise_id, set_number, set_type, reps, weight, rest_seconds) VALUES (?, ?, ?, ?, ?, ?)",
        [
          weId,
          s + 1,
          set.set_type ?? "reps",
          set.reps ?? null,
          set.weight ?? 0,
          set.rest_seconds ?? 60,
        ],
      );
    }
  }
}

export async function updateWorkout(id: number, input: WorkoutInput) {
  const db = await getDb();
  await db.runAsync(
    "UPDATE workouts SET name = ?, journey_id = ?, is_template = ? WHERE id = ?",
    [input.name, input.journey_id ?? null, input.is_template ? 1 : 0, id],
  );
  await db.runAsync(
    "DELETE FROM workout_sets WHERE workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id = ?)",
    [id],
  );
  await db.runAsync("DELETE FROM workout_exercises WHERE workout_id = ?", [id]);
  await insertExercises(id, input.exercises);
}

// ── All schedules with workout names (Calendar planned days) ─────
export type ScheduleWithWorkout = {
  id: number;
  workout_id: number;
  schedule_type: "once" | "weekly";
  target_date: string | null;
  days_of_week: string | null;
  time: string | null;
  workout_name: string;
};

export async function getAllSchedules(): Promise<ScheduleWithWorkout[]> {
  const db = await getDb();
  return db.getAllAsync<ScheduleWithWorkout>(
    `SELECT sc.*, w.name AS workout_name
     FROM schedules sc
     JOIN workouts w ON w.id = sc.workout_id`,
  );
}
