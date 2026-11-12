import { ChimeType } from './types';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = 'sine',
  peakGain = 0.22
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);

  const start = ctx.currentTime + startOffset;
  const end = start + duration;

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(end + 0.02);
}

export function normalizeChimeType(raw?: ChimeType | boolean): ChimeType {
  if (!raw || raw === 'none') return 'none';
  if (raw === true || raw === 'soft_chime') return 'soft_chime';
  if (raw === 'double_beep') return 'double_beep';
  if (raw === 'urgent_alarm') return 'urgent_alarm';
  return 'none';
}

export function playChime(raw?: ChimeType | boolean): void {
  const chime = normalizeChimeType(raw);
  if (chime === 'none') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (chime === 'soft_chime') {
      // Warm two-note ascending chime (C5 -> G5)
      playTone(ctx, 523.25, 0, 0.28, 'sine', 0.2);
      playTone(ctx, 783.99, 0.14, 0.45, 'triangle', 0.22);
    } else if (chime === 'double_beep') {
      // Crisp two-pip alert beep (A5 -> A5)
      playTone(ctx, 880, 0, 0.11, 'sine', 0.22);
      playTone(ctx, 880, 0.16, 0.14, 'sine', 0.22);
    } else if (chime === 'urgent_alarm') {
      // High-priority three-pulse alternating alarm
      playTone(ctx, 987.77, 0, 0.14, 'sawtooth', 0.16);
      playTone(ctx, 1318.51, 0.15, 0.14, 'sawtooth', 0.18);
      playTone(ctx, 987.77, 0.30, 0.14, 'sawtooth', 0.16);
      playTone(ctx, 1318.51, 0.45, 0.22, 'sawtooth', 0.2);
    }
  } catch {
    // Ignore audio errors if browser blocks autoplay before user interaction
  }
}

