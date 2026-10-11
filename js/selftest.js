// Self-check: makes every kind of sum at every level many times and checks that the sum, its
// answer, its hints and its pictures are sound - on this device, in this browser. Run from the
// Ouder overzicht ("Controleer de app op dit apparaat") and before every release. It exists
// because faults used to show up only on the children's iPads (BACKLOG D13).

const SELFTEST_SUMS_PER_LEVEL = 150;
const SELFTEST_MAX_PROBLEMS_SHOWN = 8;

function isWholeNumber(value) {
  return Number.isInteger(value) && value >= 0;
}

// Returns what is wrong with a picture, or null.
function pictureProblem(visual) {
  if (!visual) return null;
  for (const v of [].concat(visual)) {
    if (v.type === 'strook') {
      if (!(isWholeNumber(v.parts) && v.parts >= 1 && isWholeNumber(v.coloured) && v.coloured <= v.parts)) return 'strook klopt niet';
    } else if (v.type === 'dots') {
      const total = v.parts.reduce((n, p) => n + p.count, 0);
      if (!v.parts.every((p) => isWholeNumber(p.count) && ['a', 'b', 'gone', 'hidden'].includes(p.kind)) || total > 20) return 'stippen kloppen niet';
    } else if (v.type === 'clock') {
      if (!(isWholeNumber(v.hour) && v.hour >= 1 && v.hour <= 12 && isWholeNumber(v.minute) && v.minute <= 59)) return 'klok klopt niet';
    } else if (v.type === 'splits') {
      if (!(isWholeNumber(v.whole) && isWholeNumber(v.part) && v.part < v.whole)) return 'splitsplaatje klopt niet';
    } else {
      return `onbekend plaatje "${v.type}"`;
    }
  }
  return null;
}

// Whether the text names this number as a number of its own: 24 is not "in" 124 or 2.400.
function namesNumber(text, value) {
  const written = formatNumberNL(value).replace(/\./g, '\\.');
  return new RegExp(`(^|[^\\d.])(${written}|${value})(?![\\d]|\\.\\d)`).test(text);
}

// Returns what is wrong with one sum, or null.
function exerciseProblem(exercise) {
  if (!exercise.prompt || typeof exercise.prompt !== 'string') return 'geen vraag';
  if (!exercise.answerFields || exercise.answerFields.length === 0) return 'geen antwoordvak';
  const answers = exercise.answerFields.map((field) => exercise.correctAnswer[field.key]);
  if (!answers.every(isWholeNumber)) return `antwoord is geen heel getal (${JSON.stringify(exercise.correctAnswer)})`;
  if (exercise.checkAnswer && !exercise.checkAnswer(exercise.correctAnswer)) return 'het goede antwoord wordt fout gerekend';
  for (let level = 1; level <= 3; level++) {
    const hint = getHint(exercise.exerciseType, level, exercise.hintContext);
    if (typeof hint !== 'string' || hint.trim() === '') return `hint ${level} ontbreekt`;
    if (/\b(undefined|NaN|null)\b/.test(hint)) return `hint ${level} bevat een fout ("${hint}")`;
    // The last hint is the worked solution: the right answer has to be in it (a time as 3:05).
    const named = exercise.answerLayout === 'time'
      ? hint.includes(tijdTekst(exercise.correctAnswer.uur, exercise.correctAnswer.minuten))
      : answers.every((value) => namesNumber(hint, value));
    if (level === 3 && !named) return `de uitleg noemt het goede antwoord niet ("${hint}")`;
  }
  return timeProblem(exercise) || pictureProblem(exercise.visual) || pictureProblem(exercise.hintVisual);
}

// Clock sums: the picture shows the asked time, and the right hours are accepted and no others
// (3:15 and 15:15 without a dagdeel; only the 24-hour time with one).
function timeProblem(exercise) {
  const clock = [].concat(exercise.visual || [], exercise.hintVisual || []).find((v) => v.type === 'clock');
  if (!clock) return null;
  if (exercise.answerLayout !== 'time') {
    return clock.hour === exercise.correctAnswer.antwoord && clock.minute === 0 ? null : 'de klok toont een andere tijd dan het antwoord';
  }
  const { uur, minuten } = exercise.correctAnswer;
  if (clock.hour % 12 !== uur % 12 || clock.minute !== minuten) return 'de klok toont een andere tijd dan het antwoord';
  const accepts = (u, m) => exercise.checkAnswer({ uur: u, minuten: m });
  const other = (uur + 12) % 24;
  const withDagdeel = !!exercise.hintContext.dagdeel;
  if (accepts(other, minuten) === withDagdeel) return withDagdeel ? 'met dagdeel wordt ook de 12-uurs tijd goed gerekend' : 'zonder dagdeel wordt de andere dagdeel-tijd fout gerekend';
  if (accepts((uur + 1) % 24, minuten) || accepts(uur, (minuten + 1) % 60)) return 'een verkeerde tijd wordt goed gerekend';
  return null;
}

