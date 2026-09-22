var Exercises = window.Exercises || {};

Exercises.delen_zonder_rest = function (tierConfig, skill) {
  const divisor = randomInt(2, tierConfig.divisorMax);
  const quotient = randomInt(2, tierConfig.quotientMax);
  const dividend = divisor * quotient;
  return {
    skillId: skill.id,
    exerciseType: 'delen_zonder_rest',
    prompt: `${formatNumberNL(dividend)} : ${divisor} = ?`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: quotient },
    hintContext: { dividend, divisor, quotient, operator: ':' }
  };
};

window.Exercises = Exercises;
