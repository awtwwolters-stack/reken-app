// Small shared helpers used by the exercise generators.

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function formatNumberNL(n) {
  return n.toLocaleString('nl-NL');
}
