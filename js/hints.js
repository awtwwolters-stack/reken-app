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

Hints.optellen = function (level, ctx) {
  const { a, b } = ctx;
  if (level === 1) return 'Probeer het in stappen: eerst de ronde getallen, dan de rest.';
  if (level === 2) {
    const bSplit = splitTens(b);
    return `Reken zo: ${formatNumberNL(a)} + ${formatNumberNL(bSplit.tens)} = ${formatNumberNL(a + bSplit.tens)}, en dan nog + ${bSplit.units}.`;
  }
  return `${formatNumberNL(a)} + ${formatNumberNL(b)} = ${formatNumberNL(a + b)}`;
};

Hints.aftrekken = function (level, ctx) {
  const { a, b } = ctx;
  if (level === 1) return 'Splits de aftreksom in tientallen en eenheden.';
  if (level === 2) {
    const bSplit = splitTens(b);
    return `Reken zo: ${formatNumberNL(a)} - ${formatNumberNL(bSplit.tens)} = ${formatNumberNL(a - bSplit.tens)}, en dan nog - ${bSplit.units}.`;
  }
  return `${formatNumberNL(a)} - ${formatNumberNL(b)} = ${formatNumberNL(a - b)}`;
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
    if (level === 2) return `Kijk eerst naar het aantal cijfers, en dan naar het eerste cijfer van ${formatNumberNL(a)} en ${formatNumberNL(b)}.`;
    return `Het grootste getal is ${formatNumberNL(Math.max(a, b))}.`;
  }
  const { n, unit } = ctx;
  if (level === 1) return `Kijk tussen welke twee ${formatNumberNL(unit)}tallen ${formatNumberNL(n)} in ligt.`;
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

function getHint(exerciseType, level, hintContext) {
  const fn = Hints[exerciseType];
  if (!fn) return 'Denk rustig na en probeer het nog eens.';
  return fn(level, hintContext);
}
