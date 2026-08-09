/**
 * Viresco — SQLite schema (final v3.0)
 * Runs on first launch. IF NOT EXISTS = safe to run every launch.
 */
export const SCHEMA = `
PRAGMA foreign_keys = ON;

-- Journeys: the transformation container
CREATE TABLE IF NOT EXISTS journeys (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  start_date       TEXT NOT NULL,
  end_date         TEXT,
  before_photo_uri TEXT,
  after_photo_uri  TEXT,
  purpose_quote    TEXT,
  status           TEXT DEFAULT 'active'
                   CHECK(status IN ('active','completed')),
  created_at       TEXT DEFAULT (datetime('now'))
);

-- Workouts: live inside a journey. journey_id NULL + is_template 1 = template
CREATE TABLE IF NOT EXISTS workouts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id  INTEGER REFERENCES journeys(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_template INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- Exercise library
CREATE TABLE IF NOT EXISTS exercises (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  muscle_group TEXT,
  media_uri    TEXT,
  notes        TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

-- Ordered link: workout -> exercises
CREATE TABLE IF NOT EXISTS workout_exercises (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id  INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  position    INTEGER NOT NULL
);

-- Planned sets per exercise
CREATE TABLE IF NOT EXISTS workout_sets (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_exercise_id INTEGER NOT NULL
                      REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number   INTEGER NOT NULL,
  reps         INTEGER,
  weight       REAL DEFAULT 0,
  rest_seconds INTEGER DEFAULT 60
);

-- Schedule + alerts per workout
CREATE TABLE IF NOT EXISTS schedules (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id       INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  schedule_type    TEXT NOT NULL CHECK(schedule_type IN ('once','weekly')),
  target_date      TEXT,
  days_of_week     TEXT,
  time             TEXT,
  reminder_enabled INTEGER DEFAULT 0,
  notification_id  TEXT
);

-- One actual run of a workout
CREATE TABLE IF NOT EXISTS sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id  INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  journey_id  INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  started_at  TEXT,
  finished_at TEXT,
  status      TEXT DEFAULT 'in_progress'
              CHECK(status IN ('in_progress','completed','aborted'))
);

-- Logged sets inside a session
CREATE TABLE IF NOT EXISTS session_sets (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id  INTEGER NOT NULL REFERENCES exercises(id),
  set_number   INTEGER NOT NULL,
  reps         INTEGER,
  weight       REAL DEFAULT 0,
  completed    INTEGER DEFAULT 0,
  completed_at TEXT
);
`;