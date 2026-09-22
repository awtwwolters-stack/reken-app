var Exercises = window.Exercises || {};

Exercises.vermenigvuldigen_groot = function (tierConfig, skill) {
  const a = randomInt(10, tierConfig.factor1Max);
  const b = randomInt(2, tierConfig.factor2Max);
  return {
    skillId: skill.id,
    exerciseType: 'vermenigvuldigen_groot',
    prompt: `${formatNumberNL(a)} x ${b} = ?`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: a * b },
    hintContext: { a, b, operator: '×' }
  };
};

window.Exercises = Exercises;
