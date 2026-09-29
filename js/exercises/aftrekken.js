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

// Groep-6 hoofdrekenen with handy numbers (see handigPlus in optellen.js): 560 - 240,
// 4.500 - 1.200, 673 - 298.
function handigMin() {
  const kind = pickRandom(['tientallen', 'honderdtallen', 'bijnaHonderd']);
  if (kind === 'tientallen') {
    const a = randomInt(30, 99) * 10;
    return [a, randomInt(2, a / 10 - 1) * 10];
  }
  if (kind === 'honderdtallen') {
    const a = randomInt(30, 99) * 100;
    return [a, randomInt(2, a / 100 - 1) * 100];
  }
  const b = randomInt(1, 8) * 100 - randomInt(1, 3);
  return [randomInt(Math.ceil(b / 100) * 100 + 10, 999), b];
}

Exercises.aftrekken = function (tierConfig, skill) {
  const special = !tierConfig.handig && Math.random() < SPECIAL_STRATEGY_SHARE
    ? specialSubtraction(tierConfig.min, tierConfig.max)
    : null;
  let a, b;
  if (tierConfig.handig) {
    [a, b] = handigMin();
  } else if (special) {
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
