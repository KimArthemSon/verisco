import { daysBetween, todayISO } from '@core/utils/dates';
import type { Journey } from '@modules/journeys/repository';
import type { CertificateStats } from '@modules/reports/analytics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/** Deterministic unique certificate ID per journey */
export function certId(journey: Journey): string {
  const seed = `${journey.id}-${journey.created_at}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const chunk = Math.abs(h).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  return `VIR-${journey.start_date.slice(0, 4)}-${String(journey.id).padStart(4, '0')}-${chunk}`;
}

async function toBase64(uri: string | null): Promise<string | null> {
  if (!uri) return null;
  try {
    const b64 = await FileSystem.readAsBase64Async(uri);
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    return null;
  }
}

const fmt = (iso: string | null) => (iso ? iso.slice(0, 10) : '—');

export function buildCertificateHtml(
  journey: Journey,
  stats: CertificateStats,
  before: string | null,
  after: string | null,
): string {
  const completed = journey.status === 'completed';
  const dayX = Math.max(1, daysBetween(journey.start_date, todayISO()) + 1);
  const max = Math.max(...stats.weekly.map((w) => w.value), 1);

  const bars =
    stats.weekly.length > 0
      ? stats.weekly
          .map(
            (w) =>
              `<div class="barCol"><div class="bar" style="height:${Math.max(
                8,
                Math.round((w.value / max) * 100),
              )}%"></div><span>${w.label}</span></div>`,
          )
          .join('')
      : '<span class="muted">no sessions yet</span>';

  const prRows =
    stats.prs.length > 0
      ? stats.prs.map((p) => `<li><b>${p.exercise_name}</b> — ${p.weight} kg × ${p.reps}</li>`).join('')
      : '<li class="muted">no records yet</li>';

  const photos = `
    <div class="photos">
      <div class="photoBox">
        ${before ? `<img src="${before}" />` : '<div class="noPhoto">no photo</div>'}
        <span>BEFORE</span>
      </div>
      <div class="photoBox">
        ${after ? `<img src="${after}" />` : '<div class="noPhoto">after pending</div>'}
        <span>AFTER</span>
      </div>
    </div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; }
    body { background: #F5F5F0; padding: 24px; }
    .card { background: #FFFFFF; border-radius: 20px; overflow: hidden; max-width: 640px; margin: 0 auto; }
    .head { background: #1A3C2A; color: #FFFFFF; padding: 28px 28px 22px; }
    .brand { font-size: 12px; letter-spacing: 3px; opacity: .8; }
    .title { font-size: 22px; font-weight: 800; letter-spacing: 1px; margin-top: 4px; }
    .certId { font-size: 11px; opacity: .7; margin-top: 6px; font-family: monospace; }
    .body { padding: 26px 28px; }
    .jName { font-size: 24px; font-weight: 800; color: #1A1A1A; text-align: center; }
    .quote { font-size: 13px; font-style: italic; color: #8A8A8A; text-align: center; margin-top: 4px; }
    .dates { font-size: 12px; color: #8A8A8A; text-align: center; margin-top: 8px; }
    .stamp { display: block; width: fit-content; margin: 12px auto 0; padding: 5px 14px; border-radius: 20px;
             font-size: 11px; font-weight: 800; letter-spacing: 1px;
             background: ${completed ? '#2D5F3F22' : '#8A8A8A22'}; color: ${completed ? '#2D5F3F' : '#8A8A8A'}; }
    .photos { display: flex; gap: 14px; margin: 20px 0; }
    .photoBox { flex: 1; text-align: center; }
    .photoBox img, .noPhoto { width: 100%; height: 190px; object-fit: cover; border-radius: 14px; }
    .noPhoto { background: #F5F5F0; display: flex; align-items: center; justify-content: center; color: #8A8A8A; font-size: 12px; }
    .photoBox span { font-size: 10px; font-weight: 800; letter-spacing: 2px; color: #2D5F3F; }
    .sec { font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #2D5F3F; margin: 18px 0 8px; }
    .chart { display: flex; align-items: flex-end; gap: 8px; height: 110px; padding: 8px 4px 0; }
    .barCol { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
    .bar { width: 100%; background: #2D5F3F; border-radius: 4px 4px 0 0; }
    .barCol span { font-size: 8px; color: #8A8A8A; }
    .stats { display: flex; flex-wrap: wrap; gap: 10px; }
    .stat { flex: 1 1 45%; background: #F5F5F0; border-radius: 12px; padding: 12px 14px; }
    .stat b { display: block; font-size: 17px; color: #1A1A1A; }
    .stat span { font-size: 10px; color: #8A8A8A; letter-spacing: 1px; }
    ul { list-style: none; }
    li { font-size: 13px; color: #1A1A1A; padding: 4px 0; }
    .muted { color: #8A8A8A; font-size: 12px; }
    .workouts { font-size: 13px; color: #1A1A1A; line-height: 1.6; }
    .foot { border-top: 1px solid #E8E8E3; padding: 16px 28px; display: flex; justify-content: space-between; align-items: center; }
    .foot span { font-size: 10px; color: #8A8A8A; }
  </style></head><body>
  <div class="card">
    <div class="head">
      <div class="brand">🌿 VIRESCO</div>
      <div class="title">TRANSFORMATION CERTIFICATE</div>
      <div class="certId">ID: ${certId(journey)}</div>
    </div>
    <div class="body">
      <div class="jName">${journey.name}</div>
      ${journey.purpose_quote ? `<div class="quote">“${journey.purpose_quote}”</div>` : ''}
      <div class="dates">${fmt(journey.start_date)} → ${fmt(journey.end_date)}</div>
      <span class="stamp">${completed ? 'COMPLETED ✅' : `IN PROGRESS • DAY ${dayX}`}</span>
      ${photos}
      <div class="sec">PROGRESS — WEEKLY VOLUME</div>
      <div class="chart">${bars}</div>
      <div class="sec">STATS</div>
      <div class="stats">
        <div class="stat"><b>${stats.sessionsCount}</b><span>SESSIONS</span></div>
        <div class="stat"><b>${stats.consistency !== null ? stats.consistency + '%' : '—'}</b><span>CONSISTENCY</span></div>
        <div class="stat"><b>${stats.volume.toLocaleString()} kg</b><span>TOTAL VOLUME</span></div>
        <div class="stat"><b>${stats.setsDone}</b><span>SETS DONE</span></div>
      </div>
      <div class="sec">PERSONAL RECORDS</div>
      <ul>${prRows}</ul>
      <div class="sec">WORKOUTS</div>
      <div class="workouts">${stats.workouts.length ? stats.workouts.join(' • ') : '—'}</div>
    </div>
    <div class="foot">
      <span>Verified by Viresco 🌿</span>
      <span>Generated ${todayISO()}</span>
    </div>
  </div>
  </body></html>`;
}

export async function exportCertificate(journey: Journey, stats: CertificateStats): Promise<void> {
  const before = await toBase64(journey.before_photo_uri);
  const after = await toBase64(journey.after_photo_uri);
  const html = buildCertificateHtml(journey, stats, before, after);
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `${journey.name} — Viresco Certificate`,
  });
}