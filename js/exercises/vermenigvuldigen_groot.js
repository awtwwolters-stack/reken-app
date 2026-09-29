var Exercises = window.Exercises || {};

// "6 × 78": a one-digit multiplier first, as De Wereld in Getallen writes it (6 groepjes van 78).
// Each level draws from a narrow kind of sum (see the tiers in curriculum/group-6.js).
Exercises.vermenigvuldigen_groot = function (tierConfig, skill) {
  const a = randomInt(tierConfig.multiplier[0], tierConfig.multiplier[1]);
  const [low, high] = tierConfig.number;
  let b;
  if (tierConfig.roundTens) {
    b = randomInt(Math.ceil(low / 10), Math.floor(high / 10)) * 10;
  } else {
    // Round tens belong to level 1; higher levels are always a real split (tens + units).
    do { b = randomInt(low, high); } while (b % 10 === 0);
  }
  return {
    skillId: skill.id,
    exerciseType: 'vermenigvuldigen_groot',
    prompt: `${a} × ${formatNumberNL(b)} = ?`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: a * b },
    hintContext: { a, b }
  };
};

window.Exercises = Exercises;
