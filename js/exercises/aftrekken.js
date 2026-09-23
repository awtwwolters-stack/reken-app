var Exercises = window.Exercises || {};

// Deliberately practise the special strategies the class uses (aanvullen for numbers close
// together, rijgen met te veel for 299-like numbers); random numbers rarely produce them.
// SPECIAL_STRATEGY_SHARE and justUnderHundredIn come from optellen.js.
function specialSubtraction(min, max) {
  if (Math.random() < 0.5) {
    // Aanvullen: 405 - 397 (difference at most ~10% of the number, see isAanvullenCase in hints.js)
    const difference = randomInt(3, 19);
    const lowestB = Math.max(min, 10 * difference);
    if (lowestB > max - difference) return null;
    const b = randomInt(lowestB, max - difference);
    return { a: b + difference, b };
  }
  // Rijgen met te veel: 684 - 299
  const b = justUnderHundredIn(min, max);
  if (!b) return null;
  const round = Math.ceil(b / 100) * 100;
  if (round > max) return null;
  return { a: randomInt(round, max), b };
}

Exercises.aftrekken = function (tierConfig, skill) {
  const special = Math.random() < SPECIAL_STRATEGY_SHARE ? specialSubtraction(tierConfig.min, tierConfig.max) : null;
  let a, b;
  if (special) {
    ({ a, b } = special);
  } else {
    a = randomInt(tierConfig.min, tierConfig.max);
    b = randomInt(tierConfig.min, a); // b <= a, so the answer is never negative
  }
  return {
    skillId: skill.id,
    exerciseType: 'aftrekken',
    prompt: `${formatNumberNL(a)} - ${formatNumberNL(b)} = ?`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: a - b },
    hintContext: { a, b, operator: '-' }
  };
};

window.Exercises = Exercises;
