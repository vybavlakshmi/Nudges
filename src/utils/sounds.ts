import type { SoundName } from '../types';

// Generates gentle notification sounds using the Web Audio API
export function playSound(name: SoundName): void {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);

    switch (name) {
      case 'gentle':
        playTone(ctx, gain, 440, 'sine', 0, 0.6);
        playTone(ctx, gain, 523, 'sine', 0.15, 0.6);
        playTone(ctx, gain, 659, 'sine', 0.3, 0.8);
        break;
      case 'chime':
        playTone(ctx, gain, 523, 'sine', 0, 0.4);
        playTone(ctx, gain, 659, 'sine', 0.1, 0.4);
        playTone(ctx, gain, 784, 'sine', 0.2, 0.6);
        playTone(ctx, gain, 1047, 'sine', 0.35, 0.8);
        break;
      case 'bell':
        playTone(ctx, gain, 880, 'sine', 0, 1.2);
        playTone(ctx, gain, 1760, 'triangle', 0, 0.6, 0.1);
        break;
      case 'soft_ping':
        playTone(ctx, gain, 698, 'sine', 0, 0.5);
        playTone(ctx, gain, 932, 'sine', 0.05, 0.4);
        break;
      default:
        playTone(ctx, gain, 440, 'sine', 0, 0.5);
    }

    // Close context after sounds finish
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Audio not available in service worker context — no-op
  }
}

function playTone(
  ctx: AudioContext,
  gain: GainNode,
  freq: number,
  type: OscillatorType,
  delay: number,
  duration: number,
  volume = 0.3,
): void {
  const osc = ctx.createOscillator();
  const noteGain = ctx.createGain();
  osc.connect(noteGain);
  noteGain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.value = freq;

  const start = ctx.currentTime + delay;
  noteGain.gain.setValueAtTime(0, start);
  noteGain.gain.linearRampToValueAtTime(volume, start + 0.01);
  noteGain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.start(start);
  osc.stop(start + duration);
}
