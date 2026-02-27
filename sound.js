const SOUND_KEY = 'letters-sound-enabled';

const base = import.meta.env.BASE_URL;
const positiveFiles = [`${base}sounds/positive_0.wav`, `${base}sounds/positive_1.wav`];
const negativeFiles = [
  `${base}sounds/negative_0.wav`,
  `${base}sounds/negative_1.wav`,
  `${base}sounds/negative_2.wav`,
];

let positiveAudios = [];
let negativeAudios = [];
let soundEnabled = localStorage.getItem(SOUND_KEY) !== 'false';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function initSound() {
  positiveAudios = positiveFiles.map((src) => {
    const a = new Audio(src);
    a.preload = 'auto';
    return a;
  });
  negativeAudios = negativeFiles.map((src) => {
    const a = new Audio(src);
    a.preload = 'auto';
    return a;
  });
}

export function playPositive() {
  if (!soundEnabled || positiveAudios.length === 0) return;
  const audio = pick(positiveAudios);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function playNegative() {
  if (!soundEnabled || negativeAudios.length === 0) return;
  const audio = pick(negativeAudios);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_KEY, soundEnabled);
  return soundEnabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}
