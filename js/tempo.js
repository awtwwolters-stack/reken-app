// Tempo-ronde: the tafels against the clock, apart from the normal session (BACKLOG D19). The form
// is the tempotoets of De Wereld in Getallen: 2 opgaven of 1 minute each, the score is the total
// number right. The child plays against their own record; there is no pass mark and no "failed".
// Only rules live here (no screen), so the self-check (js/selftest.js) can verify them.

const TEMPO_ROUND_MS = 60 * 1000;
const TEMPO_ROUNDS = 2;
// From this groep the Tempo-ronde is offered (the tafels t/m 10 are known by mid groep 5), and
// from this groep every kind is open at once.
const TEMPO_MIN_GROEP = 5;
const TEMPO_ALL_OPEN_GROEP = 6;
// Below that groep the next kind opens after this score, this many times, in the kind before it.
// 30 is a first estimate: the method suggests about 40 in 2 minutes on paper, and typing on an
// iPad is slower than writing. To be tuned on the children's first rounds.
const TEMPO_UNLOCK_SCORE = 30;
const TEMPO_UNLOCK_TIMES = 2;
// Small and fixed, so the normal session stays the best way to save for the park. A record only
// counts from the second round of a kind on: the first round sets it.
const TEMPO_STARS = { done: 3, record: 5 };
// The method: an automatised sum takes 3 to 5 seconds.
const TEMPO_SLOW_MS = 5000;
const TEMPO_MAX_MISSES = 3;
const TEMPO_KEPT_ROUNDS = 20;
// The tafels of 2 to 10, times 2 to 10: × 1 is no test of a tafel.
const TEMPO_FACTOR_MIN = 2;
const TEMPO_FACTOR_MAX = 10;
// The extra tafels of 11 and 12 (BACKLOG D21) join once the child practises them up to × 12 in the
// normal session (that level), so no child gets a sum against the clock before learning it.
const TEMPO_EXTRA_TABLES = [11, 12];
const TEMPO_EXTRA_FACTOR_MAX = 12;
const TEMPO_EXTRA_FROM_TIER = 3;

const TEMPO_FORMS = ['tafels', 'omgekeerd', 'deeltafels'];
// In the order they open.
const TEMPO_KINDS = [
  { id: 'tafels', name: 'Tafels', example: '7 × 6 = ?' },
  { id: 'omgekeerd', name: 'Omgekeerd', example: '? × 6 = 42' },
  { id: 'deeltafels', name: 'Deeltafels', example: '42 : 6 = ?' },
  { id: 'mix', name: 'Door elkaar', example: 'alles door elkaar' }
];

function offersTempo(profile) {
  return canPractise(profile) && practiceGroep(profile) >= TEMPO_MIN_GROEP;
}

// The tafels this child gets in a Tempo-ronde: 2 to 10, and 11 and 12 once practised up to × 12.
function tempoTables(profile) {
  const skills = (profile && profile.skills) || {};
  const tables = [];
  for (let t = TEMPO_FACTOR_MIN; t <= TEMPO_FACTOR_MAX; t++) tables.push(t);
  TEMPO_EXTRA_TABLES.forEach((t) => {
    const skill = skills[`vermenigvuldigen_tafel_${t}`];
    if (skill && skill.tier >= TEMPO_EXTRA_FROM_TIER) tables.push(t);
  });
  return tables;
}

function tempoMultiplierMax(table) {
  return TEMPO_EXTRA_TABLES.includes(table) ? TEMPO_EXTRA_FACTOR_MAX : TEMPO_FACTOR_MAX;
}

// One sum of this kind from these tafels, written as in the normal session (js/exercises/tafel.js
// and delen_zonder_rest.js), and never the same sum twice in a row.
function tempoSum(kindId, previousPrompt, tables = tempoTables(null)) {
  let sum;
  do {
    const form = kindId === 'mix' ? pickRandom(TEMPO_FORMS) : kindId;
    const table = pickRandom(tables);
    const multiplier = randomInt(TEMPO_FACTOR_MIN, tempoMultiplierMax(table));
    const product = table * multiplier;
    const [prompt, answer] = {
      tafels: [`${multiplier} × ${table} = ?`, product],
      omgekeerd: [`? × ${table} = ${product}`, multiplier],
      deeltafels: [`${product} : ${table} = ?`, multiplier]
    }[form];
    sum = {
      prompt,
      answerFields: [{ key: 'antwoord', label: null }],
      correctAnswer: { antwoord: answer },
      solved: prompt.replace('?', answer) // for the result screen: "7 × 6 = 42"
    };
  } while (sum.prompt === previousPrompt);
  return sum;
}

function tempoEntry(profile, kindId) {
  return (profile.tempo && profile.tempo[kindId]) || { best: 0, passes: 0, rounds: [] };
}

// Every kind with the child's record and whether it is open; a closed one says what opens it.
function tempoKindsFor(profile) {
  const allOpen = practiceGroep(profile) >= TEMPO_ALL_OPEN_GROEP;
  return TEMPO_KINDS.map((kind, i) => {
    const entry = tempoEntry(profile, kind.id);
    const before = i > 0 ? TEMPO_KINDS[i - 1] : null;
    const passes = before ? tempoEntry(profile, before.id).passes : 0;
    // A kind that was played stays open (e.g. after the parent corrects the groep downwards).
    const open = allOpen || !before || passes >= TEMPO_UNLOCK_TIMES || entry.rounds.length > 0;
    return {
      kind,
      open,
      best: entry.rounds.length ? entry.best : null,
      lockText: open ? null
        : `Haal ${TEMPO_UNLOCK_TIMES} keer ${TEMPO_UNLOCK_SCORE} bij ${before.name}${passes ? ` (${passes} van de ${TEMPO_UNLOCK_TIMES})` : ''}`
    };
  });
}

// A finished Tempo-ronde: keeps the record and the latest scores on the child's profile (so they
// travel to the other iPads with it) and pays the stars. `wrong` is the number of wrong answers.
function recordTempoRound(profile, kindId, score, wrong, at = new Date()) {
  profile.tempo = profile.tempo || {};
  const entry = profile.tempo[kindId] || (profile.tempo[kindId] = { best: 0, passes: 0, rounds: [] });
  const first = entry.rounds.length === 0;
  const previousBest = entry.best;
  const isRecord = !first && score > previousBest;
  entry.best = Math.max(previousBest, score);
  if (score >= TEMPO_UNLOCK_SCORE) entry.passes += 1;
  entry.rounds.push({ at: at.toISOString(), score, wrong });
  if (entry.rounds.length > TEMPO_KEPT_ROUNDS) entry.rounds.splice(0, entry.rounds.length - TEMPO_KEPT_ROUNDS);
  // Nothing right (the iPad was left lying) earns nothing.
  const stars = score > 0 ? TEMPO_STARS.done + (isRecord ? TEMPO_STARS.record : 0) : 0;
  profile.stars = (profile.stars || 0) + stars;
  return { first, isRecord, previousBest, stars };
}

// The sums worth a second look, as "7 × 8 = 56": the wrong ones first, then the slowest right
// ones. `answers`: [{ solved, correct, ms }].
function tempoMisses(answers) {
  const wrong = answers.filter((a) => !a.correct);
  const slow = answers.filter((a) => a.correct && a.ms > TEMPO_SLOW_MS).sort((a, b) => b.ms - a.ms);
  return [...new Set(wrong.concat(slow).map((a) => a.solved))].slice(0, TEMPO_MAX_MISSES);
}
