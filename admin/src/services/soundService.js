/**
 * Cafe Sound Notification Service
 * Uses Web Audio API to generate high-fidelity, crystal-clear restaurant order chimes
 * without external asset dependencies or network delay.
 */

let audioCtx = null;
let soundEnabled = true;

// Initialize or resume AudioContext safely
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Auto-unlock audio on first user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    } else {
      getAudioContext();
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
}

/**
 * Play a double-ding melodic restaurant service chime
 * Pitch: High-fidelity harmonic bells (E5 659.3Hz -> A5 880Hz -> C#6 1108Hz)
 */
export function playNewOrderChime() {
  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Helper to play a harmonic bell note
    const playBellNote = (freq, startTime, duration = 0.8, volume = 0.35) => {
      // Fundamental oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Second harmonic overtone for metallic brass bell warmth
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2.76, startTime); // Natural bell overtone ratio

      // Exponential decay envelope
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      gain2.gain.setValueAtTime(0.001, startTime);
      gain2.gain.exponentialRampToValueAtTime(volume * 0.3, startTime + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.6);

      osc.connect(gain);
      osc2.connect(gain2);
      gain.connect(ctx.destination);
      gain2.connect(ctx.destination);

      osc.start(startTime);
      osc2.start(startTime);
      osc.stop(startTime + duration + 0.05);
      osc2.stop(startTime + duration + 0.05);
    };

    // Sequence: Ding - Dong - DING!
    // Note 1: E5 (659.25Hz)
    playBellNote(659.25, now, 0.45, 0.4);
    // Note 2: G#5 (830.61Hz)
    playBellNote(830.61, now + 0.18, 0.5, 0.45);
    // Note 3: B5 (987.77Hz) - bright resolution
    playBellNote(987.77, now + 0.36, 0.9, 0.55);

    // Subtle second echo after 0.7s to ensure attention in noisy cafe/kitchen
    setTimeout(() => {
      if (!ctx || ctx.state === 'closed') return;
      const echoNow = ctx.currentTime;
      playBellNote(830.61, echoNow, 0.4, 0.25);
      playBellNote(987.77, echoNow + 0.16, 0.8, 0.35);
    }, 700);

  } catch (err) {
    console.warn('[SoundService] Audio playback skipped:', err.message);
  }
}

/**
 * Play a shorter confirmation ding for status updates
 */
export function playStatusChime() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {}
}

export function setSoundEnabled(enabled) {
  soundEnabled = Boolean(enabled);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('dinenos_order_sound', String(soundEnabled));
  }
}

export function isSoundEnabled() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('dinenos_order_sound');
    if (saved !== null) return saved === 'true';
  }
  return soundEnabled;
}
