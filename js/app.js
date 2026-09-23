// Screen flow, session orchestration. Reads CURRICULUM (curriculum/group-6.js),
// uses mastery.js for selection/tracking, exercises/*.js + hints.js for content.

const PROFILE_ID = DEFAULT_PROFILE_ID; // from storage.js
const MAX_HINT_LEVEL = 3;
const SESSION_TARGET_MS = 10 * 60 * 1000;
// Time on one exercise counts for at most this long, so walking away doesn't use up the session.
const MAX_COUNTED_MS_PER_EXERCISE = 90 * 1000;

const PRAISE_FIRST_TRY = ['Goed!', 'Netjes!', 'Yes, die heb je!', 'Knap gedaan!', 'Precies!'];
const PRAISE_WITH_HELP = ['Goed, dat lukte!', 'Mooi, je hebt hem nu!', 'Zo is hij goed!'];
const INVALID_NUMBER_MESSAGE = 'Typ alleen een getal, bijvoorbeeld 4520 of 4.520.';

let appState = null;
let curriculumById = {};
let session = null;
let currentExercise = null;

function el(id) {
  return document.getElementById(id);
}

function showScreen(name) {
  ['screen-start', 'screen-session', 'screen-summary'].forEach((id) => {
    el(id).classList.toggle('hidden', id !== `screen-${name}`);
  });
}

function init() {
  curriculumById = {};
  CURRICULUM.skills.forEach((s) => { curriculumById[s.id] = s; });
  appState = loadState();
  el('start-button').addEventListener('click', startSession);
  el('play-again-button').addEventListener('click', () => showScreen('start'));
  el('submit-button').addEventListener('click', onSubmit);
  el('next-button').addEventListener('click', onNext);
  showScreen('start');
}

function profileSkillStates() {
  return (appState.profiles[PROFILE_ID] && appState.profiles[PROFILE_ID].skills) || {};
}

function currentSkillState(skill) {
  const startTier = personalStartTier(skill, profileSkillStates(), curriculumById);
  return getSkillState(appState, PROFILE_ID, skill, startTier);
}

function tierConfigFor(skill, tier) {
  return skill.tiers.find((t) => t.tier === tier) || skill.tiers[skill.tiers.length - 1];
}

function startSession() {
  appState = loadState(); // pick up a backup restored in another tab since this page loaded
  const selection = selectSessionSkills(CURRICULUM.skills, profileSkillStates());
  const record = startSessionRecord(appState, PROFILE_ID, selection);
  saveState(appState);
  session = {
    record, // the stored log for the parent view, saved after every exercise
    skillIds: selection.map((s) => s.skillId),
    activeMs: 0,
    exerciseCount: 0,
    exerciseStartedAt: null,
    previousSkillId: null,
    followUps: [], // [{ skillId, dueAt }] fresh exercise to check understanding after a shown solution
    followUpQueued: new Set(),
    hintLevel: 0,
    hadMistake: false,
    results: {} // skillId -> { attempts, correctFirstTry }
  };
  showScreen('session');
  updateProgress();
  nextExercise();
}

function nextExercise() {
  const dueIndex = session.followUps.findIndex(
    (f) => f.dueAt <= session.exerciseCount && f.skillId !== session.previousSkillId
  );
  let pick;
  if (dueIndex >= 0) {
    const [followUp] = session.followUps.splice(dueIndex, 1);
    pick = { skillId: followUp.skillId, reason: 'controle na uitleg' };
  } else {
    pick = pickNextSkill(session.skillIds, curriculumById, profileSkillStates(), session.previousSkillId);
  }
  renderExercise(pick);
}

