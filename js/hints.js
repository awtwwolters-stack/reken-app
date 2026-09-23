// Hint ladders, one per exercise type (per domain, not per individual skill -
// keeps V1's content workload manageable). Level 1 = gentle nudge, level 2 = explicit
// step, level 3 = worked solution. Numbers are always computed from the real exercise,
// never hardcoded, so a hint is never wrong.

var Hints = {};

function splitTens(n) {
  const tens = Math.floor(n / 10) * 10;
  const units = n - tens;
  return { tens, units };
}

// Adding and subtracting follow the hoofdreken-strategies groep 5-6 uses in De Wereld in
// Getallen (rijgen, aanvullen, rijgen met te veel), chosen from the numbers the way a teacher
// would, so the app never teaches a competing method.

// 3.749 -> [3000, 700, 40, 9]: the pieces to "rijgen" with, largest first.
function placeValueParts(n) {
  const digits = String(n).split('');
  return digits
    .map((d, i) => Number(d) * 10 ** (digits.length - 1 - i))
    .filter((part) => part > 0);
}

// 299 -> { round: 300, over: 1 }: numbers just under a round hundred, for "rijgen met te veel".
function justUnderRoundHundred(n) {
  const over = (100 - (n % 100)) % 100;
  return n >= 95 && over >= 1 && over <= 5 ? { round: n + over, over } : null;
}

// Steps of rijgen: 3.208 - 1.749 -> "3.208 - 1.000 = 2.208", "2.208 - 700 = 1.508", ...
function rijgenSteps(a, b, sign) {
  let running = a;
  return placeValueParts(b).map((part) => {
    const next = sign === '+' ? running + part : running - part;
    const step = `${formatNumberNL(running)} ${sign} ${formatNumberNL(part)} = ${formatNumberNL(next)}`;
    running = next;
    return step;
  });
}

// Aanvullen for 405 - 397: count up via a round number: 397 + 3 = 400, 400 + 5 = 405,
// so the jumps are [3, 5].
function aanvullenSteps(a, b) {
  for (const unit of [1000, 100, 10]) {
    const round = Math.ceil(b / unit) * unit;
    if (round > b && round < a) {
      return {
        steps: [
          `${formatNumberNL(b)} + ${formatNumberNL(round - b)} = ${formatNumberNL(round)}`,
          `${formatNumberNL(round)} + ${formatNumberNL(a - round)} = ${formatNumberNL(a)}`
        ],
        jumps: [round - b, a - round]
      };
    }
  }
  return { steps: [`${formatNumberNL(b)} + ${formatNumberNL(a - b)} = ${formatNumberNL(a)}`], jumps: [a - b] };
}

// Aanvullen fits numbers that are close relative to their size (405 - 397), not 45 - 32.
function isAanvullenCase(a, b) {
  const difference = a - b;
  return difference > 0 && difference < 20 && difference * 10 <= a;
}

function subtractionStrategy(a, b) {
  if (isAanvullenCase(a, b)) return 'aanvullen';
  const near = justUnderRoundHundred(b);
  if (near && a >= near.round) return 'teVeel';
  return 'rijgen';
}

Hints.optellen = function (level, ctx) {
  const { a, b } = ctx;
  const sum = formatNumberNL(a + b);
  const near = justUnderRoundHundred(b);

  if (near) {
    const round = formatNumberNL(near.round);
    const between = formatNumberNL(a + near.round);
    if (level === 1) return `${formatNumberNL(b)} is bijna ${round}. Probeer rijgen met te veel.`;
    if (level === 2) return `Doe eerst + ${round}, en haal er dan ${near.over} weer af.`;
    return `${formatNumberNL(a)} + ${round} = ${between}, en ${between} - ${near.over} = ${sum}.`;
  }

  const steps = rijgenSteps(a, b, '+');
  if (level === 1) return 'Probeer te rijgen: tel het tweede getal er in stukjes bij, eerst het grootste stuk.';
  if (level === 2) return `Begin zo: ${steps[0]}. Tel daarna de rest erbij.`;
  return `${steps.join(', ')}. Dus ${formatNumberNL(a)} + ${formatNumberNL(b)} = ${sum}.`;
};

Hints.aftrekken = function (level, ctx) {
  const { a, b } = ctx;
  const answer = formatNumberNL(a - b);
  const strategy = subtractionStrategy(a, b);

  if (strategy === 'aanvullen') {
    const { steps, jumps } = aanvullenSteps(a, b);
    if (level === 1) return `De getallen liggen dicht bij elkaar. Probeer aanvullen: tel op van ${formatNumberNL(b)} naar ${formatNumberNL(a)}.`;
    if (level === 2) return `Begin zo: ${steps[0]}. Hoeveel is het dan nog tot ${formatNumberNL(a)}?`;
    const together = jumps.length > 1 ? `Samen: ${jumps.map(formatNumberNL).join(' + ')} = ${answer}` : `Dat is ${answer}`;
    return `${steps.join(', ')}. ${together}, dus ${formatNumberNL(a)} - ${formatNumberNL(b)} = ${answer}.`;
  }

  if (strategy === 'teVeel') {
    const near = justUnderRoundHundred(b);
    const round = formatNumberNL(near.round);
    const between = formatNumberNL(a - near.round);
    if (level === 1) return `${formatNumberNL(b)} is bijna ${round}. Probeer rijgen met te veel.`;
    if (level === 2) return `Doe eerst - ${round}. Dan heb je er ${near.over} te veel afgehaald: tel die er weer bij.`;
    return `${formatNumberNL(a)} - ${round} = ${between}, en ${between} + ${near.over} = ${answer}.`;
  }

  const steps = rijgenSteps(a, b, '-');
  if (level === 1) return 'Probeer te rijgen: haal het tweede getal er in stukjes af, eerst het grootste stuk.';
  if (level === 2) return `Begin zo: ${steps[0]}. Haal daarna de rest eraf.`;
  return `${steps.join(', ')}. Dus ${formatNumberNL(a)} - ${formatNumberNL(b)} = ${answer}.`;
};

