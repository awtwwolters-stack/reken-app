var Exercises = window.Exercises || {};

function roundingUnitFor(max) {
  if (max <= 1000) return 10;
  if (max <= 10000) return 100;
  return 1000;
}

Exercises.getalbegrip = function (tierConfig, skill) {
  const variant = Math.random() < 0.5 ? 'vergelijken' : 'afronden';

  if (variant === 'vergelijken') {
    const a = randomInt(1, tierConfig.max);
    let b = randomInt(1, tierConfig.max);
    while (b === a) b = randomInt(1, tierConfig.max);
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
    prompt: `Rond ${formatNumberNL(n)} af op ${formatNumberNL(unit)}tallen.`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: rounded },
    hintContext: { n, unit, variant }
  };
};

window.Exercises = Exercises;
