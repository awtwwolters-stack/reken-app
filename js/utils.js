// Small shared helpers used by the exercise generators.

// Shown in the parent view so a stale cached copy is easy to spot. Bump on every publish, together
// with the ?v= on every script/style tag in index.html and parent.html (forces fresh files on reload).
const APP_VERSION = '2026-09-23.7';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function formatNumberNL(n) {
  return n.toLocaleString('nl-NL');
}

// Whole numbers as Dutch children write them: 45230, 45.230, 1.000.000 or 45 230.
// A dot is only a thousands separator when followed by exactly 3 digits, so 45.23 is
// rejected (NaN) rather than silently misread.
function parseDutchInteger(text) {
  const compact = text.trim().replace(/\s+/g, '');
  if (/^\d+$/.test(compact)) return Number(compact);
  if (/^\d{1,3}(\.\d{3})+$/.test(compact)) return Number(compact.replace(/\./g, ''));
  return NaN;
}