function renderExercise(pick) {
  const skill = curriculumById[pick.skillId];
  const skillState = currentSkillState(skill);
  const tierConfig = tierConfigFor(skill, skillState.tier);

  currentExercise = Exercises[skill.exerciseType](tierConfig, skill);
  currentExercise.pickReason = pick.reason;
  currentExercise.tier = skillState.tier;
  currentExercise.answersGiven = [];
  session.hintLevel = 0;
  session.hadMistake = false;
  session.exerciseStartedAt = Date.now();

  el('exercise-prompt').textContent = currentExercise.prompt;
  el('feedback').textContent = '';
  el('feedback').className = 'feedback';

  const fieldsContainer = el('answer-fields');
  fieldsContainer.innerHTML = '';
  currentExercise.answerFields.forEach((field) => {
    const wrapper = document.createElement('label');
    wrapper.className = 'answer-field';
    if (field.label) {
      const span = document.createElement('span');
      span.textContent = field.label;
      wrapper.appendChild(span);
    }
    // A text field (not type="number") so Dutch notation like 45.230 reaches our own parser.
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.dataset.key = field.key;
    input.className = 'answer-input-field';
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      // Without this, the same Enter press also "clicks" the Volgende button that
      // receives focus on submit, skipping the feedback entirely.
      e.preventDefault();
      onSubmit();
    });
    wrapper.appendChild(input);
    fieldsContainer.appendChild(wrapper);
  });
  el('answer-area').classList.remove('hidden');
  el('next-button').classList.add('hidden');
  // Focus only works once the container is visible, so this must come last.
  fieldsContainer.querySelector('input').focus();
}

function readAnswer() {
  const inputs = el('answer-fields').querySelectorAll('input');
  const values = {};
  let complete = true;
  let valid = true;
  inputs.forEach((input) => {
    if (input.value.trim() === '') {
      complete = false;
      return;
    }
    const n = parseDutchInteger(input.value);
    if (Number.isNaN(n)) valid = false;
    values[input.dataset.key] = n;
  });
  return { values, complete, valid };
}

// "7 rest 5" for two-field answers, "1.459" for one field.
function formatAnswer(values) {
  return currentExercise.answerFields
    .map((field, i) => `${i > 0 && field.label ? field.label + ' ' : ''}${formatNumberNL(values[field.key])}`)
    .join(' ');
}

function isCorrect(values) {
  return Object.keys(currentExercise.correctAnswer).every(
    (key) => values[key] === currentExercise.correctAnswer[key]
  );
}

function onSubmit() {
  const { values, complete, valid } = readAnswer();
  // An empty field or something that isn't a number is not a wrong answer - it shouldn't count against mastery.
  if (!complete) return;
  if (!valid) {
    el('feedback').textContent = INVALID_NUMBER_MESSAGE;
    el('feedback').className = 'feedback feedback-hint';
    clearAnswerFields();
    return;
  }

  currentExercise.answersGiven.push(formatAnswer(values));
  if (isCorrect(values)) {
    concludeExercise(true);
  } else {
    session.hadMistake = true;
    session.hintLevel += 1;
    if (session.hintLevel >= MAX_HINT_LEVEL) {
      concludeExercise(false);
    } else {
      showHint();
    }
  }
}

function showHint() {
  const hintText = getHint(currentExercise.exerciseType, session.hintLevel, currentExercise.hintContext);
  el('feedback').textContent = hintText;
  el('feedback').className = 'feedback feedback-hint';
  clearAnswerFields();
}

function clearAnswerFields() {
  el('answer-fields').querySelectorAll('input').forEach((i) => { i.value = ''; });
  el('answer-fields').querySelector('input').focus();
}

