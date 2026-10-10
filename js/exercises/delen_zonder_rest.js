var Exercises = window.Exercises || {};

Exercises.delen_zonder_rest = function (tierConfig, skill) {
  const divisor = randomInt(2, tierConfig.divisorMax);
  // "zeros": a deeltafel sum with zeros added, 320 : 4 or 3.200 : 4 - where groep 6 starts the
  // year (doelen: "wegdenken van nullen"). The hint works it out "met de kleine som".
  const zeros = tierConfig.zeros ? pickRandom([1, 2]) : 0;
  const quotient = randomInt(2, tierConfig.quotientMax) * 10 ** zeros;
  const dividend = divisor * quotient;
  return {
    skillId: skill.id,
    exerciseType: 'delen_zonder_rest',
    prompt: `${formatNumberNL(dividend)} : ${divisor} = ?`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: quotient },
    hintContext: { dividend, divisor, quotient, zeros, operator: ':' }
  };
};

window.Exercises = Exercises;
