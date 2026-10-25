var Exercises = window.Exercises || {};

// Aanvankelijk rekenen (groep 3): numbers and dot pictures, hardly any words - these children are
// just learning to read. Every exercise also brings a `speech` sentence for the 🔊 button.
// A dot picture is { type: 'dots', parts: [{ count, kind }] }, drawn as ten-frames (2 rows of 5):
// kind 'a' / 'b' = two colours, 'gone' = crossed out (taken away), 'hidden' = still to find.

function dotsVisual(...parts) {
  return { type: 'dots', parts: parts.filter((p) => p.count > 0) };
}

function singleAnswer(value) {
  return { answerFields: [{ key: 'antwoord', label: null }], correctAnswer: { antwoord: value } };
}

// "dots" on a tier: true = the full picture shows with the question; "start" = only the starting
// number as plain dots (the child does the taking away or splitting in their head) and the full
// picture comes as the first hint; "cross" = the starting dots, of which the child taps `crossable`
// away themselves (wegstrepen, BACKLOG D22), the full picture again the first hint; absent = no
// picture until the first hint. "start" and "cross" are steps between "always with dots" and
// "never", which proved too big in one go.
function withDots(tierConfig, visual, startVisual, crossable) {
  if (tierConfig.dots === true) return { visual };
  if (tierConfig.dots === 'start' && startVisual) return { visual: startVisual, hintVisual: visual };
  if (tierConfig.dots === 'cross' && startVisual && crossable) {
    return { visual: Object.assign({}, startVisual, { crossable }), hintVisual: visual };
  }
  return { hintVisual: visual };
}

function stippen(n) {
  return `${n} ${n === 1 ? 'stip' : 'stippen'}`;
}

Exercises.tellen = function (tierConfig, skill) {
  const n = randomInt(tierConfig.min, tierConfig.max);
  const visual = dotsVisual({ count: n, kind: 'a' });
  return {
    skillId: skill.id,
    exerciseType: 'tellen',
    prompt: 'Hoeveel stippen?',
    logPrompt: `Hoeveel stippen? (${n} stippen getoond)`,
    speech: 'Hoeveel stippen zie je?',
    visual,
    ...singleAnswer(n),
    hintContext: { n }
  };
};

// Three numbers counting on (or back) and the next one to find: "3, 4, 5, ?".
Exercises.rijtjes = function (tierConfig, skill) {
  const step = pickRandom(tierConfig.steps);
  const backward = tierConfig.backward && Math.random() < 0.4;
  const span = 3 * step; // from the first shown number to the answer
  const first = backward ? randomInt(span, tierConfig.max) : randomInt(0, tierConfig.max - span);
  const direction = backward ? -1 : 1;
  const shown = [0, 1, 2].map((i) => first + direction * i * step);
  const answer = first + direction * span;
  return {
    skillId: skill.id,
    exerciseType: 'rijtjes',
    prompt: `${shown.join(', ')}, ?`,
    speech: `Welk getal komt hierna? ${shown.join(', ')}`,
    ...singleAnswer(answer),
    hintContext: { shown, step, backward, answer }
  };
};

// Splitsen, shown as a split picture (whole on top, parts below) rather than "10 = 7 + ?", which a
// child reading left to right took as "the answer is 10". The formula stays as the logged prompt.
// Dots show the known part in colour and the missing part as open dots.
Exercises.splitsen = function (tierConfig, skill) {
  let whole;
  let part;
  const viaTen = tierConfig.min > 10 && Math.random() < tierConfig.tenShare; // 15 = 10 + ?
  if (viaTen) {
    whole = randomInt(tierConfig.min, tierConfig.max);
    part = 10;
  } else {
    // Vriendjes van 10: a share of the tot-10 splits are splits of 10 itself.
    whole = tierConfig.max === 10 && tierConfig.tenShare && Math.random() < tierConfig.tenShare
      ? 10
      : randomInt(tierConfig.min, tierConfig.max);
    part = randomInt(1, whole - 1);
  }
  const answer = whole - part;
  const splits = { type: 'splits', whole, part };
  const dots = dotsVisual({ count: part, kind: 'a' }, { count: answer, kind: 'hidden' });
  const picture = withDots(tierConfig, [splits, dots], [splits, dotsVisual({ count: whole, kind: 'a' })]);
  return {
    skillId: skill.id,
    exerciseType: 'splitsen',
    prompt: `${whole} = ${part} + ?`,
    promptParts: [], // the split picture is the question
    speech: `Splits ${whole}. ${part} en hoeveel?`,
    visual: splits,
    ...picture,
    ...singleAnswer(answer),
    hintContext: { whole, part, answer }
  };
};

// tot10: sum at most 10. tot20: to 20 without crossing ten (12 + 5). over10: crossing ten (8 + 5).
function plusNumbers(range) {
  if (range === 'tot10') {
    const a = randomInt(1, 9);
    return [a, randomInt(1, 10 - a)];
  }
  if (range === 'tot20') {
    const units = randomInt(0, 8);
    const pair = [10 + units, randomInt(1, 9 - units)];
    return Math.random() < 0.3 ? pair.reverse() : pair;
  }
  const a = randomInt(2, 9);
  return [a, randomInt(11 - a, 9)];
}

function minNumbers(range) {
  if (range === 'tot10') {
    const a = randomInt(2, 10);
    return [a, randomInt(1, a)];
  }
  if (range === 'tot20') {
    const units = randomInt(1, 9);
    return [10 + units, randomInt(1, units)]; // 17 - 5: the answer stays 10 or more
  }
  const units = randomInt(1, 8);
  return [10 + units, randomInt(units + 1, 9)]; // 13 - 5: past the 10 downwards
}

Exercises.plus_tot_20 = function (tierConfig, skill) {
  const [a, b] = plusNumbers(tierConfig.range);
  return {
    skillId: skill.id,
    exerciseType: 'plus_tot_20',
    prompt: `${a} + ${b} = ?`,
    speech: `Hoeveel is ${a} plus ${b}?`,
    ...withDots(tierConfig, dotsVisual({ count: a, kind: 'a' }, { count: b, kind: 'b' })),
    ...singleAnswer(a + b),
    hintContext: { a, b }
  };
};

// Typing the first number (9 for 9 - 2) means counting all the dots, or not taking away at all:
// that answer gets its own tip instead of the first hint (BACKLOG D22). It still counts as wrong.
Exercises.min_tot_20 = function (tierConfig, skill) {
  const [a, b] = minNumbers(tierConfig.range);
  const cross = tierConfig.dots === 'cross';
  const dotsShown = tierConfig.dots === true || cross;
  return {
    skillId: skill.id,
    exerciseType: 'min_tot_20',
    prompt: `${a} - ${b} = ?`,
    speech: `Hoeveel is ${a} min ${b}?${cross ? ` Tik ${stippen(b)} weg.` : ''}`,
    ...withDots(tierConfig, dotsVisual({ count: a - b, kind: 'a' }, { count: b, kind: 'gone' }), dotsVisual({ count: a, kind: 'a' }), b),
    ...singleAnswer(a - b),
    startNumberTip: {
      value: a,
      text: dotsShown
        ? `Je telde alle stippen. Er gaan er ${b} weg.`
        : `${a} is het getal waar je mee begint. Er gaan er ${b} af.`
    },
    hintContext: { a, b }
  };
};

window.Exercises = Exercises;