function concludeExercise(solved) {
  const skillId = currentExercise.skillId;
  const skill = curriculumById[skillId];
  const recordedCorrect = solved && !session.hadMistake;

  const spentMs = Date.now() - session.exerciseStartedAt;
  session.activeMs += Math.min(spentMs, MAX_COUNTED_MS_PER_EXERCISE);
  session.exerciseCount += 1;
  session.previousSkillId = skillId;

  const levelChange = recordAnswer(skill, currentSkillState(skill), recordedCorrect);
  session.record.exercises.push({
    at: new Date().toISOString(),
    skillId,
    tier: currentExercise.tier,
    prompt: currentExercise.prompt,
    answers: currentExercise.answersGiven,
    firstTryCorrect: recordedCorrect,
    hintsShown: Math.min(session.hintLevel, MAX_HINT_LEVEL - 1),
    solutionShown: !solved,
    seconds: Math.round(spentMs / 1000),
    reason: currentExercise.pickReason,
    levelChange
  });
  session.record.activeSeconds = Math.round(session.activeMs / 1000);
  saveState(appState);

  if (!session.results[skillId]) session.results[skillId] = { attempts: 0, correctFirstTry: 0 };
  session.results[skillId].attempts += 1;
  if (recordedCorrect) session.results[skillId].correctFirstTry += 1;

  if (!solved && !session.followUpQueued.has(skillId)) {
    // Never got it right, even with hints: check understanding again later with a fresh exercise.
    session.followUpQueued.add(skillId);
    session.followUps.push({ skillId, dueAt: session.exerciseCount + randomInt(2, 4) });
  }

  const feedbackEl = el('feedback');
  if (solved) {
    feedbackEl.textContent = session.hadMistake ? pickRandom(PRAISE_WITH_HELP) : pickRandom(PRAISE_FIRST_TRY);
    feedbackEl.className = 'feedback feedback-correct';
  } else {
    const solution = getHint(currentExercise.exerciseType, MAX_HINT_LEVEL, currentExercise.hintContext);
    feedbackEl.textContent = `Bijna! Zo los je hem op: ${solution}`;
    feedbackEl.className = 'feedback feedback-solution';
  }

  updateProgress();
  el('next-button').textContent = sessionTimeReached() ? 'Klaar!' : 'Volgende';
  el('answer-area').classList.add('hidden');
  el('next-button').classList.remove('hidden');
  el('next-button').focus();
}

function sessionTimeReached() {
  return session.activeMs >= SESSION_TARGET_MS;
}

function updateProgress() {
  const pct = Math.min(100, (session.activeMs / SESSION_TARGET_MS) * 100);
  el('progress-fill').style.width = `${pct}%`;
}

function onNext() {
  if (sessionTimeReached()) {
    showSummary();
  } else {
    nextExercise();
  }
}

function showSummary() {
  const skillIds = Object.keys(session.results);
  let totalAttempts = 0;
  let totalCorrect = 0;
  const strong = [];
  const needsPractice = [];

  skillIds.forEach((skillId) => {
    const r = session.results[skillId];
    totalAttempts += r.attempts;
    totalCorrect += r.correctFirstTry;
    const name = curriculumById[skillId].name;
    if (r.correctFirstTry === r.attempts) {
      strong.push(name);
    } else {
      needsPractice.push(name);
    }
  });

  session.record.completed = true;
  saveState(appState);

  el('summary-score').textContent = `${totalCorrect} van de ${totalAttempts} goed`;
  el('summary-count').textContent = `${totalAttempts} ${totalAttempts === 1 ? 'som' : 'sommen'} gemaakt`;
  renderList('summary-strong', strong, 'Nog geen duidelijk sterke vaardigheden deze keer.');
  renderList('summary-practice', needsPractice, 'Niets om extra te oefenen — sterk gedaan!');

  showScreen('summary');
}

function renderList(elementId, items, emptyText) {
  const container = el(elementId);
  container.innerHTML = '';
  if (items.length === 0) {
    const li = document.createElement('li');
    li.textContent = emptyText;
    li.className = 'empty';
    container.appendChild(li);
    return;
  }
  items.forEach((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    container.appendChild(li);
  });
}

// Another tab (the parent view) changed the saved data, e.g. restored a backup: adopt it
// instead of overwriting it on the next save. A running session's record is kept.
window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE_KEY) return;
  appState = loadState();
  if (session) {
    const same = appState.sessions.find((s) => s.id === session.record.id);
    if (same) session.record = same;
    else appState.sessions.push(session.record);
  }
});

window.addEventListener('DOMContentLoaded', init);
