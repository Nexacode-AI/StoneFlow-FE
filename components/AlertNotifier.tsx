'use client';

import { useEffect, useRef } from 'react';

function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Pleasant 3-note ascending chime: C5 → E5 → G5
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.6);
    });
    setTimeout(() => ctx.close(), 2200);
  } catch {
    // AudioContext not supported — silently fail
  }
}

export default function AlertNotifier() {
  const prevCount = useRef<number | null>(null);
  const hasInteracted = useRef(false);

  // Mark user has interacted (needed for AudioContext on some browsers)
  useEffect(() => {
    const mark = () => { hasInteracted.current = true; };
    window.addEventListener('click', mark, { once: true });
    window.addEventListener('keydown', mark, { once: true });
    return () => {
      window.removeEventListener('click', mark);
      window.removeEventListener('keydown', mark);
    };
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`);
        const json = await res.json();
        const count: number = json?.data?.stats?.alertCount ?? 0;

        if (prevCount.current !== null && count > prevCount.current && hasInteracted.current) {
          playChime();
        }
        prevCount.current = count;
      } catch { /* backend down — ignore */ }
    };

    poll(); // initial poll (silent, just sets baseline)
    const t = setInterval(poll, 30000);
    return () => clearInterval(t);
  }, []);

  return null;
}
