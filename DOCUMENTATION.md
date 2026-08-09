# 🌿 VIRESCO — Mobile App Documentation

**Version:** 3.0 (FINAL)
**Date:** August 8, 2026
**Platform:** iOS + Android (React Native / Expo SDK 54)
**Data:** 100% offline, on-device SQLite

---

## 1. About

**Viresco** (Latin: *"I grow strong / I flourish"*) is a minimalist,
offline-first mobile app for documenting personal transformation
journeys through strength training.

Instead of endless metrics, Viresco is built around one idea:
**a journey is a story** — it has a beginning (before photo),
a purpose (quote), a timeline (start → end), and chapters
(workouts & sessions).

> *"One journey at a time. Document your transformation."*

### Non-goals (intentionally excluded)
- ❌ Nutrition / calorie tracking
- ❌ Dashboard with quick stats / streaks
- ❌ Accounts, cloud sync, social features
- ❌ Archived journeys (only active / completed)

---

## 2. Design System

### Palette
| Token | Hex | Usage |
|---|---|---|
| `green` | `#2D5F3F` | Primary actions, active states, trend line |
| `greenDark` | `#1A3C2A` | Dark-mode surfaces, headers |
| `white` | `#FFFFFF` | Light-mode background, cards |
| `offWhite` | `#F5F5F0` | Light-mode secondary surfaces |
| `black` | `#1A1A1A` | Dark-mode background, light-mode text |
| `gray` | `#8A8A8A` | Secondary text, borders, inactive |

### Typography
- Headings: Inter / SF Pro Display (Bold)
- Body: Inter / SF Pro Text (Regular)
- Logs & numbers: JetBrains Mono

### Principles
1. Minimalist — whitespace over decoration
2. Photo-first — before/after images are the heart of the app
3. Calm — smooth transitions, no noisy animations
4. Dark-mode parity — both themes feel intentional

### Theme
- Toggle (🌞/🌙) in Home header
- Default follows system; choice persisted in AsyncStorage

---

## 3. Glossary

| Term | Meaning |
|---|---|
| **Journey** | A time-boxed transformation (photo + purpose + dates) |
| **Workout** | A named routine inside a journey (ordered exercises) |
| **Template** | A reusable workout blueprint (`is_template = 1`) |
| **Exercise** | Library entry (name, muscle group, media, notes) |
| **Set** | Planned reps × weight + rest seconds |
| **Session** | One actual performance of a workout |
| **Session Set** | A logged set inside a session (may differ from plan) |

---

## 4. Features

### 4.1 🏠 Home (tab)
- **Hero carousel** — large rotating images with quick info
- **Trend line** — sessions-per-week line chart (progress at a glance)
- **Pinned journey card** — active journey: photo, name, day X of Y,
  next scheduled workout
- **Resume session card** — appears only if a session is `in_progress`
- **Create Journey** button

### 4.2 🗺️ Journeys (tab)
List of all journeys (active first, completed below as memories).

**Journey fields**
| Field | Required |
|---|---|
| Name | ✅ |
| Start date | ✅ |
| End date (target) | ❌ |
| Before photo | ✅ (gallery or camera) |
| Purpose / quote | ❌ |
| After photo | ❌ (captured when completing) |

**Statuses:** `active` → `completed` (never deleted by accident;
completed journeys remain as portfolio entries).

### 4.3 🏋️ Workouts & Exercises
**Structure**
```
WORKOUT "Push Day A"  (journey: Summer Cut 2026)
├── schedule: weekly [Mon, Thu] @ 18:00 • reminder ON
├── 1. Bench Press (chest • 📷 video)
│   ├── Set 1: 8 × 60 kg → rest 90s
│   ├── Set 2: 8 × 60 kg → rest 90s
│   └── Set 3: 6 × 65 kg → rest 120s
├── 2. Overhead Press (shoulders)
│   └── Sets 1–2: 10 × 40 kg → rest 90s
└── 3. Tricep Dips (BW)
    └── Sets 1–3: 12 × 0 kg → rest 60s
```

**Exercise library fields:** name, muscle_group, media_uri
(image *or* video for form reference), notes.

**Creating a workout (inside a journey)**
1. Name it
2. Toggle *"based on existing template?"* → pick & **copy**, or blank
3. Add exercises (from library or create new)
4. Configure sets (reps / weight / rest)
5. Schedule + alerts (see 4.4)

### 4.4 🔔 Schedules & Alerts (per workout)
- **Once** → custom date + time
- **Weekly** → day chips `Mon Tue Wed Thu Fri Sat Sun` (multi-select) + time
- **Reminder toggle** → local push notification at the set time

### 4.5 🎮 Session Player
```
[Overview] → [Exercise Screen] ⇄ [Rest Timer] → … → [Summary]
```

**Screen 1 — Overview:** workout + journey name, exercise preview,
estimated duration, [Start Workout].

**Screen 2 — Exercise Screen**
```
┌───────────────────────────────┐
│ ← Push Day A         Ex 2/5 ▓▓░ │
│  OVERHEAD PRESS       [▶ form]│
│  shoulders • last time: 10×40 │
│  ✔ Set 1  10 × 40 kg          │
│  ▸ Set 2 [10] × [40] kg       │
│    Set 3  10 × 40             │
│  [      COMPLETE SET ✔      ] │
└───────────────────────────────┘
```
- Current set pre-filled from plan, editable before confirming
- Completed sets tappable to correct mistakes
- [▶ form] opens the exercise's image/video

