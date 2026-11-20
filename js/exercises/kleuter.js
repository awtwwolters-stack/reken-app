var Exercises = window.Exercises || {};

// Groep 2 (kleuters, BACKLOG D26): getallen tot en met 20 herkennen. These children can't read or
// type yet: an exercise either brings `answerMode: 'choices'` with `choices` (big cards to tap) or
// `answerMode: 'speak'` (the child says the number, 🎤). Every exercise is read aloud by itself
// (`speech`), and numbers in what is said are written as words, so no voice reads "14" as "1 4".
// Uses dotsVisual() and singleAnswer() from exercises/aanvankelijk.js.

const NUMBER_WORDS = [
  'nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien',
  'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien', 'twintig'
];

function numberWord(n) {
  return NUMBER_WORDS[n] || String(n);
}

// Every number in what the iPad heard: digits ("14") or Dutch words ("veertien", "Eén"). A teen
// number heard as two words ("vijf tien") is put back together: 15.
function numbersInSpeech(text) {
  const numbers = String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // één -> een
    .split(/[^a-z0-9]+/)
    .map((word) => (/^\d+$/.test(word) ? Number(word) : NUMBER_WORDS.indexOf(word)))
    .filter((n) => n >= 0);
  const joined = [];
  numbers.forEach((n) => {
    const last = joined.length - 1;
    if (n === 10 && joined[last] >= 3 && joined[last] <= 9) joined[last] += 10;
    else joined.push(n);
  });
  return joined;
}

// The number the child said, from the iPad's alternatives (best guess first): the first number of
// the best guess that holds one. Only when the best guess holds no number at all may a lesser one
// count, and then only the expected number: a wrong answer must not turn right because the iPad's
// fifth guess happened to be the answer.
function heardNumber(alternatives, expected) {
  const found = alternatives.map(numbersInSpeech);
  if (found.length && found[0].length) return found[0][0];
  if (found.some((numbers) => numbers.includes(expected))) return expected;
  const first = found.find((numbers) => numbers.length > 0);
  return first ? first[0] : null;
}

function shuffled(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// `count` different cards from min..max, the answer among them: first the `preferred` numbers
// (the likely mix-ups, in random order), then any others.
function choiceCards(answer, count, preferred, min, max) {
  const cards = [answer];
  const add = (n) => {
    if (cards.length < count && Number.isInteger(n) && n >= min && n <= max && !cards.includes(n)) cards.push(n);
  };
  shuffled(preferred).forEach(add);
  for (let tries = 0; cards.length < count && tries < 200; tries++) add(randomInt(min, max));
  return shuffled(cards);
}

// The cards a kleuter mixes up with n: 4 and 14 ("veertien" says the 4 first), 6 and 9, neighbours.
const LOOK_ALIKES = { 6: 9, 9: 6, 16: 19, 19: 16 };

function mixUps(n, tricky) {
  const near = [n - 1, n + 1];
  if (!tricky) return near;
  return [n + 10, n - 10, LOOK_ALIKES[n], ...near].filter((m) => m !== undefined);
}

// Luister en tik: "Tik op veertien."
Exercises.getal_kiezen = function (tierConfig, skill) {
  const n = randomInt(tierConfig.min, tierConfig.max);
  const choices = choiceCards(n, tierConfig.choices, mixUps(n, tierConfig.tricky), tierConfig.min, tierConfig.max);
  return {
    skillId: skill.id,
    exerciseType: 'getal_kiezen',
    prompt: 'Welk getal hoor je?',
    logPrompt: `Luister: ${n} (kaartjes ${choices.join(', ')})`,
    speech: `Tik op ${numberWord(n)}.`,
    answerMode: 'choices',
    choices,
    hintVisual: dotsVisual({ count: n, kind: 'a' }),
    ...singleAnswer(n),
    hintContext: { n }
  };
};

// Tel en tik: dots in ten-frames (2 rows of 5, as on the rekenrek), tap the number.
Exercises.stippen_kiezen = function (tierConfig, skill) {
  const n = randomInt(tierConfig.min, tierConfig.max);
  const choices = choiceCards(n, tierConfig.choices, [n - 1, n + 1, n - 2, n + 2], Math.max(0, tierConfig.min - 2), Math.min(20, tierConfig.max + 2));
  return {
    skillId: skill.id,
    exerciseType: 'stippen_kiezen',
    prompt: 'Hoeveel stippen?',
    logPrompt: `Hoeveel stippen? (${stippen(n)}, kaartjes ${choices.join(', ')})`,
    speech: 'Hoeveel stippen zie je? Tik op het goede getal.',
    answerMode: 'choices',
    choices,
    visual: dotsVisual({ count: n, kind: 'a' }),
    ...singleAnswer(n),
    hintContext: { n }
  };
};

// Welk getal mist? Five numbers in a row, one is a gap: at the end first, later anywhere but the
// first place. Rows to 20 start from 6, so most of them go through the teens.
const ROW_LENGTH = 5;

Exercises.rij_gat = function (tierConfig, skill) {
  const first = tierConfig.max > 10 ? randomInt(6, tierConfig.max - ROW_LENGTH + 1) : randomInt(1, tierConfig.max - ROW_LENGTH + 1);
  const row = Array.from({ length: ROW_LENGTH }, (_, i) => first + i);
  const gapIndex = tierConfig.gap === 'end' ? ROW_LENGTH - 1 : randomInt(1, ROW_LENGTH - 1);
  const answer = row[gapIndex];
  const shown = row.map((n, i) => (i === gapIndex ? '?' : String(n)));
  const choices = choiceCards(answer, tierConfig.choices, [answer - 1, answer + 1, answer + 2, answer - 2], 0, tierConfig.max);
  return {
    skillId: skill.id,
    exerciseType: 'rij_gat',
    prompt: shown.join(', '),
    logPrompt: `${shown.join(', ')} (kaartjes ${choices.join(', ')})`,
    speech: `Welk getal mist er? ${row.map((n, i) => (i === gapIndex ? '…' : numberWord(n))).join(', ')}.`,
    answerMode: 'choices',
    choices,
    ...singleAnswer(answer),
    hintContext: { row, gapIndex, answer }
  };
};

// Zeg het getal: a big number; the child says it (🎤). When this iPad can't listen, the child
// checks it herself (the app says the number, she taps 😊 or 🤔): see js/app.js.
Exercises.getal_zeggen = function (tierConfig, skill) {
  const n = randomInt(tierConfig.min, tierConfig.max);
  return {
    skillId: skill.id,
    exerciseType: 'getal_zeggen',
    prompt: String(n),
    promptClass: 'prompt-number',
    logPrompt: `Zeg: ${n}`,
    speech: 'Welk getal is dit? Tik op de microfoon en zeg het.',
    answerMode: 'speak',
    hintVisual: dotsVisual({ count: n, kind: 'a' }),
    ...singleAnswer(n),
    hintContext: { n }
  };
};

window.Exercises = Exercises;
