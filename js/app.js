// Screen flow, session orchestration. Reads CURRICULUM (curriculum/group-6.js),
// uses mastery.js for selection/tracking, exercises/*.js + hints.js for content.

const MAX_HINT_LEVEL = 3;
const SESSION_TARGET_MS = 10 * 60 * 1000;
// Time on one exercise counts for at most this long, so walking away doesn't use up the session.
const MAX_COUNTED_MS_PER_EXERCISE = 90 * 1000;
// A category counts as "Sterk" in the summary when at least this share was right the first time.
const SUMMARY_STRONG_RATE = 0.8;

const PRAISE_FIRST_TRY = ['Goed!', 'Netjes!', 'Yes, die heb je!', 'Knap gedaan!', 'Precies!'];
const PRAISE_WITH_HELP = ['Goed, dat lukte!', 'Mooi, je hebt hem nu!', 'Zo is hij goed!'];
const INVALID_NUMBER_MESSAGE = 'Typ alleen een getal, bijvoorbeeld 4520 of 4.520.';
const INVALID_FRACTION_MESSAGE = 'Typ boven de streep een getal en onder de streep een getal.';

let appState = null;
let curriculumById = {};
let session = null;
let currentExercise = null;
let activeProfileId = null;

const SCREENS = ['profiles', 'start', 'soon', 'setup', 'session', 'summary'];

function el(id) {
  return document.getElementById(id);
}

function showScreen(name) {
  SCREENS.forEach((screen) => {
    el(`screen-${screen}`).classList.toggle('hidden', screen !== name);
  });
}

function init() {
  curriculumById = {};
  CURRICULUM.skills.forEach((s) => { curriculumById[s.id] = s; });
  appState = loadState();
  el('start-button').addEventListener('click', startSession);
  el('play-again-button').addEventListener('click', showGreeting);
  el('submit-button').addEventListener('click', onSubmit);
  el('next-button').addEventListener('click', onNext);
  el('switch-profile-button').addEventListener('click', showProfiles);
  el('summary-switch-button').addEventListener('click', showProfiles);
  el('soon-back-button').addEventListener('click', showProfiles);
  el('open-setup-button').addEventListener('click', () => showSetup(null));
  el('setup-back-button').addEventListener('click', showProfiles);
  el('profile-birthdate').addEventListener('change', onBirthdateChange);
  el('profile-form').addEventListener('submit', onProfileFormSubmit);
  showProfiles();
}

function activeProfile() {
  return appState.profiles[activeProfileId];
}

function profileSkillStates() {
  return (activeProfile() && activeProfile().skills) || {};
}

function currentSkillState(skill) {
  const startTier = personalStartTier(skill, profileSkillStates(), curriculumById, groepOffset(activeProfile()));
  return getSkillState(appState, activeProfileId, skill, startTier);
}

// "Wie gaat er rekenen?" - shown every time, so on a shared iPad nobody practises on a sibling's profile.
function showProfiles() {
  appState = loadState();
  const profiles = listProfiles(appState);
  const container = el('profile-buttons');
  container.innerHTML = '';
  profiles.forEach(({ id, profile }) => {
    const button = document.createElement('button');
    button.className = 'big-button profile-button';
    button.type = 'button';
    button.textContent = profile.name;
    button.addEventListener('click', () => selectProfile(id));
    container.appendChild(button);
  });
  el('no-profiles').classList.toggle('hidden', profiles.length > 0);
  showScreen('profiles');
}

function selectProfile(id) {
  activeProfileId = id;
  appState.lastProfileId = id;
  saveState(appState);
  if (canPractise(activeProfile())) {
    showGreeting();
  } else {
    el('soon-greeting').textContent = `Hoi ${activeProfile().name}!`;
    showScreen('soon');
  }
}

function showGreeting() {
  const profile = activeProfile();
  el('greeting').textContent = `Hoi ${profile.name}! Klaar om te rekenen?`;
  el('groep-banner').classList.toggle('hidden', profile.groep === GROEP_WITH_CONTENT);
  renderWeek(el('week-dots'), el('week-message'), profile);
  el('star-total').textContent = `★ ${profile.stars || 0} sterren`;
  const weeks = weeksInARow(profile);
  el('weeks-in-row').textContent = `${weeks} weken op rij je weekdoel gehaald!`;
  el('weeks-in-row').classList.toggle('hidden', weeks < 2);
  showScreen('start');
}