// The Dutch time words are easy to get wrong around "half" and around 12: known pairs.
const TIJD_IN_WOORDEN_VOORBEELDEN = [
  [3, 0, '3 uur'], [3, 5, '5 over 3'], [3, 10, '10 over 3'], [3, 15, 'kwart over 3'], [3, 20, '10 voor half 4'],
  [3, 25, '5 voor half 4'], [3, 30, 'half 4'], [3, 35, '5 over half 4'], [3, 40, '10 over half 4'],
  [3, 45, 'kwart voor 4'], [3, 50, '10 voor 4'], [3, 55, '5 voor 4'], [3, 17, '13 voor half 4'],
  [3, 43, '13 over half 4'], [3, 58, '2 voor 4'], [12, 0, '12 uur'], [12, 30, 'half 1'], [12, 45, 'kwart voor 1'],
  [11, 55, '5 voor 12'], [11, 30, 'half 12'], [15, 45, 'kwart voor 4'], [0, 10, '10 over 12'], [23, 50, '10 voor 12']
];

function timeWordsProblems() {
  return TIJD_IN_WOORDEN_VOORBEELDEN
    .filter(([uur, minuten, woorden]) => tijdInWoorden(uur, minuten) !== woorden)
    .map(([uur, minuten, woorden]) => `Tijd in woorden: ${tijdTekst(uur, minuten)} hoort "${woorden}" te zijn, maar is "${tijdInWoorden(uur, minuten)}"`);
}

// Tempo-ronde (js/tempo.js): every sum is read back from its text and recalculated, and a
// simulated child plays rounds to check the locks, the record and the stars.
function tempoSumProblem(sum) {
  const answer = sum.correctAnswer.antwoord;
  const filled = sum.prompt.replace('?', answer);
  const parts = filled.match(/^(\d+) ([×:]) (\d+) = (\d+)$/);
  if (!parts || filled !== sum.solved) return 'de som is niet te lezen';
  const [a, b, c] = [Number(parts[1]), Number(parts[3]), Number(parts[4])];
  if (parts[2] === '×' ? a * b !== c : b * c !== a) return `het antwoord ${answer} klopt niet`;
  const factors = parts[2] === '×' ? [a, b] : [b, c];
  if (!factors.every((f) => Number.isInteger(f) && f >= TEMPO_FACTOR_MIN && f <= TEMPO_FACTOR_MAX)) return 'de som valt buiten de tafels';
  return null;
}

