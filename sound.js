const SOUND_KEY = 'letters-sound-enabled';

const positiveFiles = ['sounds/positive_0.wav', 'sounds/positive_1.wav'];
const negativeFiles = [
  'sounds/negative_0.wav',
  'sounds/negative_1.wav',
  'sounds/negative_2.wav',
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
