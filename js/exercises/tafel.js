var Exercises = window.Exercises || {};

Exercises.tafel = function (tierConfig, skill) {
  const table = skill.table;
  const multiplier = randomInt(1, tierConfig.multiplierMax);
  const product = table * multiplier;
  const askMissing = !!tierConfig.askMissingFactor && Math.random() < 0.5;

  if (askMissing) {
    // Ask for the missing multiplier instead of the product - checks the table both ways.
    return {
      skillId: skill.id,
      exerciseType: 'tafel',
      prompt: `${table} x ? = ${formatNumberNL(product)}`,
      answerFields: [{ key: 'antwoord', label: null }],
      correctAnswer: { antwoord: multiplier },
      hintContext: { table, multiplier, product, missingFactor: true }
    };
  }

  return {
    skillId: skill.id,
    exerciseType: 'tafel',
    prompt: `${table} x ${multiplier} = ?`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: product },
    hintContext: { table, multiplier, product, missingFactor: false }
  };
};

window.Exercises = Exercises;
