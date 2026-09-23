var Exercises = window.Exercises || {};

const ROUNDING_WORDS = { 10: 'tientallen', 100: 'honderdtallen', 1000: 'duizendtallen' };

function roundingUnitFor(max) {
  if (max <= 1000) return 10;
  if (max <= 10000) return 100;
  return 1000;
}

// Two numbers with the same number of digits that differ in one non-leading digit
// (45.230 vs 45.320-style): comparing 8 with 356 tests nothing in groep 6.
function sameLengthPair(max) {
  const digits = String(max - 1).length;
  const a = randomInt(10 ** (digits - 1), Math.min(max, 10 ** digits - 1));
  const chars = String(a).split('');
  const position = randomInt(1, chars.length - 1);
  let replacement = chars[position];
  while (replacement === chars[position]) replacement = String(randomInt(0, 9));
  chars[position] = replacement;
  return [a, Number(chars.join(''))];
}

Exercises.getalbegrip = function (tierConfig, skill) {
  const variant = Math.random() < 0.5 ? 'vergelijken' : 'afronden';

  if (variant === 'vergelijken') {
    const [a, b] = sameLengthPair(tierConfig.max);
    const larger = Math.max(a, b);
    return {
      skillId: skill.id,
      exerciseType: 'getalbegrip',
      prompt: `Welk getal is groter: ${formatNumberNL(a)} of ${formatNumberNL(b)}? Typ het grootste getal.`,
      answerFields: [{ key: 'antwoord', label: null }],
      correctAnswer: { antwoord: larger },
      hintContext: { a, b, variant }
    };
  }

  const unit = roundingUnitFor(tierConfig.max);
  const n = randomInt(unit, tierConfig.max);
  const rounded = Math.round(n / unit) * unit;
  return {
    skillId: skill.id,
    exerciseType: 'getalbegrip',
    prompt: `Rond ${formatNumberNL(n)} af op ${ROUNDING_WORDS[unit]}.`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: rounded },
    hintContext: { n, unit, variant }
  };
};

window.Exercises = Exercises;