function renderWeek(dotsEl, messageEl, profile) {
  dotsEl.innerHTML = '';
  weekDots(profile).forEach((day) => {
    const dot = document.createElement('div');
    dot.className = `week-dot${day.done ? ' done' : ''}${day.today ? ' today' : ''}`;
    dot.appendChild(Object.assign(document.createElement('span'), { className: 'dot' }));
    dot.appendChild(Object.assign(document.createElement('span'), { className: 'day', textContent: day.label }));
    dotsEl.appendChild(dot);
  });
  messageEl.textContent = weekGoalMessage(profile);
}

// Parent setup: add or edit a child. The groep is estimated from the birth date and confirmed.
function showSetup(profileId) {
  const list = el('setup-list');
  list.innerHTML = '';
  listProfiles(appState).forEach(({ id, profile }) => {
    const item = document.createElement('li');
    item.appendChild(document.createTextNode(`${profile.name} (${profile.groep ? `groep ${profile.groep}` : 'nog niet op school'}) `));
    const edit = Object.assign(document.createElement('button'), { type: 'button', className: 'link-button', textContent: 'wijzig' });
    edit.addEventListener('click', () => showSetup(id));
    item.appendChild(edit);
    list.appendChild(item);
  });

  const profile = profileId ? appState.profiles[profileId] : null;
  el('profile-form-title').textContent = profile ? `${profile.name} wijzigen` : 'Kind toevoegen';
  el('profile-id').value = profileId || '';
  el('profile-name').value = profile ? profile.name : '';
  el('profile-birthdate').value = profile ? profile.birthDate : '';
  el('profile-groep').value = String(profile ? profile.groep : GROEP_WITH_CONTENT);
  el('profile-weekgoal').value = String(profile ? profile.weekGoal : DEFAULT_WEEK_GOAL);
  el('profile-groep6').checked = profile ? !!profile.groep6Content : true;
  el('groep-note').textContent = profile && isAutumnChild(profile.birthDate) ? autumnNote(profile.groep) : '';
  el('profile-form-error').textContent = '';
  showScreen('setup');
}

function autumnNote(groep) {
  return `Jarig in oktober-december: dan zitten kinderen soms een groep hoger of lager. Klopt groep ${groep}?`;
}

function onBirthdateChange() {
  const birthDate = el('profile-birthdate').value;
  if (!birthDate) return;
  const groep = Math.max(0, Math.min(8, estimateGroep(birthDate)));
  el('profile-groep').value = String(groep);
  el('groep-note').textContent = isAutumnChild(birthDate) ? autumnNote(groep) : 'Geschat op basis van de geboortedatum. Pas aan als het niet klopt.';
  if (!el('profile-id').value) el('profile-groep6').checked = groep >= 3; // kleuters can't read the sums yet
}

function onProfileFormSubmit(e) {
  e.preventDefault();
  const name = el('profile-name').value.trim();
  const birthDate = el('profile-birthdate').value;
  if (!name || !birthDate) {
    el('profile-form-error').textContent = 'Vul een naam en een geboortedatum in.';
    return;
  }
  appState = loadState();
  saveProfile(appState, el('profile-id').value || null, {
    name,
    birthDate,
    groep: Number(el('profile-groep').value),
    weekGoal: Number(el('profile-weekgoal').value),
    groep6Content: el('profile-groep6').checked
  });
  saveState(appState);
  showProfiles();
}

function tierConfigFor(skill, tier) {
  return skill.tiers.find((t) => t.tier === tier) || skill.tiers[skill.tiers.length - 1];
}

