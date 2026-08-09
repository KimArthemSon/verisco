import * as SQLite from 'expo-sqlite';
import { SCHEMA } from './schema';

const DB_NAME = 'viresco.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Singleton: opens the DB once, creates tables on first run. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await db.execAsync(SCHEMA);
      return db;
    })();
  }
  return dbPromise;
}

/** Dev tool: wipe everything and start fresh. */
export async function resetDb(): Promise<void> {
  dbPromise = null;
  await SQLite.deleteDatabaseAsync(DB_NAME);
}