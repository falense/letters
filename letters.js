export const ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z', 'Æ', 'Ø', 'Å',
];

// EMNIST by_class label mapping: indices 10-35 map to A-Z
// We map our alphabet to EMNIST class indices
const EMNIST_LETTER_OFFSET = 10; // A=10, B=11, ..., Z=35

export function getEmnistIndex(letter) {
  const upper = letter.toUpperCase();
  const pos = upper.charCodeAt(0) - 65; // A=0, B=1, ..., Z=25
  if (pos >= 0 && pos <= 25) {
    return EMNIST_LETTER_OFFSET + pos;
  }
  // Æ, Ø, Å don't exist in EMNIST - return null
  return null;
}

// For Norwegian-specific letters, we use heuristic matching
// Æ looks like A+E combo, Ø looks like O with slash, Å looks like A with ring
export function getNorwegianLetterHeuristic(letter) {
  switch (letter) {
    case 'Æ': return ['A', 'E']; // Accept A or E as close enough
    case 'Ø': return ['O', 'Q', 'D']; // O with slash looks like O, Q, or D
    case 'Å': return ['A']; // Å looks very similar to A
    default: return [letter];
  }
}