function tempoProblems() {
  const problems = [];
  TEMPO_KINDS.forEach((kind) => {
    let previous = null;
    let found = null;
    for (let i = 0; i < SELFTEST_SUMS_PER_LEVEL && !found; i++) {
      try {
        const sum = tempoSum(kind.id, previous);
        found = tempoSumProblem(sum) || (sum.prompt === previous ? 'dezelfde som twee keer achter elkaar' : null);
        if (found) found += ` bij "${sum.prompt}"`;
        previous = sum.prompt;
      } catch (e) {
        found = `de som kan niet gemaakt worden (${e.message})`;
      }
    }
    if (found) problems.push(`Tempo, ${kind.name}: ${found}`);
  });

  const open = (profile) => tempoKindsFor(profile).filter((k) => k.open).length;
  const child = (groep) => ({ groep, groepSchoolYear: schoolYearOf(), stars: 0 });
  if (open(child(TEMPO_ALL_OPEN_GROEP)) !== TEMPO_KINDS.length) problems.push('Tempo: groep 6 heeft niet alle soorten open');
  const young = child(TEMPO_MIN_GROEP);
  if (open(young) !== 1) problems.push('Tempo: groep 5 begint niet met alleen de tafels');
  const first = recordTempoRound(young, 'tafels', TEMPO_UNLOCK_SCORE, 0);
  if (!first.first || first.isRecord || first.stars !== TEMPO_STARS.done) problems.push('Tempo: de eerste ronde telt als record of geeft verkeerde sterren');
  if (open(young) !== 1) problems.push('Tempo: de volgende soort gaat te vroeg open');
  const lower = recordTempoRound(young, 'tafels', TEMPO_UNLOCK_SCORE - 1, 2);
  if (lower.isRecord || young.tempo.tafels.best !== TEMPO_UNLOCK_SCORE) problems.push('Tempo: een lagere score verandert het record');
  if (open(young) !== 1) problems.push('Tempo: een score onder de drempel telt mee voor het slotje');
  const higher = recordTempoRound(young, 'tafels', TEMPO_UNLOCK_SCORE + 1, 0);
  if (!higher.isRecord || higher.stars !== TEMPO_STARS.done + TEMPO_STARS.record) problems.push('Tempo: een hogere score is geen record');
  if (open(young) !== 2) problems.push('Tempo: de volgende soort gaat niet open na genoeg goede rondes');
  if (young.stars !== 3 * TEMPO_STARS.done + TEMPO_STARS.record) problems.push(`Tempo: de sterren kloppen niet (${young.stars})`);
  if (recordTempoRound(young, 'tafels', 0, 0).stars !== 0) problems.push('Tempo: een ronde zonder goede som geeft sterren');
  if ((young.practiceDays || []).length) problems.push('Tempo: een ronde telt als oefendag');

  const misses = tempoMisses([
    { solved: 'a', correct: true, ms: TEMPO_SLOW_MS + 1 }, { solved: 'b', correct: true, ms: 1000 },
    { solved: 'c', correct: false, ms: 1000 }, { solved: 'd', correct: true, ms: TEMPO_SLOW_MS + 2000 }
  ]);
  if (misses.join() !== 'c,d,a') problems.push(`Tempo: de sommen na afloop kloppen niet (${misses.join()})`);
  return problems;
}

// The park (js/park.js): shop and story data, and a simulated child buying until refused.
function parkProblems(today = new Date()) {
  const problems = [];
  const ids = new Set();
  PARK_ITEMS.forEach((item) => {
    if (ids.has(item.id)) problems.push(`Park: "${item.id}" staat dubbel in de winkel`);
    ids.add(item.id);
    if (!(Number.isInteger(item.price) && item.price > 0)) problems.push(`Park: ${item.name} heeft geen goede prijs (${item.price})`);
    if (!(Number.isInteger(item.chapter) && item.chapter >= 0 && item.chapter < STORY.length)) problems.push(`Park: ${item.name} hoort bij geen bestaand hoofdstuk`);
    if (!item.emoji || !item.name) problems.push(`Park: "${item.id}" mist een plaatje of naam`);
  });
  if (STORY.length !== COLLECTION.length + 1) problems.push(`Verhaal: ${STORY.length} hoofdstukken voor ${COLLECTION.length} dieren`);
  STORY.forEach((chapter, i) => {
    const text = chapter.title && chapter.text ? chapterText(i, 'Sam') : '';
    if (!text) problems.push(`Verhaal: hoofdstuk ${i + 1} mist een titel of tekst`);
    else if (/[{}]|\b(undefined|null|NaN)\b/.test(text)) problems.push(`Verhaal: hoofdstuk ${i + 1} bevat een fout`);
    // Each chapter is about its own animal: "Vos Fien" is called Fien in the story.
    const animal = i > 0 && COLLECTION[i - 1] ? COLLECTION[i - 1].name.split(' ').pop() : null;
    if (animal && !text.includes(animal)) problems.push(`Verhaal: hoofdstuk ${i + 1} noemt ${animal} niet`);
  });

  // A child with stars but no session today may look, not buy; without stars nothing is affordable.
  const looker = { stars: 500, practiceDays: [] };
  if (buyRefusal(looker, 'tulp', today) !== 'closed') problems.push('Park: kopen lukt zonder vandaag te rekenen');
  const poor = { stars: 0, practiceDays: [dateKey(today)] };
  if (buyRefusal(poor, 'tulp', today) !== 'tooExpensive') problems.push('Park: kopen lukt zonder genoeg sterren');
  if (buyRefusal(poor, 'eiland', today) !== 'locked') problems.push('Park: iets uit een later hoofdstuk is al te koop');

  // A rich child buys the cheapest thing in the shop until the park is full.
  const rich = { stars: 5000, practiceDays: [dateKey(today)] };
  const cheapest = shopItems(rich).reduce((a, b) => (b.price < a.price ? b : a));
  let refusal = null;
  for (let i = 0; i < 200 && !refusal; i++) {
    refusal = buyRefusal(rich, cheapest.id, today);
    if (!refusal && buyItem(rich, cheapest.id, today) === null) refusal = 'buyItem weigerde';
    if (walletStars(rich) < 0) return problems.concat('Park: de spaarpot komt onder nul');
  }
  if (refusal !== 'full') problems.push(`Park: kopen stopte met "${refusal}" in plaats van "vol"`);
  if (parkOf(rich).items.length !== maxParkItems(rich)) problems.push('Park: het park liep niet precies vol');
  const tiles = parkLayout(rich);
  if (tiles.filter(Boolean).length !== parkOf(rich).items.length + animalsInPark(rich)) problems.push('Park: niet alles heeft een eigen plek');
  if (walletStars(rich) !== rich.stars - parkOf(rich).items.length * cheapest.price) problems.push('Park: de spaarpot klopt niet met wat er gekocht is');
  // Moving swaps two tiles, is stored, and loses nothing.
  const last = tiles.length - 1;
  const piece = (p) => (p ? `${p.kind}${p.index}` : '-');
  const before = tiles.map(piece);
  moveInPark(rich, 0, last);
  const after = parkLayout(rich).map(piece);
  if (after[last] !== before[0] || after[0] !== before[last]) problems.push('Park: verplaatsen zet de dingen niet op hun nieuwe plek');
  if (JSON.stringify(before.slice().sort()) !== JSON.stringify(after.slice().sort())) problems.push('Park: verplaatsen laat iets verdwijnen');
  return problems;
}

