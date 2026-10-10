var Exercises = window.Exercises || {};

// Plain-text unit fractions for questions and hints (the question itself shows them stacked).
const UNIT_FRACTION_TEXT = { 2: '½', 3: '⅓', 4: '¼', 5: '⅕', 10: '⅒' };

function unitFractionText(noemer) {
  return UNIT_FRACTION_TEXT[noemer] || `1/${noemer}`;
}

// Equivalent answers count: with 2 of 4 parts coloured, 1/2 is right too.
function sameFraction(teller, noemer, correctTeller, correctNoemer) {
  return noemer > 0 && teller * correctNoemer === correctTeller * noemer;
}

Exercises.breuk_herkennen = function (tierConfig, skill) {
  const noemer = pickRandom(tierConfig.denominators);
  const teller = randomInt(1, noemer - 1);
  return {
    skillId: skill.id,
    exerciseType: 'breuk_herkennen',
    prompt: 'Welk deel van de strook is gekleurd?',
    visual: { type: 'strook', parts: noemer, coloured: teller },
    answerLayout: 'fraction',
    answerFields: [{ key: 'teller', label: null }, { key: 'noemer', label: null }],
    correctAnswer: { teller, noemer },
    checkAnswer: (values) => sameFraction(values.teller, values.noemer, teller, noemer),
    hintContext: { teller, noemer }
  };
};

// Plain text for any fraction: ¾ where a single character exists, else 3/10.
const FRACTION_TEXT = { '2/3': '⅔', '3/4': '¾', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞' };

function fractionText(teller, noemer) {
  if (teller === 1) return unitFractionText(noemer);
  return FRACTION_TEXT[`${teller}/${noemer}`] || `${teller}/${noemer}`;
}

// "¼ van 20", and on the "nonUnit" level "¾ van 20": first one part, then that many parts.
// The strook (the fraction's parts, the asked ones coloured) appears as the first hint.
Exercises.breuk_deel_van = function (tierConfig, skill) {
  const noemer = pickRandom(tierConfig.denominators);
  // Only fractions in their simplest form (¾, not 2/4 or 5/10): gelijkwaardige breuken come later.
  const simplest = (t) => [2, 3, 5, 7].every((p) => t % p !== 0 || noemer % p !== 0);
  let teller = 1;
  if (tierConfig.nonUnit) {
    do { teller = randomInt(2, noemer - 1); } while (!simplest(teller));
  }
  const onePart = randomInt(2, tierConfig.quotientMax);
  const amount = noemer * onePart; // always divides evenly, so the answer is a whole number
  return {
    skillId: skill.id,
    exerciseType: 'breuk_deel_van',
    prompt: `${fractionText(teller, noemer)} van ${formatNumberNL(amount)} = ?`,
    promptParts: [{ fraction: [teller, noemer] }, ` van ${formatNumberNL(amount)} = ?`],
    hintVisual: { type: 'strook', parts: noemer, coloured: teller },
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: onePart * teller },
    hintContext: { noemer, amount, teller }
  };
};

window.Exercises = Exercises;