**Screen 3 — Rest Timer**
```
┌───────────────────────────────┐
│            REST   01:30       │
│         (green ring)          │
│  [+30s]   [⏸/▶]   [Skip ⏭]    │
│  Next: Set 3 — 6 × 65 kg      │
└───────────────────────────────┘
```
- Counts `rest_seconds`; +30s / pause / skip
- At 0:00 → vibration + auto-advance
- No rest after the final set of the workout

**Screen 4 — Summary:** duration, sets completed (7/7),
total volume Σ(reps×weight), [Save Session] → `completed`.

**Edge cases**
| Case | Behavior |
|---|---|
| App closed mid-session | Stays `in_progress`; Resume card on Home |
| Resume | Continues at next uncompleted set |
| Abandon | Confirm → `aborted`, excluded from reports |
| New session while one active | Ask: resume or abandon |
| Weight 0 | Shown "BW", excluded from volume |

### 4.6 📅 Calendar (tab)
- Month view; days with past sessions marked (green dot)
- Tap a day → sessions of that day with their journey
- Bottom: chronological **history list** (workout name + journey name)

### 4.7 📈 Reports (tab)
- Volume trend (reps × weight over time)
- Consistency (completed vs scheduled)
- Personal records per exercise
- **Portfolio export (PDF)** — printable, shareable document:
  journey name, quote, before/after photos, date range, stats,
  full session history → via `expo-print` + `expo-sharing`

---

## 5. Navigation Map

```
(tabs)
├── Home (index)
├── Journeys
├── Calendar
└── Reports

(stack / modal)
├── journey/create          ├── workout/create
├── journey/[id]            ├── workout/[id]
├── exercise/editor         ├── session/[id]   ← player
└── calendar/day/[date]
```

---

## 6. Folder Structure

```
viresco/
├── app/
│   ├── (tabs)/ index.tsx journeys.tsx calendar.tsx reports.tsx
│   ├── _layout.tsx  +not-found.tsx
│   ├── journey/ create.tsx [id].tsx
│   ├── workout/ create.tsx [id].tsx
│   ├── session/ [id].tsx
│   └── calendar/ day/[date].tsx
├── src/
│   ├── core/
│   │   ├── db/ index.ts schema.ts
│   │   ├── ui/ theme.ts Button.tsx Card.tsx ImagePicker.tsx
│   │   │       RestRing.tsx TrendLine.tsx
│   │   └── utils/ dates.ts media.ts pdf.ts
│   └── modules/
│       ├── home/ journeys/ workouts/ session-player/
│       ├── calendar/ reports/ reminders/
├── assets/ images/ fonts/
├── app.json  tsconfig.json  DOCUMENTATION.md
```

---

## 7. Database Schema (final)

```sql
PRAGMA foreign_keys = ON;

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

CREATE TABLE IF NOT EXISTS workouts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  journey_id  INTEGER REFERENCES journeys(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_template INTEGER DEFAULT 0,      -- journey NULL + 1 = template
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exercises (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  muscle_group TEXT,
  media_uri    TEXT,
  notes        TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id  INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  position    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_exercise_id INTEGER NOT NULL
                      REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number   INTEGER NOT NULL,
  reps         INTEGER,
  weight       REAL DEFAULT 0,        -- 0 = bodyweight
  rest_seconds INTEGER DEFAULT 60
);

CREATE TABLE IF NOT EXISTS schedules (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id       INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  schedule_type    TEXT NOT NULL CHECK(schedule_type IN ('once','weekly')),
  target_date      TEXT,
  days_of_week     TEXT,              -- JSON e.g. [1,4]
  time             TEXT,              -- 'HH:MM'
  reminder_enabled INTEGER DEFAULT 0,
  notification_id  TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id  INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  journey_id  INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  started_at  TEXT,
  finished_at TEXT,
  status      TEXT DEFAULT 'in_progress'
              CHECK(status IN ('in_progress','completed','aborted'))
);

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
```

---

## 8. Architecture

- **Repository pattern** — raw SQL lives in `modules/*/repository.ts`
- **TanStack Query** — `useQuery` for reads, `useMutation` + invalidation
  for writes
- **Zustand** — session player runtime state (current exercise/set, timer)
- **Media** — files copied to app documents via `expo-file-system`;
  only URIs stored in SQLite
- **Notifications** — `expo-notifications`, local only
- **PDF** — HTML template → `expo-print` → share via `expo-sharing`
- **Calendar UI** — `react-native-calendars`
- **Charts** — `react-native-gifted-charts`

```ts
// pattern example
export function useCreateJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: JourneyInput) => repo.createJourney(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journeys'] }),
  });
}
```

---

## 9. Privacy & Data

- All data in `viresco.db` inside the app sandbox
- No network calls, no analytics, no accounts
- Export = user-initiated PDF sharing only

---

## 10. Build Order & Roadmap

| # | Step | Phase |
|---|---|---|
| 1 | ✅ Project setup (Expo + SQLite + React Query) | done |
| 2 | Theme system (palette, dark mode, Button/Card) | 1 |
| 3 | Journeys CRUD + before photo | 1 |
| 4 | Workouts CRUD + templates + schedules/alerts | 2 |
| 5 | Session Player + rest timer | 2–3 |
| 6 | Calendar + history | 3 |
| 7 | Home (carousel, trend, pinned journey) | 3 |
| 8 | Reports + portfolio PDF | 4 |
| 9 | Reminders wiring | 4 |
| 10 | Polish, testing, store prep | 5 |

---

## 11. Testing

- Vitest for repository SQL logic (in-memory SQLite)
- React Native Testing Library for key screens
- Manual QA on device: light/dark, interrupt/resume, PDF export

---

*End of document. Viresco v3.0 FINAL.*