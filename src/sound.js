// Short retro sounds made with WebAudio. Silent unless the player turns sound on.
let audio = null;
let enabled = false;

export function setSoundEnabled(on) {
  enabled = on;
}

function tone(freq, duration, { type = 'square', volume = 0.04, slideTo = null, delay = 0 } = {}) {
  if (!enabled) return;
  audio ??= new AudioContext();
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration);
}

export const sfx = {
  tap: () => tone(660, 0.05),
  coin: () => { tone(988, 0.06); tone(1319, 0.12, { delay: 0.06 }); },
  eat: () => { tone(330, 0.06); tone(392, 0.06, { delay: 0.1 }); tone(330, 0.06, { delay: 0.2 }); },
  purr: () => tone(90, 0.5, { type: 'triangle', volume: 0.08, slideTo: 70 }),
  meow: () => tone(880, 0.35, { type: 'triangle', volume: 0.06, slideTo: 520 }),
  no: () => tone(200, 0.15, { slideTo: 150 }),
  clean: () => tone(1200, 0.2, { type: 'triangle', slideTo: 2000 }),
  catch: () => tone(1046, 0.06, { volume: 0.03 }),
  fanfare: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.15, { delay: i * 0.12 })),
};
