var Exercises = window.Exercises || {};

Exercises.aftrekken = function (tierConfig, skill) {
  const a = randomInt(tierConfig.min, tierConfig.max);
  const b = randomInt(tierConfig.min, a); // b <= a, so the answer is never negative
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
