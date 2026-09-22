var Exercises = window.Exercises || {};

var VERHAALSOM_NAMES = ['Sam', 'Noor', 'Liam', 'Zoë', 'Finn', 'Eva', 'Daan', 'Luna'];
var VERHAALSOM_OBJECTEN = ['appels', 'knikkers', 'stickers', 'kaarten', 'ballonnen'];

Exercises.verhaalsom = function (tierConfig, skill) {
  const operation = pickRandom(['optellen', 'aftrekken', 'vermenigvuldigen', 'delen']);
  const name = pickRandom(VERHAALSOM_NAMES);
  const object = pickRandom(VERHAALSOM_OBJECTEN);
  const max = tierConfig.max;

  let prompt, answer, hintContext;

  if (operation === 'optellen') {
    const a = randomInt(2, max);
    const b = randomInt(2, max);
    prompt = `${name} heeft ${formatNumberNL(a)} ${object}. ${name} krijgt er ${formatNumberNL(b)} bij. Hoeveel ${object} heeft ${name} nu?`;
    answer = a + b;
    hintContext = { a, b, operator: '+' };
  } else if (operation === 'aftrekken') {
    const a = randomInt(2, max);
    const b = randomInt(1, a);
    prompt = `${name} heeft ${formatNumberNL(a)} ${object}. ${name} geeft er ${formatNumberNL(b)} weg. Hoeveel ${object} houdt ${name} over?`;
    answer = a - b;
    hintContext = { a, b, operator: '-' };
  } else if (operation === 'vermenigvuldigen') {
    const a = randomInt(2, Math.min(max, 20));
    const b = randomInt(2, 10);
    prompt = `${name} heeft ${a} zakjes met elk ${b} ${object}. Hoeveel ${object} zijn dat in totaal?`;
    answer = a * b;
    hintContext = { a, b, operator: '×' };
  } else {
    const divisor = randomInt(2, 10);
    const quotient = randomInt(2, Math.min(max, 20));
    const dividend = divisor * quotient;
    prompt = `${name} verdeelt ${formatNumberNL(dividend)} ${object} eerlijk over ${divisor} vriendjes. Hoeveel ${object} krijgt ieder vriendje?`;
    answer = quotient;
    hintContext = { dividend, divisor, quotient, operator: ':' };
  }

  return {
    skillId: skill.id,
    exerciseType: 'verhaalsom',
    prompt,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: answer },
    hintContext: Object.assign({ underlyingOperation: operation }, hintContext)
  };
};

window.Exercises = Exercises;
