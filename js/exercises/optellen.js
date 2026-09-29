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

// Groep-6 hoofdrekenen with handy numbers, as in the DWiG doelen (350 + 200, 560 - 500):
// round tens to 1.000, round hundreds to 10.000, or a number just under a round hundred.
function handigPlus() {
  const kind = pickRandom(['tientallen', 'honderdtallen', 'bijnaHonderd']);
  if (kind === 'tientallen') return [randomInt(11, 70) * 10, randomInt(2, 29) * 10];
  if (kind === 'honderdtallen') return [randomInt(11, 70) * 100, randomInt(2, 29) * 100];
  return [randomInt(120, 900), randomInt(1, 9) * 100 - randomInt(1, 3)];
}

Exercises.optellen = function (tierConfig, skill) {
  let a, b;
  if (tierConfig.handig) {
    [a, b] = handigPlus();
  } else {
    a = randomInt(tierConfig.min, tierConfig.max);
    const special = Math.random() < SPECIAL_STRATEGY_SHARE ? justUnderHundredIn(tierConfig.min, tierConfig.max) : null;
    b = special || randomInt(tierConfig.min, tierConfig.max);
  }
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
