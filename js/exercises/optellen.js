var Exercises = window.Exercises || {};

Exercises.optellen = function (tierConfig, skill) {
  const a = randomInt(tierConfig.min, tierConfig.max);
  const b = randomInt(tierConfig.min, tierConfig.max);
  return {
    skillId: skill.id,
    exerciseType: 'optellen',
    prompt: `${formatNumberNL(a)} + ${formatNumberNL(b)} = ?`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: a + b },
    hintContext: { a, b, operator: '+' }
  };
};

window.Exercises = Exercises;
