import { getDb } from "@core/db";

export type Exercise = {
  id: number;
  name: string;
  muscle_group: string | null;
  media_uri: string | null;
  notes: string | null;
  created_at: string;
};

export type ExerciseInput = {
  name: string;
  muscle_group?: string | null;
  media_uri?: string | null;
  notes?: string | null;
};

export async function getExercises(): Promise<Exercise[]> {
  const db = await getDb();
  return db.getAllAsync<Exercise>("SELECT * FROM exercises ORDER BY name");
}

export async function getExercise(id: number): Promise<Exercise | null> {
  const db = await getDb();
  return db.getFirstAsync<Exercise>("SELECT * FROM exercises WHERE id = ?", [
    id,
  ]);
}

export async function createExercise(input: ExerciseInput) {
  const db = await getDb();
  return db.runAsync(
    "INSERT INTO exercises (name, muscle_group, media_uri, notes) VALUES (?, ?, ?, ?)",
    [
      input.name,
      input.muscle_group ?? null,
      input.media_uri ?? null,
      input.notes ?? null,
    ],
  );
}

export async function updateExercise(
  id: number,
  patch: Partial<ExerciseInput>,
) {
  const db = await getDb();
  const fields: string[] = [];
  const params: Array<string | number | null> = [];
  const keys = ["name", "muscle_group", "media_uri", "notes"] as const;

  for (const k of keys) {
    if (k in patch) {
      fields.push(`${k} = ?`);
      const value = (
        patch as Record<string, string | number | null | undefined>
      )[k];
      params.push(value ?? null);
    }
  }
  if (fields.length === 0) return;

  params.push(id);
  await db.runAsync(
    `UPDATE exercises SET ${fields.join(", ")} WHERE id = ?`,
    ...params,
  );
}

export async function deleteExercise(id: number) {
  const db = await getDb();
  await db.runAsync("DELETE FROM exercises WHERE id = ?", [id]);
}
