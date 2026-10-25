'use client';

let audioCtx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let sirenInterval: NodeJS.Timeout | null = null;

export function playSiren() {
  if (typeof window === 'undefined') return;
  
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  // If already playing, don't restart
  if (oscillator) return;

  oscillator = audioCtx.createOscillator();
  gainNode = audioCtx.createGain();

  oscillator.type = 'square';
  
  // Set extreme volume
  gainNode.gain.value = 1.0; 

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.start();

  // Create the rising/falling police siren effect
  let isHigh = true;
  sirenInterval = setInterval(() => {
    if (!oscillator) return;
    // Rapidly switch between 800Hz and 1200Hz for a piercing European police siren effect
    oscillator.frequency.setTargetAtTime(isHigh ? 1200 : 800, audioCtx!.currentTime, 0.1);
    isHigh = !isHigh;
  }, 400); // toggle every 400ms
}

export function stopSiren() {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  
  if (oscillator) {
    try {
      // Fade out to avoid audio click
      if (gainNode && audioCtx) {
        gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        setTimeout(() => {
          if (oscillator) {
            oscillator.stop();
            oscillator.disconnect();
            oscillator = null;
          }
        }, 150);
      } else {
        oscillator.stop();
        oscillator.disconnect();
        oscillator = null;
      }
    } catch (e) {
      console.error(e);
      oscillator = null;
    }
  }
}
