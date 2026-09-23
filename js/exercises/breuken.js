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

Exercises.breuk_deel_van = function (tierConfig, skill) {
  const noemer = pickRandom(tierConfig.denominators);
  const answer = randomInt(2, tierConfig.quotientMax);
  const amount = noemer * answer; // always divides evenly, so the answer is a whole number
  return {
    skillId: skill.id,
    exerciseType: 'breuk_deel_van',
    prompt: `${unitFractionText(noemer)} van ${formatNumberNL(amount)} = ?`,
    promptParts: [{ fraction: [1, noemer] }, ` van ${formatNumberNL(amount)} = ?`],
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: answer },
    hintContext: { noemer, amount }
  };
};

window.Exercises = Exercises;
