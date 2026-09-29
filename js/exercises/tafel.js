var Exercises = window.Exercises || {};

// The tafel van 6 is 1 × 6, 2 × 6, ..., 10 × 6 ("5 groepjes van 6"), as the school writes it.
Exercises.tafel = function (tierConfig, skill) {
  const table = skill.table;
  const multiplier = randomInt(1, tierConfig.multiplierMax);
  const product = table * multiplier;
  const askMissing = !!tierConfig.askMissingFactor && Math.random() < 0.5;

  if (askMissing) {
    // Ask how many times the table fits instead of the product - checks the table both ways.
    return {
      skillId: skill.id,
      exerciseType: 'tafel',
      prompt: `? × ${table} = ${formatNumberNL(product)}`,
      answerFields: [{ key: 'antwoord', label: null }],
      correctAnswer: { antwoord: multiplier },
      hintContext: { table, multiplier, product, missingFactor: true }
    };
  }

  return {
    skillId: skill.id,
    exerciseType: 'tafel',
    prompt: `${multiplier} × ${table} = ?`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: product },
    hintContext: { table, multiplier, product, missingFactor: false }
  };
};

window.Exercises = Exercises;
