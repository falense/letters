import { ALPHABET } from './letters.js';
import { setupCanvas } from './canvas.js';
import { loadModel, recognizeLetter } from './recognition.js';
import { initSound, playPositive, playNegative, playLetter, toggleSound, isSoundEnabled } from './sound.js';

let currentIndex = 0;
let canvas = null;
let recognizeTimer = null;
let checking = false;

const targetLetterEl = document.getElementById('target-letter');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const clearBtn = document.getElementById('clear-btn');
const feedbackEl = document.getElementById('feedback');
const soundBtn = document.getElementById('sound-btn');
const loadingScreen = document.getElementById('loading-screen');
const mainScreen = document.getElementById('main-screen');
const canvasEl = document.getElementById('draw-canvas');

function updateLetter() {
  targetLetterEl.textContent = ALPHABET[currentIndex];
  canvas.clear();
  hideFeedback();
  cancelPendingRecognition();
  playLetter(ALPHABET[currentIndex]);
}

function prevLetter() {
  currentIndex = (currentIndex - 1 + ALPHABET.length) % ALPHABET.length;
  updateLetter();
}

function nextLetter() {
  currentIndex = (currentIndex + 1) % ALPHABET.length;
  updateLetter();
}

function cancelPendingRecognition() {
  if (recognizeTimer) {
    clearTimeout(recognizeTimer);
    recognizeTimer = null;
  }
}

function scheduleRecognition() {
  cancelPendingRecognition();
  if (checking) return;
  recognizeTimer = setTimeout(checkDrawing, 1500);
}

function showFeedback(success) {
  feedbackEl.classList.remove('hidden');

  if (success) {
    feedbackEl.innerHTML = '<div class="feedback-content">⭐</div>';
    spawnParticles();
    playPositive();

    setTimeout(() => {
      hideFeedback();
      nextLetter();
    }, 3000);
  } else {
    feedbackEl.innerHTML = '<div class="feedback-content">💪</div>';
    playNegative();

    setTimeout(() => {
      hideFeedback();
    }, 1200);
  }
}

function hideFeedback() {
  feedbackEl.classList.add('hidden');
  feedbackEl.innerHTML = '';
}

function spawnParticles() {
  const emojis = ['⭐', '🌟', '✨', '🎉', '💫'];
  const count = 8;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    const angle = (Math.PI * 2 * i) / count;
    const distance = 100 + Math.random() * 80;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    particle.style.left = '50%';
    particle.style.top = '50%';
    particle.style.setProperty('--dx', dx + 'px');
    particle.style.setProperty('--dy', dy + 'px');

    document.body.appendChild(particle);

    setTimeout(() => particle.remove(), 1000);
  }
}

async function checkDrawing() {
  const imageData = canvas.getImageData();
  if (!imageData || checking) return;

  checking = true;
  const target = ALPHABET[currentIndex];
  const result = await recognizeLetter(imageData, target);

  showFeedback(result.match);
  checking = false;
}

async function init() {
  // Load TensorFlow model and sound
  await loadModel();
  initSound();

  // Wire up buttons
  prevBtn.addEventListener('click', prevLetter);
  nextBtn.addEventListener('click', nextLetter);
  clearBtn.addEventListener('click', () => {
    canvas.clear();
    hideFeedback();
    cancelPendingRecognition();
  });

  targetLetterEl.addEventListener('click', () => playLetter(ALPHABET[currentIndex]));

  soundBtn.textContent = isSoundEnabled() ? '\u{1F50A}' : '\u{1F507}';
  soundBtn.addEventListener('click', () => {
    const enabled = toggleSound();
    soundBtn.textContent = enabled ? '\u{1F50A}' : '\u{1F507}';
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prevLetter();
    if (e.key === 'ArrowRight') nextLetter();
    if (e.key === 'Escape') {
      canvas.clear();
      hideFeedback();
      cancelPendingRecognition();
    }
  });

  // Show main screen first so layout dimensions are available
  loadingScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');

  // Setup canvas after screen is visible so it can measure properly
  canvas = setupCanvas(canvasEl, {
    onStrokeEnd: scheduleRecognition,
  });

  // Initial letter
  updateLetter();
}

init().catch((err) => {
  console.error('Failed to initialize:', err);
  loadingScreen.querySelector('p').textContent = 'Noe gikk galt. Prøv å laste siden på nytt.';
});
