import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

type ToneSegment = {
  freq: number;
  ms: number;
};

let tickSound: Audio.Sound | null = null;
let endSound: Audio.Sound | null = null;
let ensured = false;

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function buildWav(freq: number, ms: number, sampleRate = 22050): Uint8Array {
  const sampleCount = Math.max(1, Math.floor((sampleRate * ms) / 1000));
  const samples = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; i += 1) {
    const time = i / sampleRate;
    const wave = Math.sin(2 * Math.PI * freq * time);
    const envelope = 1 - i / sampleCount;
    samples[i] = wave * 0.45 * (0.25 + envelope * 0.75);
  }

  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const dataLength = samples.length * 2;

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(44 + i * 2, intSample, true);
  }

  return new Uint8Array(buffer);
}

function buildSequenceWav(
  segments: ToneSegment[],
  sampleRate = 22050,
): Uint8Array {
  const totalSamples = segments.reduce(
    (sum, seg) => sum + Math.max(1, Math.floor((sampleRate * seg.ms) / 1000)),
    0,
  );
  const result = new Float32Array(totalSamples);
  let offset = 0;

  for (const segment of segments) {
    const count = Math.max(1, Math.floor((sampleRate * segment.ms) / 1000));
    for (let i = 0; i < count; i += 1) {
      const time = i / sampleRate;
      const wave = Math.sin(2 * Math.PI * segment.freq * time);
      const envelope = 1 - i / count;
      result[offset + i] = wave * 0.5 * (0.3 + envelope * 0.7);
    }
    offset += count;
  }

  const buffer = new ArrayBuffer(44 + result.length * 2);
  const view = new DataView(buffer);
  const dataLength = result.length * 2;

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  for (let i = 0; i < result.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, result[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(44 + i * 2, intSample, true);
  }

  return new Uint8Array(buffer);
}

export function toBase64(bytes: Uint8Array): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = bytes[i + 1] ?? 0;
    const byte3 = bytes[i + 2] ?? 0;
    const combined = (byte1 << 16) | (byte2 << 8) | byte3;

    output += alphabet[(combined >> 18) & 63];
    output += alphabet[(combined >> 12) & 63];

    if (bytes[i + 1] === undefined) {
      output += "=";
    } else {
      output += alphabet[(combined >> 6) & 63];
    }

    if (bytes[i + 2] === undefined) {
      output += "=";
    } else {
      output += alphabet[combined & 63];
    }
  }

  return output;
}

export async function ensureSounds() {
  if (ensured) return;

  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

    const tickFile = new FileSystem.File(FileSystem.Paths.cache, "tick.wav");
    const endFile = new FileSystem.File(FileSystem.Paths.cache, "end.wav");

    if (!tickSound) {
      const tickBase64 = toBase64(buildWav(880, 120));
      tickFile.write(tickBase64, { encoding: "base64" });
      const tickRes = await Audio.Sound.createAsync({ uri: tickFile.uri });
      tickSound = tickRes.sound;
    }

    if (!endSound) {
      const endBase64 = toBase64(
        buildSequenceWav([
          { freq: 880, ms: 200 },
          { freq: 1320, ms: 300 },
        ]),
      );
      endFile.write(endBase64, { encoding: "base64" });
      const endRes = await Audio.Sound.createAsync({ uri: endFile.uri });
      endSound = endRes.sound;
    }

    ensured = true;
  } catch {
    ensured = true;
  }
}

export async function playTick() {
  try {
    await ensureSounds();
    if (!tickSound) return;
    await tickSound.setPositionAsync(0);
    await tickSound.playAsync();
  } catch {
    // silent fallback
  }
}

export async function playEnd() {
  try {
    await ensureSounds();
    if (!endSound) return;
    await endSound.setPositionAsync(0);
    await endSound.playAsync();
  } catch {
    // silent fallback
  }
}