function startSession() {
  appState = loadState(); // pick up a backup restored in another tab since this page loaded
  const selection = selectSessionSkills(CURRICULUM.skills, profileSkillStates());
  const record = startSessionRecord(appState, activeProfileId, selection);
  saveState(appState);
  session = {
    record, // the stored log for the parent view, saved after every exercise
    starsAtStart: activeProfile().stars || 0,
    starsEarned: 0,
    levelUps: [], // category names, for "Niveau omhoog: Tafels!"
    solvedWithHelp: 0,
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

  renderPrompt(currentExercise);
  renderVisual(currentExercise.visual);
  el('feedback').textContent = '';
  el('feedback').className = 'feedback';

  const fieldsContainer = el('answer-fields');
  fieldsContainer.innerHTML = '';
  const isFraction = currentExercise.answerLayout === 'fraction';
  fieldsContainer.classList.toggle('fraction', isFraction);
  currentExercise.answerFields.forEach((field, index) => {
    if (isFraction && index === 1) fieldsContainer.appendChild(Object.assign(document.createElement('div'), { className: 'breukstreep' }));
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
    if (isFraction) input.setAttribute('aria-label', field.key); // teller / noemer
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      // Without this, the same Enter press also "clicks" the Volgende button that
      // receives focus on submit, skipping the feedback entirely.
      e.preventDefault();
      // In a two-field answer, Enter in the first field moves on to the empty second one.
      const inputs = [...fieldsContainer.querySelectorAll('input')];
      const next = inputs[inputs.indexOf(input) + 1];
      if (next && next.value.trim() === '' && !input.value.includes('/')) {
        next.focus();
        return;
      }
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

// A question may come in parts so fractions show stacked (like in the rekenschrift):
// ['text', { fraction: [1, 4] }, 'more text'].
function renderPrompt(exercise) {
  const promptEl = el('exercise-prompt');
  if (!exercise.promptParts) {
    promptEl.textContent = exercise.prompt;
    return;
  }
  promptEl.textContent = '';
  exercise.promptParts.forEach((part) => {
    if (typeof part === 'string') {
      promptEl.appendChild(document.createTextNode(part));
      return;
    }
    const [teller, noemer] = part.fraction;
    const fraction = document.createElement('span');
    fraction.className = 'fraction';
    fraction.setAttribute('aria-label', `${teller}/${noemer}`);
    fraction.appendChild(Object.assign(document.createElement('span'), { className: 'teller', textContent: String(teller) }));
    fraction.appendChild(Object.assign(document.createElement('span'), { className: 'noemer', textContent: String(noemer) }));
    promptEl.appendChild(fraction);
  });
}

const SVG_NS = 'http://www.w3.org/2000/svg';

// A strook (bar) split into equal parts, the first `coloured` parts filled - the classroom breukenkast.
function renderVisual(visual) {
  const container = el('exercise-visual');
  container.innerHTML = '';
  container.classList.toggle('hidden', !visual);
  if (!visual || visual.type !== 'strook') return;

  const width = 320;
  const height = 56;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `-2 -2 ${width + 4} ${height + 4}`);
  svg.setAttribute('class', 'strook');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Strook in ${visual.parts} gelijke stukken, ${visual.coloured} gekleurd`);
  const partWidth = width / visual.parts;
  for (let i = 0; i < visual.parts; i++) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', i * partWidth);
    rect.setAttribute('y', 0);
    rect.setAttribute('width', partWidth);
    rect.setAttribute('height', height);
    rect.setAttribute('class', i < visual.coloured ? 'strook-part coloured' : 'strook-part');
    svg.appendChild(rect);
  }
  container.appendChild(svg);
}

function readAnswer() {
  const inputs = el('answer-fields').querySelectorAll('input');
  // A child used to writing "5/8" may type the whole fraction in the teller box.
  const typedFraction = currentExercise.answerLayout === 'fraction'
    && inputs[1].value.trim() === ''
    && inputs[0].value.match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
  if (typedFraction) {
    return { values: { teller: Number(typedFraction[1]), noemer: Number(typedFraction[2]) }, complete: true, valid: true };
  }
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
  if (currentExercise.answerLayout === 'fraction') return `${values.teller}/${values.noemer}`;
  return currentExercise.answerFields
    .map((field, i) => `${i > 0 && field.label ? field.label + ' ' : ''}${formatNumberNL(values[field.key])}`)
    .join(' ');
}

function isCorrect(values) {
  // An exercise can bring its own check, e.g. fractions where 1/2 and 2/4 are both right.
  if (currentExercise.checkAnswer) return currentExercise.checkAnswer(values);
  return Object.keys(currentExercise.correctAnswer).every(
    (key) => values[key] === currentExercise.correctAnswer[key]
  );
}

function onSubmit() {
  const { values, complete, valid } = readAnswer();
  // An empty field or something that isn't a number is not a wrong answer - it shouldn't count against mastery.
  if (!complete) return;
  if (!valid) {
    el('feedback').textContent = currentExercise.answerLayout === 'fraction' ? INVALID_FRACTION_MESSAGE : INVALID_NUMBER_MESSAGE;
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

  const skillState = currentSkillState(skill);
  const levelChange = recordAnswer(skill, skillState, recordedCorrect);
  if (skillState.tier > currentExercise.tier) session.levelUps.push(skill.category);
  // A star for every sum finished correctly, also after a hint: getting there counts.
  if (solved) {
    activeProfile().stars = (activeProfile().stars || 0) + 1;
    session.starsEarned += 1;
    if (session.hadMistake) session.solvedWithHelp += 1;
  }
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
    const praise = session.hadMistake ? pickRandom(PRAISE_WITH_HELP) : pickRandom(PRAISE_FIRST_TRY);
    feedbackEl.textContent = `${praise}  +1 ★`;
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
  // A double tap on "Klaar!" must not pay out the session bonus twice.
  if (session.record.completed) return;
  let totalAttempts = 0;
  let totalCorrect = 0;
  const byCategory = {}; // "Tafels" -> { attempts, correctFirstTry }, instead of one line per times table
  Object.entries(session.results).forEach(([skillId, r]) => {
    totalAttempts += r.attempts;
    totalCorrect += r.correctFirstTry;
    const category = curriculumById[skillId].category;
    if (!byCategory[category]) byCategory[category] = { attempts: 0, correctFirstTry: 0 };
    byCategory[category].attempts += r.attempts;
    byCategory[category].correctFirstTry += r.correctFirstTry;
  });

  const strong = [];
  const needsPractice = [];
  Object.entries(byCategory).forEach(([category, r]) => {
    (r.correctFirstTry / r.attempts >= SUMMARY_STRONG_RATE ? strong : needsPractice).push(category);
  });

  const profile = activeProfile();
  const celebrations = [];
  let bonus = STAR_BONUS.sessionDone;
  [...new Set(session.levelUps)].forEach((category) => celebrations.push(`Niveau omhoog: ${category}!`));
  bonus += session.levelUps.length * STAR_BONUS.levelUp;
  if (recordPracticeDay(profile)) {
    bonus += STAR_BONUS.weekGoal;
    celebrations.push(`Weekdoel gehaald! +${STAR_BONUS.weekGoal} ★`);
  }
  profile.stars = (profile.stars || 0) + bonus;
  const milestone = milestoneReached(session.starsAtStart, profile.stars);
  if (milestone) celebrations.push(`★ Mijlpaal: ${milestone} sterren! ★`);
  if (session.solvedWithHelp > 0) {
    const n = session.solvedWithHelp;
    celebrations.push(`Je hebt ${n} ${n === 1 ? 'som' : 'sommen'} opgelost met een hint: goed doorgezet!`);
  }

  session.record.completed = true;
  saveState(appState);

  el('summary-score').textContent = `${totalCorrect} van de ${totalAttempts} goed`;
  el('summary-count').textContent = `${totalAttempts} ${totalAttempts === 1 ? 'som' : 'sommen'} gemaakt`;
  el('summary-stars').textContent = `+${session.starsEarned + bonus} ★ verdiend · totaal ${profile.stars} ★`;
  renderCelebrations(celebrations);
  renderList('summary-strong', strong, 'Nog geen duidelijk sterke vaardigheden deze keer.');
  renderList('summary-practice', needsPractice, 'Niets om extra te oefenen — sterk gedaan!');
  renderWeek(el('summary-week-dots'), el('summary-week-message'), profile);

  showScreen('summary');
}

function renderCelebrations(items) {
  const list = el('summary-celebrations');
  list.innerHTML = '';
  items.forEach((text) => list.appendChild(Object.assign(document.createElement('li'), { textContent: text })));
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
