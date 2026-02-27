import * as tf from '@tensorflow/tfjs';
import { getEmnistIndex, getNorwegianLetterHeuristic } from './letters.js';

let model = null;

// EMNIST Letters model: 26 classes (A-Z)
const NUM_CLASSES = 26;
const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export async function loadModel() {
  try {
    model = await tf.loadLayersModel('./model/model.json');
    console.log('Loaded EMNIST model');
  } catch (err) {
    console.error('Failed to load model:', err);
  }
}

// Crop canvas to bounding box of the drawing, center in a square, resize to 28x28
function preprocessCanvas(imageData) {
  return tf.tidy(() => {
    // Get grayscale channel
    const tensor = tf.browser.fromPixels(imageData, 1);
    const data = tensor.dataSync();
    const w = imageData.width;
    const h = imageData.height;

    // Find bounding box of dark pixels
    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[y * w + x] < 200) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (maxX <= minX || maxY <= minY) return null;

    // Add padding (~20% of bounding box size)
    const bw = maxX - minX;
    const bh = maxY - minY;
    const pad = Math.max(bw, bh) * 0.2;
    minX = Math.max(0, Math.floor(minX - pad));
    minY = Math.max(0, Math.floor(minY - pad));
    maxX = Math.min(w - 1, Math.ceil(maxX + pad));
    maxY = Math.min(h - 1, Math.ceil(maxY + pad));

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    // Make square by centering
    const size = Math.max(cropW, cropH);
    const offsetX = Math.floor((size - cropW) / 2);
    const offsetY = Math.floor((size - cropH) / 2);

    // Create white square, paste cropped content centered
    const squareData = new Float32Array(size * size).fill(255);
    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const srcIdx = (minY + y) * w + (minX + x);
        const dstIdx = (offsetY + y) * size + (offsetX + x);
        squareData[dstIdx] = data[srcIdx];
      }
    }

    // Resize to 28x28
    let img = tf.tensor2d(squareData, [size, size]);
    let resized = img.expandDims(-1).expandDims(0);
    resized = tf.image.resizeBilinear(resized, [28, 28]);

    // Invert: EMNIST uses white-on-black, canvas is black-on-white
    resized = tf.scalar(255).sub(resized).div(255);

    // The model was trained on transposed-then-uprighted images,
    // so we do NOT transpose here — just feed the image as-is.

    return resized;
  });
}

export async function recognizeLetter(imageData, targetLetter) {
  if (!imageData || !model) {
    return { match: false, confidence: 0 };
  }

  const tensor = preprocessCanvas(imageData);
  if (!tensor) return { match: false, confidence: 0 };

  const prediction = model.predict(tensor);
  const probs = await prediction.data();
  tensor.dispose();
  prediction.dispose();

  // Get sorted predictions
  const indexed = Array.from(probs).map((p, i) => ({ prob: p, index: i, label: LABELS[i] }));
  indexed.sort((a, b) => b.prob - a.prob);

  console.log('Top 5:', indexed.slice(0, 5).map(p => `${p.label}:${p.prob.toFixed(3)}`).join(' '));

  // Check if target letter is in top predictions
  const emnistIdx = getEmnistIndex(targetLetter);
  const acceptable = getNorwegianLetterHeuristic(targetLetter);

  // For A-Z letters, check EMNIST index directly (offset by 10 in letters.js, but our model is 0-25)
  const letterIdx = targetLetter.charCodeAt(0) - 65; // A=0, B=1, ..., Z=25

  if (letterIdx >= 0 && letterIdx < NUM_CLASSES) {
    // Check if target is in top 3 predictions
    const top3Labels = indexed.slice(0, 3).map(p => p.label);
    if (top3Labels.includes(targetLetter)) {
      return { match: true, confidence: probs[letterIdx] };
    }
  }

  // For Norwegian letters (Æ, Ø, Å), check if any acceptable alternative is in top 3
  for (const alt of acceptable) {
    const altIdx = alt.charCodeAt(0) - 65;
    if (altIdx >= 0 && altIdx < NUM_CLASSES) {
      const top3Labels = indexed.slice(0, 3).map(p => p.label);
      if (top3Labels.includes(alt)) {
        return { match: true, confidence: probs[altIdx] };
      }
    }
  }

  return {
    match: false,
    confidence: 0,
    predicted: indexed[0].label,
  };
}
