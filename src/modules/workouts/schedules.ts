import { getDb } from "@core/db";
import * as Notifications from "expo-notifications";

export type Schedule = {
  id: number;
  workout_id: number;
  schedule_type: "once" | "weekly";
  target_date: string | null;
  days_of_week: string | null; // JSON array
  time: string | null;
  reminder_enabled: number;
  notification_id: string | null;
};

export type ScheduleInput = {
  workout_id: number;
  schedule_type: "once" | "weekly";
  target_date?: string | null;
  days_of_week?: number[];
  time: string;
  reminder_enabled: boolean;
};

export async function getSchedulesByWorkout(
  workoutId: number,
): Promise<Schedule[]> {
  const db = await getDb();
  return db.getAllAsync<Schedule>(
    "SELECT * FROM schedules WHERE workout_id = ?",
    [workoutId],
  );
}

export async function saveSchedule(input: ScheduleInput) {
  const db = await getDb();
  const existing = await db.getFirstAsync<Schedule>(
    "SELECT * FROM schedules WHERE workout_id = ?",
    [input.workout_id],
  );

  // Cancel old notification if exists
  if (existing?.notification_id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(
        existing.notification_id,
      );
    } catch {
      // ignore — token may not exist in Expo Go
    }
  }

  let notifId: string | null = null;
  if (input.reminder_enabled) {
    try {
      const [h, m] = input.time.split(":").map(Number);
      const trigger: Notifications.NotificationTriggerInput =
        input.schedule_type === "once" && input.target_date
          ? {
              date: new Date(`${input.target_date}T${input.time}:00`),
            }
          : {
              type: "weekly" as const,
              weekday: input.days_of_week?.[0] ?? 1,
              hour: h,
              minute: m,
            };

      notifId = await Notifications.scheduleNotificationAsync({
        content: { title: "Workout time", body: "Time to crush your session" },
        trigger,
      });
    } catch (e) {
      console.warn(
        "Notifications unavailable (Expo Go) — schedule still saved.",
        e,
      );
    }
  }

  if (existing) {
    await db.runAsync(
      `UPDATE schedules
       SET schedule_type = ?, target_date = ?, days_of_week = ?, time = ?, reminder_enabled = ?, notification_id = ?
       WHERE id = ?`,
      [
        input.schedule_type,
        input.target_date ?? null,
        input.days_of_week ? JSON.stringify(input.days_of_week) : null,
        input.time,
        input.reminder_enabled ? 1 : 0,
        notifId,
        existing.id,
      ],
    );
    return existing.id;
  }

  const result = await db.runAsync(
    `INSERT INTO schedules (workout_id, schedule_type, target_date, days_of_week, time, reminder_enabled, notification_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.workout_id,
      input.schedule_type,
      input.target_date ?? null,
      input.days_of_week ? JSON.stringify(input.days_of_week) : null,
      input.time,
      input.reminder_enabled ? 1 : 0,
      notifId,
    ],
  );
  return result.lastInsertRowId;
}

export async function deleteSchedule(workoutId: number) {
  const db = await getDb();
  const existing = await db.getFirstAsync<Schedule>(
    "SELECT * FROM schedules WHERE workout_id = ?",
    [workoutId],
  );
  if (existing?.notification_id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(
        existing.notification_id,
      );
    } catch {
      // ignore — token may not exist in Expo Go
    }
  }
  await db.runAsync("DELETE FROM schedules WHERE workout_id = ?", [workoutId]);
}

// ── All schedules with workout names (Calendar planned days) ─────
export type ScheduleWithWorkout = {
  id: number;
  workout_id: number;
  schedule_type: 'once' | 'weekly';
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
