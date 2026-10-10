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
    // The last hint is the worked solution: the right answer has to be in it.
    if (level === 3 && !answers.every((value) => namesNumber(hint, value))) {
      return `de uitleg noemt het goede antwoord niet ("${hint}")`;
    }
  }
  return pictureProblem(exercise.visual) || pictureProblem(exercise.hintVisual);
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
  const problems = [];
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
