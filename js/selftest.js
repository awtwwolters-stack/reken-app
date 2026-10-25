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
      if (v.crossable !== undefined && !(isWholeNumber(v.crossable) && v.crossable >= 1 && v.crossable <= total)) return 'weg te tikken stippen kloppen niet';
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
// `tables`: the tafels this child may get (tempoTables).
function tempoSumProblem(sum, tables) {
  const answer = sum.correctAnswer.antwoord;
  const filled = sum.prompt.replace('?', answer);
  const parts = filled.match(/^(\d+) ([×:]) (\d+) = (\d+)$/);
  if (!parts || filled !== sum.solved) return 'de som is niet te lezen';
  const [a, b, c] = [Number(parts[1]), Number(parts[3]), Number(parts[4])];
  if (parts[2] === '×' ? a * b !== c : b * c !== a) return `het antwoord ${answer} klopt niet`;
  // "7 × 6" and "42 : 6 = 7" are both the tafel van 6, times 7.
  const table = b;
  const multiplier = parts[2] === '×' ? a : c;
  if (!tables.includes(table) || !(multiplier >= TEMPO_FACTOR_MIN && multiplier <= tempoMultiplierMax(table))) return 'de som valt buiten de tafels';
  return null;
}

function tempoProblems() {
  const problems = [];
  // A child who hasn't practised the tafels of 11 and 12 yet, and one who has (D21).
  const plain = tempoTables({ skills: {} });
  const early = tempoTables({ skills: { vermenigvuldigen_tafel_12: { tier: TEMPO_EXTRA_FROM_TIER - 1, totalAttempts: 9 } } });
  const withExtra = tempoTables({ skills: { vermenigvuldigen_tafel_11: { tier: TEMPO_EXTRA_FROM_TIER, totalAttempts: 30 }, vermenigvuldigen_tafel_12: { tier: TEMPO_EXTRA_FROM_TIER + 1, totalAttempts: 40 } } });
  if (plain.some((t) => t > TEMPO_FACTOR_MAX) || early.some((t) => t > TEMPO_FACTOR_MAX)) problems.push('Tempo: de tafels van 11 en 12 komen al voordat ze tot × 12 geoefend zijn');
  if (!withExtra.includes(11) || !withExtra.includes(12)) problems.push('Tempo: de tafels van 11 en 12 komen niet na het oefenen');
  [plain, withExtra].forEach((tables) => {
    TEMPO_KINDS.forEach((kind) => {
      let previous = null;
      let found = null;
      for (let i = 0; i < SELFTEST_SUMS_PER_LEVEL && !found; i++) {
        try {
          const sum = tempoSum(kind.id, previous, tables);
          found = tempoSumProblem(sum, tables) || (sum.prompt === previous ? 'dezelfde som twee keer achter elkaar' : null);
          if (found) found += ` bij "${sum.prompt}"`;
          previous = sum.prompt;
        } catch (e) {
          found = `de som kan niet gemaakt worden (${e.message})`;
        }
      }
      if (found) problems.push(`Tempo, ${kind.name}: ${found}`);
    });
  });
  // With 11 and 12 practised, 12 × 12 can come up: the multiplier of those tafels goes to 12.
  let twelveTimesTwelve = false;
  for (let i = 0; i < 3000 && !twelveTimesTwelve; i++) twelveTimesTwelve = tempoSum('tafels', null, withExtra).prompt === '12 × 12 = ?';
  if (!twelveTimesTwelve) problems.push('Tempo: 12 × 12 komt nooit voor');

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

// Combining two iPads' copies of a child and the one-time repairs (js/storage.js, BACKLOG D20), on
// a made-up child. The first case is what happened in October 2026: one iPad was signed out, and
// the child practised on both.
function syncProblems(now = new Date(2026, 9, 25, 12).getTime()) {
  const problems = [];
  const fail = (text) => problems.push(`Samenvoegen: ${text}`);
  const at = (day, hour = 17, minute = 0) => new Date(2026, 9, day, hour, minute).getTime();
  const skill = (tier, attempts, practisedAt, extra = {}) => Object.assign(
    { tier, recentResults: [true], totalAttempts: attempts, lastPracticed: practisedAt, calibrationDone: true, lastTierChange: null }, extra);
  const base = {
    name: 'Test', groep: 6, groepSchoolYear: 2026, stars: 100, weekGoal: 2, practiceDays: ['2026-10-16'],
    skills: { a: skill(2, 20, at(16)), b: skill(1, 10, at(16)) },
    park: { items: [{ id: 'tulp', price: 3, tile: 4 }], animalTiles: { 0: 0 }, storyRead: 3, saveFor: 'reuzenrad' },
    tempo: { tafels: { best: 29, passes: 0, rounds: [{ at: '2026-10-15T16:45:03.000Z', score: 29, wrong: 1 }] } }
  };
  // iPad A, signed in: 39 stars, a level up in a, a bench bought.
  const a = copyData(base);
  a.stars = 139;
  a.practiceDays.push('2026-10-21');
  a.skills.a = skill(3, 51, at(21));
  a.park.items.push({ id: 'bankje', price: 10, tile: 5 });
  // iPad B, signed out with the old copy: 21 stars, a level up in b, a tulip bought (same tile),
  // the first tulip moved, a tempo round.
  const b = copyData(base);
  b.stars = 121;
  b.practiceDays.push('2026-10-22');
  b.skills.b = skill(2, 31, at(22));
  b.park.items[0].tile = 7;
  b.park.items.push({ id: 'tulp', price: 3, tile: 5 });
  b.tempo.tafels = { best: 32, passes: 1, rounds: b.tempo.tafels.rounds.concat({ at: '2026-10-22T16:00:00.000Z', score: 32, wrong: 0 }) };

  // B signs in again and combines with the cloud, which has A's copy.
  const m = mergeProfile(base, b, a);
  if (m.stars !== 160) fail(`${m.stars} sterren in plaats van 160`);
  if ((m.practiceDays || []).join() !== '2026-10-16,2026-10-21,2026-10-22') fail('oefendagen gaan verloren');
  if (m.skills.a.tier !== 3 || m.skills.a.totalAttempts !== 51) fail('wat op de ene iPad geoefend is gaat verloren');
  if (m.skills.b.tier !== 2 || m.skills.b.totalAttempts !== 31) fail('wat op de andere iPad geoefend is gaat verloren');
  if (m.park.items.map((item) => item.id).join() !== 'tulp,bankje,tulp') fail('gekochte dingen gaan verloren');
  if (m.park.items[0].tile !== 7) fail('een verplaatst ding staat weer op de oude plek');
  if (walletStars(m) !== 160 - 16) fail('de spaarpot klopt niet');
  if (parkLayout(m).filter(Boolean).length !== m.park.items.length + animalsInPark(m)) fail('in het park heeft niet alles een plek');
  if (m.tempo.tafels.rounds.length !== 2 || m.tempo.tafels.best !== 32 || m.tempo.tafels.passes !== 1) fail('tempo-rondes gaan verloren');
  const other = mergeProfile(base, a, b);
  if (other.stars !== 160 || other.skills.a.tier !== 3 || other.skills.b.tier !== 2 || other.park.items.length !== 3) fail('het maakt uit welke iPad eerst is');
  if (!sameData(mergeProfile(base, m, m), m)) fail('nog een keer samenvoegen verandert iets');
  if (!sameData(mergeProfile(base, base, a), a) || !sameData(mergeProfile(base, b, base), b)) fail('een kant zonder wijzigingen telt toch mee');

  // Both iPads practised the same skill: the latest level, every sum counted.
  const c = copyData(base);
  c.skills.a = skill(3, 25, at(21));
  const d = copyData(base);
  d.skills.a = skill(1, 28, at(22));
  const both = mergeProfile(base, c, d).skills.a;
  if (both.tier !== 1 || both.totalAttempts !== 33) fail(`dezelfde vaardigheid op twee iPads: niveau ${both.tier}, ${both.totalAttempts} sommen`);

  // A restored backup wins whole, even though it has fewer stars.
  const restored = Object.assign(copyData(base), { stars: 50, restoredAt: at(23) });
  if (mergeProfile(base, b, restored).stars !== 50 || mergeProfile(base, restored, a).stars !== 50) fail('een teruggezette back-up wordt weer overschreven');

  // No common start (an iPad's first sign-in): the most stars, per skill the copy with most sums.
  const first = mergeProfile(null, a, b);
  if (first.stars !== 139 || first.skills.a.tier !== 3 || first.skills.b.tier !== 2) fail('de eerste keer inloggen voegt niet goed samen');

  // Coming in while the child practises: the same skill objects, with the new content.
  const target = copyData(base);
  const held = target.skills.a;
  replaceProfileInPlace(target, m);
  if (target.skills.a !== held || held.tier !== 3 || target.stars !== 160) fail('bijwerken tijdens het oefenen vervangt de vaardigheid');
  const state = { profiles: { p: copyData(b) }, sessions: [] };
  applyRemoteChange(state, { kind: 'profile', id: 'p', data: copyData(a), base: copyData(base) });
  if (state.profiles.p.stars !== 160) fail('een wijziging van een andere iPad wordt niet samengevoegd');
  const unchanged = { profiles: { p: copyData(base) }, sessions: [] };
  applyRemoteChange(unchanged, { kind: 'profile', id: 'p', data: copyData(a), base: copyData(base) });
  if (!sameData(unchanged.profiles.p, a)) fail('een iPad zonder eigen wijzigingen neemt de cloud niet over');

  // A fresh iPad has every conversion done, so cloud data is never converted twice.
  const fresh = freshState();
  if (!MIGRATIONS.every((name) => fresh.migrations[name] === true)) fail('een nieuwe iPad zet niveaus nog een keer om');
  const converted = migrateState({ profiles: { p: { skills: { optellen_tot_100000: skill(4, 5, at(16)) } } }, sessions: [], migrations: fresh.migrations });
  if (converted.profiles.p.skills.optellen_tot_100000.tier !== 4) fail('een nieuwe iPad verhoogt een niveau');

  // Repair 1: a finished session the child's progress lost. 30 solved, 1 shown, 1 level up: 38 stars.
  const record = {
    id: 1, profileId: 'p', completed: true,
    exercises: Array.from({ length: 31 }, (_, i) => ({
      at: new Date(at(21, 17, i)).toISOString(), skillId: 'a', solutionShown: i === 0,
      levelChange: i === 30 ? 'niveau 2 → 3: laatste 8 antwoorden 100% goed, vlot' : null
    }))
  };
  const fixed = repairProfile(copyData(base), [record], now);
  if (!fixed || fixed.stars !== 138 || !fixed.practiceDays.includes('2026-10-21') || fixed.skills.a.totalAttempts !== 31) {
    fail(`een verloren sessie wordt niet goed hersteld (${fixed ? `${fixed.stars} sterren` : 'niets'})`);
  }
  if (fixed && repairProfile(fixed, [record], now)) fail('een verloren sessie wordt twee keer hersteld');
  const later = Object.assign(copyData(record), { exercises: record.exercises.map((e) => Object.assign({}, e, { at: e.at.replace('2026-10-21', '2026-10-27') })) });
  if (repairProfile(copyData(base), [later], now + 3 * 86400000)) fail('een sessie van na deze versie telt als verloren');
  const midnight = Object.assign(copyData(record), { exercises: [Object.assign({}, record.exercises[0], { at: new Date(2026, 9, 20, 23, 58).toISOString() })] });
  if (repairProfile(Object.assign(copyData(base), { practiceDays: ['2026-10-16', '2026-10-21'] }), [midnight], now)) fail('een sessie over middernacht telt als verloren');

  // Repair 2: a minus level converted twice (3 before the conversion, 5 now; 4 is right).
  const twice = { skills: { aftrekken_tot_100000: skill(5, 4, at(16), { lastTierChange: { at: new Date(2026, 8, 24).getTime(), from: 4, to: 3, reason: 'test' } }) } };
  const lowered = repairProfile(twice, [], now);
  if (!lowered || lowered.skills.aftrekken_tot_100000.tier !== 4) fail('een twee keer omgezet niveau wordt niet hersteld');
  if (lowered && repairProfile(lowered, [], now)) fail('een niveau wordt twee keer hersteld');
  const once = copyData(twice);
  once.skills.aftrekken_tot_100000.tier = 4;
  if (repairProfile(once, [], now)) fail('een goed niveau wordt verlaagd');
  return problems;
}

// Minsommen tot 20 (D22): level 2 shows the starting dots to tap away, the full picture as the first
// hint; every level has the tip for typing the starting number.
function minusProblems() {
  const problems = [];
  const skill = CURRICULUM.skills.find((s) => s.id === 'min_tot_20');
  if (!skill) return ['Minsommen: staan niet in het curriculum'];
  skill.tiers.forEach((tier) => {
    for (let i = 0; i < 50; i++) {
      const ex = Exercises.min_tot_20(tier, skill);
      const [a, b] = ex.prompt.match(/\d+/g).map(Number);
      const fail = (text) => problems.push(`Minsommen niveau ${tier.tier}: ${text} bij "${ex.prompt}"`);
      if (!ex.startNumberTip || ex.startNumberTip.value !== a || !ex.startNumberTip.text.includes(`${b} `)) { fail('de tip voor het begingetal klopt niet'); break; }
      if (tier.dots === 'cross') {
        const shown = ex.visual && ex.visual.parts;
        if (!shown || shown.length !== 1 || shown[0].count !== a || shown[0].kind !== 'a' || ex.visual.crossable !== b) { fail('niet de beginstippen om weg te tikken'); break; }
        if (!ex.hintVisual || !ex.hintVisual.parts.some((p) => p.kind === 'gone' && p.count === b)) { fail('de hint toont niet het hele plaatje'); break; }
        if (!ex.speech.includes(`Tik ${b} `)) { fail('voorlezen zegt niet hoeveel weg te tikken'); break; }
      } else if (ex.visual && ex.visual.crossable) { fail('stippen om weg te tikken op het verkeerde niveau'); break; }
    }
  });
  if (!skill.tiers.some((t) => t.dots === 'cross')) problems.push('Minsommen: er is geen niveau met wegstrepen');
  return problems;
}

// The tafels of 11 and 12 (D21) only while the tafels 6-9 go well, also after they have started.
function extraTafelProblems() {
  const problems = [];
  const skill = CURRICULUM.skills.find((s) => s.id === 'vermenigvuldigen_tafel_12');
  if (!skill) return ['Tafel van 12: staat niet in het curriculum'];
  const state = (results, attempts = 20) => ({ tier: 2, recentResults: results, totalAttempts: attempts, lastPracticed: Date.now(), calibrationDone: true, lastTierChange: null });
  const good = Array(8).fill(true);
  const shaky = [true, false, true, false, true, true, false, true]; // 63%: not "clearly struggling", not going well
  const prereqs = (seven) => ({ vermenigvuldigen_tafel_6: state(good), vermenigvuldigen_tafel_7: seven, vermenigvuldigen_tafel_8: state(good), vermenigvuldigen_tafel_9: state(good) });
  const fresh = state([], 0);
  const started = state(good);
  if (classifySkill(skill, fresh, prereqs(state(good))).bucket !== 'nieuw') problems.push('Tafel van 12: komt niet als de tafels 6 t/m 9 goed gaan');
  if (classifySkill(skill, fresh, prereqs(state(shaky))).bucket !== 'later') problems.push('Tafel van 12: komt al terwijl de tafel van 7 nog niet goed gaat');
  if (classifySkill(skill, started, prereqs(state(shaky))).bucket !== 'later') problems.push('Tafel van 12: gaat door terwijl de tafel van 7 niet meer goed gaat');
  if (classifySkill(skill, fresh, prereqs(undefined)).bucket !== 'later') problems.push('Tafel van 12: komt al zonder de tafel van 7 geoefend te hebben');
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
  const problems = timeWordsProblems().concat(parkProblems(), tempoProblems(), syncProblems(), extraTafelProblems(), minusProblems());
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
