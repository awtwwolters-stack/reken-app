var Exercises = window.Exercises || {};

// Klokkijken: reading a wijzerklok and turning a time in words into uur : minuten.
// The clock picture is { type: 'clock', hour, minute } (hour 1-12).

const DAGDELEN = [
  { naam: "'s ochtends", from: 6, to: 11 },
  { naam: "'s middags", from: 12, to: 17 },
  { naam: "'s avonds", from: 18, to: 23 }
];
// On "to the minute" levels most times should really need the minute ticks.
const ODD_MINUTE_SHARE = 0.8;

// 3:05, the way a digital clock shows it.
function tijdTekst(uur, minuten) {
  return `${uur}:${String(minuten).padStart(2, '0')}`;
}

function uurOpKlok(uur) {
  return ((uur + 11) % 12) + 1; // 0 and 12 -> 12, 15 -> 3
}

// The Dutch way of saying a time, counting towards the next hour around "half":
// 3:15 kwart over 3, 3:20 10 voor half 4, 3:30 half 4, 3:35 5 over half 4, 3:50 10 voor 4.
function tijdInWoorden(uur, minuten) {
  const h = uurOpKlok(uur);
  const next = uurOpKlok(h + 1);
  if (minuten === 0) return `${h} uur`;
  if (minuten === 15) return `kwart over ${h}`;
  if (minuten === 30) return `half ${next}`;
  if (minuten === 45) return `kwart voor ${next}`;
  if (minuten < 15) return `${minuten} over ${h}`;
  if (minuten < 30) return `${30 - minuten} voor half ${next}`;
  if (minuten < 45) return `${minuten - 30} over half ${next}`;
  return `${60 - minuten} voor ${next}`;
}

function minutesFor(tierConfig) {
  if (tierConfig.minutes) return pickRandom(tierConfig.minutes);
  if (tierConfig.minuteStep === 1 && Math.random() < ODD_MINUTE_SHARE) {
    return randomInt(0, 11) * 5 + randomInt(1, 4);
  }
  return randomInt(0, 60 / tierConfig.minuteStep - 1) * tierConfig.minuteStep;
}

// A time for this level: { uur12, uur24 (only with a dagdeel), minuten, dagdeel }.
function klokTijd(tierConfig) {
  const minuten = minutesFor(tierConfig);
  if (!tierConfig.dagdeel) return { uur12: randomInt(1, 12), uur24: null, minuten, dagdeel: null };
  const dagdeel = pickRandom(DAGDELEN);
  const uur24 = randomInt(dagdeel.from, dagdeel.to);
  return { uur12: uurOpKlok(uur24), uur24, minuten, dagdeel: dagdeel.naam };
}

// Without a dagdeel a wijzerklok can mean morning or afternoon: 3:15 and 15:15 are both right.
// With a dagdeel only the 24-hour time counts.
function timeAnswer(tijd) {
  const uur = tijd.dagdeel ? tijd.uur24 : tijd.uur12;
  return {
    answerLayout: 'time',
    answerFields: [{ key: 'uur', label: null }, { key: 'minuten', label: null }],
    correctAnswer: { uur, minuten: tijd.minuten },
    checkAnswer: (values) => values.minuten === tijd.minuten && values.uur >= 0 && values.uur <= 23
      && (tijd.dagdeel ? values.uur === tijd.uur24 : values.uur % 12 === tijd.uur12 % 12)
  };
}

// Groep 3: a whole hour, and only the hour to type.
Exercises.klok_uur = function (tierConfig, skill) {
  const uur = randomInt(1, 12);
  return {
    skillId: skill.id,
    exerciseType: 'klok_uur',
    prompt: 'Het is ? uur',
    speech: 'Hoe laat is het? Kijk naar de kleine wijzer.',
    visual: { type: 'clock', hour: uur, minute: 0 },
    answerFields: [{ key: 'antwoord', label: null }],
    correctAnswer: { antwoord: uur },
    // 3 or 15 for three o'clock; 12 or 0 for twelve.
    checkAnswer: (values) => values.antwoord === uur || values.antwoord === (uur + 12) % 24,
    logPrompt: `Klok op ${uur} uur: het is ? uur`,
    hintContext: { uur }
  };
};

Exercises.klok = function (tierConfig, skill) {
  const tijd = klokTijd(tierConfig);
  return {
    skillId: skill.id,
    exerciseType: 'klok',
    prompt: tijd.dagdeel ? `Het is ${tijd.dagdeel}. Hoe laat is het?` : 'Hoe laat is het?',
    visual: { type: 'clock', hour: tijd.uur12, minute: tijd.minuten },
    ...timeAnswer(tijd),
    logPrompt: `Klok op ${tijdTekst(tijd.uur12, tijd.minuten)}${tijd.dagdeel ? ` ${tijd.dagdeel}` : ''}: hoe laat is het?`,
    hintContext: tijd
  };
};

// "kwart voor 4" -> 3:45. The clock showing that time appears as the first hint.
Exercises.klok_woorden = function (tierConfig, skill) {
  const tijd = klokTijd(tierConfig);
  const woorden = tijdInWoorden(tijd.uur12, tijd.minuten) + (tijd.dagdeel ? ` ${tijd.dagdeel}` : '');
  return {
    skillId: skill.id,
    exerciseType: 'klok_woorden',
    prompt: woorden,
    hintVisual: { type: 'clock', hour: tijd.uur12, minute: tijd.minuten },
    ...timeAnswer(tijd),
    hintContext: tijd
  };
};

window.Exercises = Exercises;