Hints.tafel = function (level, ctx) {
  const { table, multiplier, product, missingFactor } = ctx;
  if (level === 1) return `Denk aan de tafel van ${table}.`;
  if (level === 2) {
    if (missingFactor) {
      return `Tel er telkens ${table} bij op totdat je bij ${formatNumberNL(product)} uitkomt: ${table}, ${table * 2}, ${table * 3}, ...`;
    }
    return `${table} x ${multiplier - 1} = ${formatNumberNL(table * (multiplier - 1))}, dus ${table} x ${multiplier} = ${formatNumberNL(table * (multiplier - 1))} + ${table}.`;
  }
  return missingFactor
    ? `${table} x ${multiplier} = ${formatNumberNL(product)}`
    : `${table} x ${multiplier} = ${formatNumberNL(product)}`;
};

Hints.vermenigvuldigen_groot = function (level, ctx) {
  const { a, b } = ctx;
  if (level === 1) return 'Splits het grote getal in tientallen en eenheden.';
  if (level === 2) {
    const s = splitTens(a);
    return `Reken zo: (${formatNumberNL(s.tens)} x ${b}) + (${s.units} x ${b}) = ${formatNumberNL(s.tens * b)} + ${formatNumberNL(s.units * b)}.`;
  }
  return `${formatNumberNL(a)} x ${b} = ${formatNumberNL(a * b)}`;
};

Hints.delen_zonder_rest = function (level, ctx) {
  const { dividend, divisor, quotient } = ctx;
  if (level === 1) return `Welke tafel van ${divisor} kun je gebruiken?`;
  if (level === 2) return `Zoek het getal waarmee je ${divisor} moet vermenigvuldigen om bij ${formatNumberNL(dividend)} uit te komen.`;
  return `${formatNumberNL(dividend)} : ${divisor} = ${quotient}`;
};

Hints.delen_met_rest = function (level, ctx) {
  const { dividend, divisor, quotient, rest } = ctx;
  if (level === 1) return `Hoe vaak past ${divisor} in ${formatNumberNL(dividend)}? Er blijft iets over.`;
  if (level === 2) return `${divisor} x ${quotient} = ${formatNumberNL(divisor * quotient)}. Wat blijft er over van ${formatNumberNL(dividend)}?`;
  return `${formatNumberNL(dividend)} : ${divisor} = ${quotient} rest ${rest}`;
};

Hints.getalbegrip = function (level, ctx) {
  if (ctx.variant === 'vergelijken') {
    const { a, b } = ctx;
    if (level === 1) return 'Vergelijk cijfer voor cijfer, van links naar rechts.';
    if (level === 2) return `Beide getallen hebben evenveel cijfers. Zoek van links af het eerste cijfer dat anders is in ${formatNumberNL(a)} en ${formatNumberNL(b)}.`;
    return `Het grootste getal is ${formatNumberNL(Math.max(a, b))}.`;
  }
  const { n, unit } = ctx;
  if (level === 1) return `Kijk tussen welke twee ${ROUNDING_WORDS[unit]} ${formatNumberNL(n)} in ligt.`;
  if (level === 2) return 'Is het dichter bij het ronde getal ervoor, of erna?';
  return `${formatNumberNL(n)} rond je af op ${formatNumberNL(Math.round(n / unit) * unit)}.`;
};

Hints.verhaalsom = function (level, ctx) {
  if (level === 1) return 'Welke som hoort bij dit verhaal: optellen, aftrekken, keer of delen?';
  // verhaalsom's own hintContext shape matches vermenigvuldigen_groot ({a,b}) and
  // delen_zonder_rest ({dividend,divisor,quotient}), not the tafel-specific shape.
  const map = {
    optellen: 'optellen',
    aftrekken: 'aftrekken',
    vermenigvuldigen: 'vermenigvuldigen_groot',
    delen: 'delen_zonder_rest'
  };
  const inner = Hints[map[ctx.underlyingOperation]];
  if (inner) return inner(level, ctx);
  return 'Reken de som die bij het verhaal hoort stap voor stap uit.';
};

Hints.breuk_herkennen = function (level, ctx) {
  const { teller, noemer } = ctx;
  if (level === 1) return 'Tel in hoeveel gelijke stukken de strook verdeeld is. Dat getal komt onder de streep: de noemer.';
  if (level === 2) return `De strook heeft ${noemer} gelijke stukken, dus de noemer is ${noemer}. Hoeveel stukken zijn er gekleurd? Dat komt boven de streep.`;
  return `${teller} van de ${noemer} stukken zijn gekleurd: ${teller}/${noemer}.`;
};

Hints.breuk_deel_van = function (level, ctx) {
  const { noemer, amount } = ctx;
  const fraction = unitFractionText(noemer);
  const part = amount / noemer;
  if (level === 1) return `Om ${fraction} van ${formatNumberNL(amount)} te vinden, verdeel je ${formatNumberNL(amount)} in ${noemer} gelijke stukken.`;
  if (level === 2) return `Reken ${formatNumberNL(amount)} : ${noemer}. Hoe groot is één stuk?`;
  return `${formatNumberNL(amount)} : ${noemer} = ${formatNumberNL(part)}, dus ${fraction} van ${formatNumberNL(amount)} = ${formatNumberNL(part)}.`;
};

function getHint(exerciseType, level, hintContext) {
  const fn = Hints[exerciseType];
  if (!fn) return 'Denk rustig na en probeer het nog eens.';
  return fn(level, hintContext);
}
