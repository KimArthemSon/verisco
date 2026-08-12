import { getDb } from "@core/db";

export type Journey = {
  id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  before_photo_uri: string | null;
  after_photo_uri: string | null;
  purpose_quote: string | null;
  completion_note: string | null;
  status: "active" | "completed";
  created_at: string;
};

export type JourneyInput = {
  name: string;
  start_date: string;
  end_date?: string | null;
  before_photo_uri?: string | null;
  after_photo_uri?: string | null;
  purpose_quote?: string | null;
  completion_note?: string | null;
};

export async function getJourneys(): Promise<Journey[]> {
  const db = await getDb();
  return db.getAllAsync<Journey>(
    `SELECT * FROM journeys
     ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, created_at DESC`,
  );
}

export async function getJourney(id: number): Promise<Journey | null> {
  const db = await getDb();
  return db.getFirstAsync<Journey>("SELECT * FROM journeys WHERE id = ?", [id]);
}

export async function createJourney(input: JourneyInput) {
  const db = await getDb();
  return db.runAsync(
    `INSERT INTO journeys (name, start_date, end_date, before_photo_uri, purpose_quote)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.name,
      input.start_date,
      input.end_date ?? null,
      input.before_photo_uri ?? null,
      input.purpose_quote ?? null,
    ],
  );
}

export async function updateJourney(
  id: number,
  patch: Partial<JourneyInput> & { status?: "active" | "completed" },
) {
  const db = await getDb();
  const fields: string[] = [];
  const params: Array<string | number | null> = [];
  const keys = [
    "name",
    "start_date",
    "end_date",
    "before_photo_uri",
    "after_photo_uri",
    "purpose_quote",
    "completion_note",
    "status",
  ] as const;

  for (const k of keys) {
    if (k in patch) {
      const value = (patch as Record<string, unknown>)[k];
      fields.push(`${k} = ?`);
      params.push(
        typeof value === "string" || typeof value === "number" ? value : null,
      );
    }
  }
  if (fields.length === 0) return;

  params.push(id);
  await db.runAsync(
    `UPDATE journeys SET ${fields.join(", ")} WHERE id = ?`,
    params,
  );
}

export async function deleteJourney(id: number) {
  const db = await getDb();
  await db.runAsync("DELETE FROM journeys WHERE id = ?", [id]);
}