function deviceReport() {
  const report = [];
  const speech = 'speechSynthesis' in window;
  const dutch = speech && window.speechSynthesis.getVoices().some((v) => v.lang.replace('_', '-').toLowerCase().startsWith('nl'));
  report.push(speech ? `voorlezen: ja${dutch ? ', Nederlandse stem gevonden' : ' (Nederlandse stem nog niet zichtbaar)'}` : 'voorlezen: niet beschikbaar op dit apparaat');
  report.push(window.visualViewport ? 'passend maken boven het toetsenbord: ja' : 'passend maken boven het toetsenbord: niet beschikbaar');
  let storage = false;
  try { localStorage.setItem('reken-app-selftest', '1'); localStorage.removeItem('reken-app-selftest'); storage = true; } catch (e) { storage = false; }
  report.push(storage ? 'voortgang bewaren: ja' : 'voortgang bewaren: LUKT NIET (privémodus?)');
  report.push(`cloud: ${window.Cloud ? window.Cloud.state + (window.Cloud.problem ? ` (${window.Cloud.problem})` : '') : 'niet geladen'}`);
  return report;
}

// Returns { skills, levels, sums, problems: ['Tafel van 6 niveau 2: ...'], device: [...] }.
function runSelfTest() {
  const problems = timeWordsProblems().concat(parkProblems(), tempoProblems());
  let levels = 0;
  let sums = 0;
  const skills = CURRICULUM.skills.filter((s) => s.implemented);
  skills.forEach((skill) => {
    skill.tiers.forEach((tier) => {
      levels += 1;
      let found = null;
      for (let i = 0; i < SELFTEST_SUMS_PER_LEVEL && !found; i++) {
        sums += 1;
        try {
          const exercise = Exercises[skill.exerciseType](tier, skill);
          const problem = exerciseProblem(exercise);
          if (problem) found = `${problem} bij "${exercise.prompt}"`;
        } catch (e) {
          found = `de som kan niet gemaakt worden (${e.message})`;
        }
      }
      if (found) problems.push(`${skill.name}, niveau ${tier.tier}: ${found}`);
    });
  });
  return { skills: skills.length, levels, sums, problems, device: deviceReport() };
}

function selfTestSummary(result) {
  const lines = result.problems.length === 0
    ? [`✓ Alles in orde: ${result.skills} soorten sommen op ${result.levels} niveaus, ${formatNumberNL(result.sums)} sommen gecontroleerd.`]
    : [`✗ ${result.problems.length} probleem/problemen gevonden (maak een foto en stuur hem door):`,
      ...result.problems.slice(0, SELFTEST_MAX_PROBLEMS_SHOWN)];
  return lines.concat(result.device.map((line) => `· ${line}`), `· versie ${APP_VERSION}`);
}
