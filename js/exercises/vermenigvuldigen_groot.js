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
  const bigText = `${a} × ${formatNumberNL(b)}`;
  return {
    skillId: skill.id,
    exerciseType: 'vermenigvuldigen_groot',
    prompt: `${bigText} = ?`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: a * b },
    // 5 × 90: the hulpsom 5 × 9 and a tip for a forgotten zero (js/exercises/nullen.js).
    ...(tierConfig.roundTens ? nullenHelp(`${a} × ${b / 10}`, a * b / 10, bigText, a * b) : {}),
    hintContext: { a, b }
  };
};

window.Exercises = Exercises;
