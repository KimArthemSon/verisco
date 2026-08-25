export type SetFormatValue = {
  set_type?: "reps" | "time";
  reps?: number | null;
  weight?: number | null;
  rest_seconds?: number | null;
};

export function fmtSet(set: SetFormatValue, count = 1): string {
  const reps = Number(set.reps ?? 0);
  const weight = Number(set.weight ?? 0);

  if (set.set_type === "time") {
    if (count > 1) return `${count} × ${reps}s`;
    return `${reps}s`;
  }

  if (weight > 0) {
    if (count > 1) return `${count} × ${reps} @ ${weight}kg`;
    return `${reps} @ ${weight}kg`;
  }

  if (count > 1) return `${count} × ${reps}`;
  return `${reps} reps`;
}

export function fmtSetSummary(set: SetFormatValue): string {
  if (!set || Number.isNaN(Number(set.reps))) return "0";
  const reps = Number(set.reps ?? 0);
  const weight = Number(set.weight ?? 0);

  if (set.set_type === "time") return `${reps}s`;
  if (weight > 0) return `${reps} @ ${weight}kg`;
  return `${reps} reps`;
}
