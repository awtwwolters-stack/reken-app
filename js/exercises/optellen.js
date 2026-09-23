var Exercises = window.Exercises || {};

// Share of exercises that deliberately practise a special strategy (rijgen met te veel):
// random numbers almost never land just under a round hundred.
const SPECIAL_STRATEGY_SHARE = 0.2;

// A number just under a round hundred (299, 1.198) within [min, max], or null if none fits.
function justUnderHundredIn(min, max) {
  const lowest = Math.ceil((min + 5) / 100);
  const highest = Math.floor(max / 100);
  if (lowest > highest) return null;
  return randomInt(lowest, highest) * 100 - randomInt(1, 5);
}

Exercises.optellen = function (tierConfig, skill) {
  const a = randomInt(tierConfig.min, tierConfig.max);
  const special = Math.random() < SPECIAL_STRATEGY_SHARE ? justUnderHundredIn(tierConfig.min, tierConfig.max) : null;
  const b = special || randomInt(tierConfig.min, tierConfig.max);
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
