// Screen flow, session orchestration. Reads CURRICULUM (curriculum/group-6.js),
// uses mastery.js for selection/tracking, exercises/*.js + hints.js for content.

const PROFILE_ID = DEFAULT_PROFILE_ID; // from storage.js
const SESSION_SIZE = 12;
const MAX_HINT_LEVEL = 3;

const PRAISE_FIRST_TRY = ['Goed!', 'Netjes!', 'Yes, die heb je!', 'Knap gedaan!', 'Precies!'];
const PRAISE_WITH_HELP = ['Goed, dat lukte!', 'Mooi, je hebt hem nu!', 'Zo is hij goed!'];

let appState = null;
let curriculumById = {};
let session = null; // { plan: [{skillId, reason}], index, hintLevel, hadMistake, followUpQueued: Set, results: {} }

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

function tierConfigFor(skill, tier) {
  return skill.tiers.find((t) => t.tier === tier) || skill.tiers[0];
}

function currentSkillState(skillId) {
  return getSkillState(appState, PROFILE_ID, skillId);
}

function startSession() {
  const profileSkills = (appState.profiles[PROFILE_ID] && appState.profiles[PROFILE_ID].skills) || {};
  const plan = selectSession(CURRICULUM.skills, profileSkills, SESSION_SIZE);
  session = {
    plan,
    index: 0,
    hintLevel: 0,
    hadMistake: false,
    followUpQueued: new Set(),
    results: {} // skillId -> { attempts, correctFirstTry }
  };
  showScreen('session');
  renderExercise();
}

let currentExercise = null;

function renderExercise() {
  const item = session.plan[session.index];
  const skill = curriculumById[item.skillId];
  const skillState = currentSkillState(item.skillId);
  const tierConfig = tierConfigFor(skill, skillState.tier);

  currentExercise = Exercises[skill.exerciseType](tierConfig, skill);
  session.hintLevel = 0;
  session.hadMistake = false;

  el('progress-label').textContent = `Vraag ${session.index + 1} van ${session.plan.length}`;
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
    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'numeric';
    input.dataset.key = field.key;
    input.className = 'answer-input-field';
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') onSubmit();
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
  inputs.forEach((input) => {
    if (input.value.trim() === '') complete = false;
    values[input.dataset.key] = Number(input.value);
  });
  return { values, complete };
}

function isCorrect(values) {
  return Object.keys(currentExercise.correctAnswer).every(
    (key) => values[key] === currentExercise.correctAnswer[key]
  );
}

function onSubmit() {
  const { values, complete } = readAnswer();
  // An empty field is not a wrong answer - it shouldn't count against mastery.
  if (!complete || Object.values(values).some((v) => Number.isNaN(v))) return;

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
  el('answer-fields').querySelectorAll('input').forEach((i) => { i.value = ''; });
  el('answer-fields').querySelector('input').focus();
}

function concludeExercise(solved) {
  const skillId = currentExercise.skillId;
  const recordedCorrect = solved && !session.hadMistake;

  const skillState = currentSkillState(skillId);
  const { reason } = recordAnswer(skillState, recordedCorrect);
  saveState(appState);

  if (!session.results[skillId]) session.results[skillId] = { attempts: 0, correctFirstTry: 0 };
  session.results[skillId].attempts += 1;
  if (recordedCorrect) session.results[skillId].correctFirstTry += 1;

  if (!recordedCorrect && !solved && !session.followUpQueued.has(skillId)) {
    // Never got it right, even with hints: check understanding again later with a fresh exercise.
    session.followUpQueued.add(skillId);
    const insertAt = Math.min(session.index + 1 + randomInt(2, 4), session.plan.length);
    session.plan.splice(insertAt, 0, { skillId, reason: 'controle na uitleg' });
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

  el('answer-area').classList.add('hidden');
  el('next-button').classList.remove('hidden');
  el('next-button').focus();

  if (reason) {
    // Tier changed - not shown to the child, but useful for the parent view via storage.
  }
}

function onNext() {
  session.index += 1;
  if (session.index >= session.plan.length) {
    showSummary();
  } else {
    renderExercise();
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

  recordSession(appState, PROFILE_ID, { totalAttempts, totalCorrect });
  saveState(appState);

  el('summary-score').textContent = `${totalCorrect} van de ${totalAttempts} goed`;
  el('summary-count').textContent = `${totalAttempts} sommen gemaakt`;
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

window.addEventListener('DOMContentLoaded', init);
