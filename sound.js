const SOUND_KEY = 'letters-sound-enabled';

const base = import.meta.env.BASE_URL;
const positiveFiles = [`${base}sounds/positive_0.wav`, `${base}sounds/positive_1.wav`];
const negativeFiles = [
  `${base}sounds/negative_0.wav`,
  `${base}sounds/negative_1.wav`,
  `${base}sounds/negative_2.wav`,
];

const LETTER_FILENAMES = {
  A: 'a', B: 'b', C: 'c', D: 'd', E: 'e', F: 'f', G: 'g', H: 'h', I: 'i',
  J: 'j', K: 'k', L: 'l', M: 'm', N: 'n', O: 'o', P: 'p', Q: 'q', R: 'r',
  S: 's', T: 't', U: 'u', V: 'v', W: 'w', X: 'x', Y: 'y', Z: 'z',
  'Æ': 'ae', 'Ø': 'oe', 'Å': 'aa',
};

let positiveAudios = [];
let negativeAudios = [];
let letterAudios = {};
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
  for (const [letter, file] of Object.entries(LETTER_FILENAMES)) {
    const a = new Audio(`${base}sounds/letters/${file}.wav`);
    a.preload = 'auto';
    letterAudios[letter] = a;
  }
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

export function playLetter(letter) {
  if (!soundEnabled) return;
  const audio = letterAudios[letter];
  if (!audio) return;
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
