var Exercises = window.Exercises || {};

// Delen door splitsen (groep 6, De Wereld in Getallen): 72 : 3 = 60 : 3 + 12 : 3. On a level with
// "splitsen" this share of the sums is such a sum; the rest are deeltafels.
const SPLITSEN_SHARE = 0.5;
const SPLITSEN_MAX_DIVIDEND = 200;

// 72 : 3 -> { tensPart: 60, rest: 12, tensAnswer: 20, restAnswer: 4 }: the split the rekenboek
// makes, a multiple of 10 × the divisor and what is left. Also used by the hints.
function deelSplitsing(dividend, divisor) {
  const quotient = dividend / divisor;
  const tensAnswer = Math.floor(quotient / 10) * 10;
  return { tensPart: tensAnswer * divisor, rest: dividend - tensAnswer * divisor, tensAnswer, restAnswer: quotient - tensAnswer };
}

// 72 : 3, 92 : 4, 138 : 3: a quotient of 11-50 that isn't a round ten (that would be rekenen met
// nullen), dividend at most 200.
function splitsDeelsom(skill) {
  const divisor = randomInt(2, 9);
  let quotient;
  do { quotient = randomInt(11, Math.min(50, Math.floor(SPLITSEN_MAX_DIVIDEND / divisor))); } while (quotient % 10 === 0);
  const dividend = divisor * quotient;
  const split = deelSplitsing(dividend, divisor);
  return {
    skillId: skill.id,
    exerciseType: 'delen_zonder_rest',
    prompt: `${dividend} : ${divisor} = ?`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: quotient },
    helpSum: {
      intro: `Splits ${dividend} in ${split.tensPart} en ${split.rest}. Eerst:`,
      prompt: `${split.tensPart} : ${divisor} = ?`,
      answer: split.tensAnswer,
      after: `${split.tensPart} : ${divisor} = ${split.tensAnswer}. Nu nog ${split.rest} : ${divisor}, en tel het bij elkaar.`
    },
    hintContext: { dividend, divisor, quotient, zeros: 0, splitsen: true, operator: ':' }
  };
}

Exercises.delen_zonder_rest = function (tierConfig, skill) {
  if (tierConfig.splitsen && Math.random() < SPLITSEN_SHARE) return splitsDeelsom(skill);
  const divisor = randomInt(2, tierConfig.divisorMax);
  // "zeros": a deeltafel sum with zeros added, 320 : 4 or 3.200 : 4 - where groep 6 starts the
  // year (doelen: "wegdenken van nullen"). The hint works it out "met de kleine som".
  const zeros = tierConfig.zeros ? pickRandom([1, 2]) : 0;
  const unit = 10 ** zeros;
  const quotient = randomInt(2, tierConfig.quotientMax) * unit;
  const dividend = divisor * quotient;
  const bigText = `${formatNumberNL(dividend)} : ${divisor}`;
  return {
    skillId: skill.id,
    exerciseType: 'delen_zonder_rest',
    prompt: `${bigText} = ?`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: quotient },
    // 320 : 4: the hulpsom 32 : 4 and a tip for a forgotten zero (js/exercises/nullen.js).
    ...(zeros ? nullenHelp(`${formatNumberNL(dividend / unit)} : ${divisor}`, quotient / unit, bigText, quotient) : {}),
    hintContext: { dividend, divisor, quotient, zeros, operator: ':' }
  };
};

window.Exercises = Exercises;
