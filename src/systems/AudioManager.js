/**
 * Tiny Web Audio sound interface. Effects are intentionally generated at
 * runtime so the game does not need external audio files.
 */
export default class AudioManager {
  constructor() {
    this.context = null;
  }

  ensureContext() {
    if (!this.context) {
      if (typeof window === 'undefined') return null;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      this.context = new AudioContextClass();
    }

    if (this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }

    return this.context;
  }

  playTone(frequency, duration, type = 'sine', volume = 0.035, endFrequency = frequency) {
    const context = this.ensureContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  reset() {
    this.playTone(420, 0.18, 'sawtooth', 0.025, 110);
  }

  plate() {
    this.playTone(620, 0.12, 'square', 0.022, 880);
  }

  complete() {
    this.playTone(520, 0.16, 'sine', 0.03, 780);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => this.playTone(780, 0.26, 'sine', 0.035, 1040), 100);
    }
  }
}
