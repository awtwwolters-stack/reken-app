var Exercises = window.Exercises || {};

Exercises.delen_met_rest = function (tierConfig, skill) {
  const divisor = randomInt(2, tierConfig.divisorMax);
  const quotient = randomInt(2, tierConfig.quotientMax);
  const rest = randomInt(1, divisor - 1); // always a non-zero remainder
  const dividend = divisor * quotient + rest;
  return {
    skillId: skill.id,
    exerciseType: 'delen_met_rest',
    prompt: `${formatNumberNL(dividend)} : ${divisor} = ? rest ?`,
    answerFields: [
      { key: 'quotient', label: 'uitkomst' },
      { key: 'rest', label: 'rest' }
    ],
    correctAnswer: { quotient, rest },
    hintContext: { dividend, divisor, quotient, rest, operator: ':' }
  };
};

window.Exercises = Exercises;
