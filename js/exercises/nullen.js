var Exercises = window.Exercises || {};

// Rekenen met nullen, "naar analogie" as De Wereld in Getallen groep 6 calls it: every sum is a
// tafelsom with zeros. 5 × 90 from 5 × 9, 3 × 700 from 3 × 7, 30 × 40 from 3 × 4, 4.500 : 9 from
// 45 : 9, 1.500 : 30 from 15 : 3. Real use showed the mistake (BACKLOG D23): the tafelsom right and
// a zero forgotten (5 × 90 -> 45, 280 : 4 -> 7).
//
// nullenHelp() gives such a sum its hulpsom (the small sum, asked first after a wrong answer) and
// a tip for a forgotten zero. Keersommen level 1 and delen level 4 use it too.

const TIMES_AS_MUCH = { 10: 'tien', 100: 'honderd', 1000: 'duizend' };

// `smallText` "5 × 9" with `smallAnswer` 45; `bigText` "5 × 90" with `bigAnswer` 450.
// The answer is 10, 100 or 1000 times the small answer.
function nullenHelp(smallText, smallAnswer, bigText, bigAnswer) {
  const factor = bigAnswer / smallAnswer;
  const timesAsMuch = `${TIMES_AS_MUCH[factor]} keer zo veel`;
  const small = `${smallText} = ${formatNumberNL(smallAnswer)}`;
  // Every "too few zeros" answer gets a tip: 45 for 5 × 90, and 50 or 5 for 4.500 : 9.
  const mistakeTips = [];
  for (let short = bigAnswer / 10; short >= smallAnswer && Number.isInteger(short); short /= 10) {
    const value = short;
    mistakeTips.push({
      match: (values) => values.antwoord === value,
      text: value === smallAnswer
        ? `${small} klopt! Maar dit is ${bigText}: het antwoord is ${timesAsMuch}.`
        : `Bijna! Tel de nullen nog eens. ${small}, en het antwoord van ${bigText} is ${timesAsMuch}.`
    });
  }
  return {
    helpSum: {
      prompt: `${smallText} = ?`,
      answer: smallAnswer,
      after: `${small}. Het antwoord van ${bigText} is ${timesAsMuch}.`
    },
    mistakeTips
  };
}

// One sum of each kind: { bigText, answer, smallText, smallAnswer }. Factors 2-9: × 1 or : 1 is
// no tafelsom.
const NULLEN_KINDS = {
  // 5 × 90
  keerTientallen() {
    const a = randomInt(2, 9);
    const t = randomInt(2, 9);
    return { bigText: `${a} × ${t * 10}`, answer: a * t * 10, smallText: `${a} × ${t}`, smallAnswer: a * t };
  },
  // 3 × 700
  keerHonderdtallen() {
    const a = randomInt(2, 9);
    const t = randomInt(2, 9);
    return { bigText: `${a} × ${t * 100}`, answer: a * t * 100, smallText: `${a} × ${t}`, smallAnswer: a * t };
  },
  // 30 × 40
  tientallenKeerTientallen() {
    const a = randomInt(2, 9);
    const b = randomInt(2, 9);
    return {
      bigText: `${a * 10} × ${b * 10}`,
      answer: a * b * 100,
      smallText: `${a} × ${b}`,
      smallAnswer: a * b
    };
  },
  // 280 : 4 and 4.500 : 9
  deelNullen() {
    const d = randomInt(2, 9);
    const q = randomInt(2, 9);
    const unit = 10 ** pickRandom([1, 2]);
    return {
      bigText: `${formatNumberNL(d * q * unit)} : ${d}`,
      answer: q * unit,
      smallText: `${d * q} : ${d}`,
      smallAnswer: q
    };
  },
  // 1.500 : 30 = 50, from 15 : 3 = 5
  deelTientallen() {
    const d = randomInt(2, 9);
    const q = randomInt(2, 9);
    return {
      bigText: `${formatNumberNL(d * q * 100)} : ${d * 10}`,
      answer: q * 10,
      smallText: `${d * q} : ${d}`,
      smallAnswer: q
    };
  }
};

// tierConfig.kinds: the kinds of sum this level draws from (see curriculum/group-6.js).
Exercises.nullen = function (tierConfig, skill) {
  const kind = pickRandom(tierConfig.kinds);
  const som = NULLEN_KINDS[kind]();
  return {
    skillId: skill.id,
    exerciseType: 'nullen',
    prompt: `${som.bigText} = ?`,
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: som.answer },
    ...nullenHelp(som.smallText, som.smallAnswer, som.bigText, som.answer),
    hintContext: { ...som, kind }
  };
};

window.Exercises = Exercises;
