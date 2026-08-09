import { getDb } from '@core/db';
import type { Journey } from './types';

export async function listJourneys(): Promise<Journey[]> {
  const db = await getDb();
  return db.getAllAsync<Journey>('SELECT * FROM journeys ORDER BY created_at DESC');
}