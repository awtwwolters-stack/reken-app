// Screen flow, session orchestration. Reads CURRICULUM (curriculum/group-6.js),
// uses mastery.js for selection/tracking, exercises/*.js + hints.js for content.

const MAX_HINT_LEVEL = 3;
const MAX_TRIES_FOR_NEW_EXERCISE = 20;
// After a correct answer the praise and star stay visible this long, then the next sum follows.
const AUTO_NEXT_MS = 1500;
// Time on one exercise counts for at most this long, so walking away doesn't use up the session.
const MAX_COUNTED_MS_PER_EXERCISE = 90 * 1000;
// A category counts as "Sterk" in the summary when at least this share was right the first time.
const SUMMARY_STRONG_RATE = 0.8;
// A session opens with this many sums from skills the child is good at (picked among the best few).
const WARM_UP_SUMS = 2;
const CONFIDENT_CHOICES = 3;

const PRAISE_FIRST_TRY = ['Goed!', 'Netjes!', 'Yes, die heb je!', 'Knap gedaan!', 'Precies!'];
const PRAISE_WITH_HELP = ['Goed, dat lukte!', 'Mooi, je hebt hem nu!', 'Zo is hij goed!'];
const INVALID_NUMBER_MESSAGE = 'Typ alleen een getal, bijvoorbeeld 4520 of 4.520.';
// An answer this many digits longer than the right one is a hand on the keyboard, not an attempt.
const MASH_EXTRA_DIGITS = 2;
const EXAMPLE_NEW = 'Kijk eerst even mee, zo gaat deze som:';
const EXAMPLE_AGAIN = 'Even samen kijken, zo gaat deze som:';
const EXAMPLE_BUTTON = 'Nu ik!';
const MASH_MESSAGE = 'Dat zijn wel heel veel cijfers! Probeer het nog eens.';
// Prompts longer than this are sentences (verhaalsommen) and get a smaller font.
const LONG_PROMPT_CHARS = 30;
// Text shrinks in these steps, down to this share of its normal size, until the card fits.
// Visible height (above the keyboard) up to which a wide screen gets the two-column layout.
const WIDE_SHORT_MAX_HEIGHT = 560;
// The iPad moves the page a moment after the keyboard slides in: check the fit again then.
const REFIT_DELAYS_MS = [350, 800];
const FIT_STEP = 0.05;
const MIN_FIT = 0.6;
const INVALID_TIME_MESSAGE = 'Typ het uur in het eerste vakje en de minuten in het tweede, bijvoorbeeld 3 en 15.';
// After a tempo round ends, "Start!" appears where the child was just tapping: ignore taps this long.
const TEMPO_START_GUARD_MS = 800;
const INVALID_FRACTION_MESSAGE = 'Typ boven de streep een getal en onder de streep een getal.';

let appState = null;
let curriculumById = {};
let childSkillsById = {}; // the active child's own skills (skillsForGroep), see selectProfile
let session = null;
let currentExercise = null;
let activeProfileId = null;
let tempo = null; // a running Tempo-ronde (js/tempo.js); it uses the session screen

const SCREENS = ['profiles', 'start', 'park', 'story', 'tempo', 'tempo-result', 'soon', 'setup', 'session', 'pause', 'summary'];

function el(id) {
  return document.getElementById(id);
}

function showScreen(name) {
  SCREENS.forEach((screen) => {
    el(`screen-${screen}`).classList.toggle('hidden', screen !== name);
  });
  // During practice the card sits at the top, so question and answer stay above the iPad keyboard.
  // The pause screen counts as practice too: the parent link stays hidden there.
  document.body.classList.toggle('in-session', name === 'session' || name === 'pause');
  document.body.classList.toggle('tempo-round', !!tempo && name === 'session');
  stopSpeaking();
  closeShopOffer();
}

function init() {
  // An old copy of the page with new scripts (or an old utils.js): get a fresh page first.
  if (typeof pageIsStale !== 'function') {
    if (!location.search.includes('fresh=')) location.replace(`${location.pathname}?fresh=${Date.now()}`);
    return;
  }
  if (pageIsStale()) return;
  curriculumById = {};
  CURRICULUM.skills.forEach((s) => { curriculumById[s.id] = s; });
  // A built skill without a groep range would silently never be practised.
  CURRICULUM.skills.filter((s) => s.implemented && !s.groepen)
    .forEach((s) => console.error(`Vaardigheid ${s.id} mist "groepen" en komt nooit aan bod.`));
  appState = loadState();
  el('start-button').addEventListener('click', startSession);
  el('play-again-button').addEventListener('click', showGreeting);
  el('park-button').addEventListener('click', showPark);
  el('summary-park-button').addEventListener('click', showPark);
  el('park-back-button').addEventListener('click', showGreeting);
  el('story-button').addEventListener('click', () => showStory(firstChapterToRead(activeProfile())));
  el('story-prev-button').addEventListener('click', () => showStory(storyChapter - 1));
  el('story-next-button').addEventListener('click', () => showStory(storyChapter + 1));
  el('story-back-button').addEventListener('click', showPark);
  el('story-speak-button').addEventListener('click', speakStory);
  el('shop-buy-button').addEventListener('click', onBuy);
  el('shop-save-button').addEventListener('click', onToggleSaveFor);
  el('shop-close-button').addEventListener('click', closeShopOffer);
  // A tap next to the sheet closes it, so nothing behind it can be tapped by accident.
  el('shop-offer').addEventListener('click', (e) => { if (e.target === el('shop-offer')) closeShopOffer(); });
  buildAnswerInputs();
  el('submit-button').addEventListener('click', () => {
    onSubmit();
    // A tap may count as a user action to (re)open the iPad keyboard: keep the answer box focused.
    if (!el('answer-area').classList.contains('hidden')) answerInputs[0].focus();
  });
  el('next-button').addEventListener('click', onNext);
  el('pause-button').addEventListener('click', pauseSession);
  el('tempo-button').addEventListener('click', showTempoMenu);
  el('tempo-back-button').addEventListener('click', showGreeting);
  el('tempo-stop-button').addEventListener('click', stopTempo);
  el('tempo-again-button').addEventListener('click', () => startTempo(el('tempo-again-button').dataset.kind));
  el('tempo-done-button').addEventListener('click', showTempoMenu);
  el('resume-button').addEventListener('click', resumeSession);
  // Switching to another app or locking the iPad pauses too, so coming back is calm, not mid-sum.
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseSession(); });
  // Pressing a button must not pull focus away from the answer box (that closes the iPad keyboard).
  el('speak-button').addEventListener('click', speakExercise);
  // Some browsers list their voices only after a moment: re-check whether a Dutch one exists.
  // iOS 15 has speechSynthesis but not its addEventListener (this stopped the whole start-up on an
  // older iPad); there the voices are simply read when a sum is shown.
  optionalFeature(() => {
    if ('speechSynthesis' in window && typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', updateSpeakButton);
    }
  });
  ['submit-button', 'next-button', 'speak-button', 'tempo-stop-button'].forEach((id) => el(id).addEventListener('mousedown', (e) => e.preventDefault()));
  optionalFeature(() => {
    if (!window.visualViewport) return;
    // When the keyboard opens or the iPad turns: question back at the top, and resized to fit.
    window.visualViewport.addEventListener('resize', keepSumInView);
  });
  // Tapping the answer box brings the keyboard up; not every iPad reports that as a resize.
  answerInputs.forEach((input) => input.addEventListener('focus', keepSumInView));
  el('delete-profile-button').addEventListener('click', onDeleteProfile);
  el('switch-profile-button').addEventListener('click', showProfiles);
  el('summary-switch-button').addEventListener('click', showProfiles);
  el('soon-back-button').addEventListener('click', showProfiles);
  el('open-setup-button').addEventListener('click', () => showSetup(null));
  el('setup-back-button').addEventListener('click', showProfiles);
  el('profile-form').addEventListener('submit', onProfileFormSubmit);
  const signInOrRetry = () => {
    if (window.Cloud.state === 'failed' && window.Cloud.email) window.Cloud.retry();
    else if (window.Cloud.state === 'failed') location.reload(); // the cloud code didn't load: try again
    else window.Cloud.signIn();
  };
  el('sync-signin-button').addEventListener('click', signInOrRetry);
  el('fetch-children-button').addEventListener('click', signInOrRetry);
  el('sync-signout-button').addEventListener('click', () => window.Cloud.signOut());
  showProfiles();
  optionalFeature(startCloudSync);
}

// The sum back at the top and sized to what is visible - now, and again once the keyboard has
// finished sliding in (the iPad scrolls the page to the answer box a moment later).
function keepSumInView() {
  const refit = () => {
    if (el('screen-session').classList.contains('hidden')) return;
    window.scrollTo(0, 0);
    fitSessionToScreen();
  };
  refit();
  REFIT_DELAYS_MS.forEach((ms) => setTimeout(refit, ms));
}

// Extras (read-aloud, keyboard fitting, cloud sync) differ per browser and iPad age. If setting
// one up fails, practising must still work: the problem is noted in the diagnostics line instead
// of stopping the whole start-up.
function optionalFeature(setup) {
  try {
    setup();
  } catch (e) {
    el('diag-errors').textContent += ` · extra uitgeschakeld: ${e.message}`;
  }
}

// Cloud sync (js/cloud.js): this page's data goes up after every save; changes made on other
// iPads come in here.
function startCloudSync() {
  if (!window.Cloud) return;
  window.Cloud.start({
    getState: () => appState,
    replaceState: (state) => {
      appState = state;
      saveState(appState);
      if (activeProfileId && !appState.profiles[activeProfileId]) activeProfileId = null;
      refreshAfterSync();
    },
    remoteChanges: onCloudChanges,
    statusChanged: renderSyncBlock
  });
}

// What other iPads did comes in here, combined with this iPad's own changes (applyRemoteChange). The
// child practising right now is updated in place, so their running session goes on undisturbed;
// only that session's own record stays this iPad's.
function onCloudChanges(changes) {
  const practising = session && !session.record.completed
    ? { profileId: activeProfileId, sessionId: String(session.record.id) }
    : {};
  let changed = false;
  changes.forEach((change) => { if (applyRemoteChange(appState, change, practising)) changed = true; });
  if (!changed) return;
  saveState(appState);
  refreshAfterSync();
}

function visibleScreen() {
  return SCREENS.find((name) => !el(`screen-${name}`).classList.contains('hidden'));
}

// Screens that show names or stars are redrawn; practice and the setup form are never interrupted.
function refreshAfterSync() {
  const screen = visibleScreen();
  if (screen === 'profiles') showProfiles();
  else if (screen === 'start' || screen === 'park' || screen === 'story') {
    if (!activeProfile()) showProfiles();
    else if (screen === 'start') showGreeting();
    else if (el('shop-offer').classList.contains('hidden')) renderPark(); // not while choosing to buy
  } else if (screen === 'tempo') showTempoMenu(); // records and locks from another iPad
  else if (screen === 'setup') renderSetupList();
}

// The small line under the app: version, children on this iPad and the cloud's state.
function renderDiagnostics() {
  const cloud = window.Cloud;
  const cloudText = !cloud ? 'niet geladen' : cloud.state + (cloud.email ? ` (${cloud.email})` : '') + (cloud.problem ? `: ${cloud.problem}` : '');
  el('diag-info').textContent = `versie ${APP_VERSION} · ${listProfiles(appState).length} kinderen op deze iPad · cloud: ${cloudText}`;
}

// On an iPad without children yet, signing in is offered right on the first screen.
function renderFetchChildren() {
  renderDiagnostics();
  const cloud = window.Cloud;
  const offer = !!cloud && listProfiles(appState).length === 0 && ['signedOut', 'linking', 'failed'].includes(cloud.state);
  el('fetch-children').classList.toggle('hidden', !offer);
  // Children here, but not sharing: what they practise stays on this iPad until a parent signs in
  // again (then it is combined with the other iPads, D20).
  const notSharing = !!cloud && !offer && listProfiles(appState).length > 0 && ['signedOut', 'failed'].includes(cloud.state);
  el('sync-warning').classList.toggle('hidden', !notSharing);
  if (!offer) return;
  el('fetch-children-button').classList.toggle('hidden', cloud.state === 'linking');
  el('fetch-children-status').textContent = cloud.state === 'signedOut' && !cloud.problem
    ? 'Voor ouders: log in met het Google-account van jullie gezin.'
    : cloud.statusText();
}

function renderSyncBlock() {
  renderFetchChildren();
  const cloud = window.Cloud;
  const configured = !!cloud && cloud.state !== 'unconfigured';
  el('sync-block').classList.toggle('hidden', !configured);
  el('storage-note').textContent = configured && cloud.state === 'on'
    ? 'Namen en voortgang staan op deze iPad en in jullie eigen, afgeschermde cloud.'
    : 'Namen en voortgang staan alleen op dit apparaat.';
  if (!configured) return;
  el('sync-status').textContent = cloud.statusText();
  const signedIn = !!cloud.email;
  const canSignIn = cloud.state === 'signedOut' || (cloud.state === 'failed' && !!cloud.email);
  el('sync-signin-button').classList.toggle('hidden', !canSignIn);
  el('sync-signin-button').textContent = signedIn ? 'Opnieuw proberen' : 'Inloggen met Google';
  el('sync-signout-button').classList.toggle('hidden', !signedIn);
}

// The active child's own skills; follows their groep (also after a change in another tab).
function loadChildSkills() {
  childSkillsById = Object.fromEntries(
    skillsForGroep(CURRICULUM.skills, practiceGroep(activeProfile())).map((s) => [s.id, s])
  );
}

function activeProfile() {
  return appState.profiles[activeProfileId];
}

function profileSkillStates() {
  return (activeProfile() && activeProfile().skills) || {};
}

function currentSkillState(skill) {
  const groep = practiceGroep(activeProfile());
  const startTier = personalStartTier(skill, profileSkillStates(), childSkillsById, groep);
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
  renderFetchChildren();
  showScreen('profiles');
}

function selectProfile(id) {
  activeProfileId = id;
  appState.lastProfileId = id;
  loadChildSkills();
  saveState(appState);
  if (canPractise(activeProfile())) {
    showGreeting();
  } else {
    el('soon-greeting').textContent = `Hoi ${activeProfile().name}!`;
    el('soon-text').textContent = hasFinishedPrimarySchool(activeProfile())
      ? 'Je hebt de basisschool afgerond. Knap gedaan! 🎓'
      : 'Jouw sommen komen er binnenkort aan!';
    showScreen('soon');
  }
}

function showGreeting() {
  const profile = activeProfile();
  el('greeting').textContent = `Hoi ${profile.name}! Klaar om te rekenen?`;
  renderWeek(el('week-dots'), el('week-message'), profile);
  const stars = profile.stars || 0;
  el('star-total').textContent = `★ ${walletStars(profile)} in je spaarpot`;
  if (saveForItem(profile)) renderSaveGoal(el('goal-fill'), el('goal-text'), profile);
  else renderStarGoal(el('goal-fill'), el('goal-text'), stars);
  el('park-badge').classList.toggle('hidden', unreadChapters(profile) === 0);
  el('tempo-button').classList.toggle('hidden', !offersTempo(profile));
  // The family goal counts earned stars: buying in the park doesn't move it further away.
  const goal = profile.familyGoal;
  el('family-goal').classList.toggle('hidden', !goal);
  if (goal) {
    el('family-goal').textContent = stars >= goal.stars
      ? `Groot doel gehaald: ${goal.text}!`
      : `Groot doel: ${goal.text} — nog ${goal.stars - stars} ★ verdienen`;
  }
  const weeks = weeksInARow(profile);
  el('weeks-in-row').textContent = `${weeks} weken op rij je weekdoel gehaald!`;
  el('weeks-in-row').classList.toggle('hidden', weeks < 2);
  showScreen('start');
}

function renderStarGoal(fillEl, textEl, stars) {
  const goal = starGoal(stars);
  fillEl.style.width = `${Math.round(goal.progress * 100)}%`;
  if (!goal.next) {
    textEl.textContent = 'Alle dieren wonen in je park!';
    return;
  }
  // Only stars still to earn: the earned total itself stays out of sight, next to the spaarpot.
  textEl.textContent = `Verdien nog ${goal.next - stars} ★: dan komt er een nieuw dier en een nieuw hoofdstuk!`;
}

// The spaardoel: how far the spaarpot is towards the chosen item.
function renderSaveGoal(fillEl, textEl, profile) {
  const item = saveForItem(profile);
  const wallet = walletStars(profile);
  fillEl.style.width = `${Math.round(Math.min(1, wallet / item.price) * 100)}%`;
  const refusal = buyRefusal(profile, item.id);
  if (wallet < item.price) {
    textEl.textContent = `Je spaart voor ${item.emoji} ${item.name}: nog ${item.price - wallet} ★`;
  } else if (refusal === 'full') {
    textEl.textContent = `Je hebt genoeg voor ${item.emoji} ${item.name}, maar je park is vol. Bij het volgende dier komt er ruimte.`;
  } else {
    textEl.textContent = refusal === null
      ? `Je hebt genoeg voor ${item.emoji} ${item.name}! Koop hem in je park.`
      : `Je hebt genoeg voor ${item.emoji} ${item.name}! Na het rekenen kun je hem kopen.`;
  }
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

// Mijn park (js/park.js): the animals and everything bought, on a grid the child arranges by
// tapping one tile and then another. Looking is always possible; buying after practising today.
let parkSelectedTile = null; // the tile tapped first when moving something
let shopOfferItemId = null;
let storyChapter = 0;

function showPark() {
  parkSelectedTile = null;
  renderPark();
  showScreen('park');
  window.scrollTo(0, 0);
}

function renderPark(message = '') {
  const profile = activeProfile();
  el('park-title').textContent = `Het park van ${profile.name}`;
  el('park-wallet').textContent = `★ ${walletStars(profile)} in je spaarpot`;
  const unread = unreadChapters(profile);
  const next = firstChapterToRead(profile);
  el('story-button').textContent = unread > 0
    ? `📖 Nieuw hoofdstuk: ${STORY[next].title}`
    : '📖 Lees het verhaal';
  el('story-button').classList.toggle('new', unread > 0);
  renderParkGrid(profile);
  el('park-message').textContent = message || (parkSelectedTile === null
    ? 'Tik op iets in je park om het te verplaatsen.'
    : 'Tik nu op de plek waar het heen moet.');
  renderStarGoal(el('park-goal-fill'), el('park-goal-text'), profile.stars || 0);
  renderShop(profile);
}

function renderParkGrid(profile) {
  const grid = el('park-grid');
  grid.innerHTML = '';
  const park = parkOf(profile);
  parkLayout(profile).forEach((piece, tile) => {
    const button = Object.assign(document.createElement('button'), { type: 'button', className: 'park-tile' });
    if (piece) {
      const thing = piece.kind === 'animal' ? COLLECTION[piece.index] : parkItem(park.items[piece.index].id);
      button.textContent = thing ? thing.emoji : '?';
      button.setAttribute('aria-label', thing ? thing.name : 'onbekend');
      if (piece.kind === 'animal') button.classList.add('animal');
    }
    if (tile === parkSelectedTile) button.classList.add('selected');
    button.addEventListener('click', () => onParkTile(tile, piece));
    grid.appendChild(button);
  });
}

function onParkTile(tile, piece) {
  if (parkSelectedTile === null) {
    if (!piece) return;
    parkSelectedTile = tile;
    const name = piece.kind === 'animal' ? COLLECTION[piece.index].name : (parkItem(parkOf(activeProfile()).items[piece.index].id) || {}).name;
    renderPark(`${name || 'Dit'}: tik nu op de plek waar het heen moet.`);
    return;
  }
  if (tile !== parkSelectedTile && moveInPark(activeProfile(), parkSelectedTile, tile)) saveState(appState);
  parkSelectedTile = null;
  renderPark();
}

// "Na het rekenen": on a day this child finished a session.
function renderShop(profile) {
  const open = shopOpenToday(profile);
  el('shop-status').textContent = open
    ? 'De winkel is open! Tik op iets om het te kopen.'
    : 'Kijken mag altijd. Kopen kan na het rekenen.';
  const wallet = walletStars(profile);
  const saveFor = parkOf(profile).saveFor;
  const list = el('shop-items');
  list.innerHTML = '';
  const items = shopItems(profile);
  items.forEach((item) => {
    const button = Object.assign(document.createElement('button'), { type: 'button', className: 'shop-item' });
    button.appendChild(Object.assign(document.createElement('span'), { className: 'shop-emoji', textContent: item.emoji }));
    button.appendChild(Object.assign(document.createElement('span'), { className: 'shop-name', textContent: item.name }));
    const short = item.price - wallet;
    const priceText = short > 0 ? `${item.price} ★ · nog ${short}` : `${item.price} ★`;
    button.appendChild(Object.assign(document.createElement('span'), { className: 'shop-price', textContent: priceText }));
    if (short > 0 || !open) button.classList.add('muted-item');
    if (item.id === saveFor) {
      button.classList.add('save-for');
      button.appendChild(Object.assign(document.createElement('span'), { className: 'shop-goal', textContent: '🎯 spaardoel' }));
    }
    button.addEventListener('click', () => openShopOffer(item.id));
    list.appendChild(button);
  });
  const coming = PARK_ITEMS.length - items.length;
  if (coming > 0) {
    list.appendChild(Object.assign(document.createElement('p'), {
      className: 'shop-coming', textContent: `Bij de volgende dieren komen er nog ${coming} nieuwe dingen in de winkel.`
    }));
  }
}

// What it costs and what is left over: the money lesson in one sum.
function openShopOffer(itemId) {
  const profile = activeProfile();
  const item = parkItem(itemId);
  const wallet = walletStars(profile);
  const refusal = buyRefusal(profile, itemId);
  const saving = parkOf(profile).saveFor === itemId;
  let text;
  if (refusal === null) {
    const sum = [wallet, '−', item.price, '=', wallet - item.price].join('\u00a0'); // kept on one line
    text = `${item.emoji} ${item.name} kopen voor ${item.price} ★? Je hebt ${wallet} ★. ${sum}, dus dan houd je ${wallet - item.price} ★ over.`;
  } else if (refusal === 'full') {
    text = 'Je park is vol! Bij het volgende dier komt er meer ruimte.';
  } else if (wallet < item.price) {
    text = `${item.emoji} ${item.name} kost ${item.price} ★. Je hebt ${wallet} ★, dus je komt nog ${item.price - wallet} ★ tekort. Sparen maar!`;
  } else {
    text = `${item.emoji} ${item.name} kost ${item.price} ★. Je hebt genoeg! Na het rekenen kun je het kopen.`;
  }
  shopOfferItemId = itemId;
  el('shop-offer-text').textContent = text;
  el('shop-buy-button').classList.toggle('hidden', refusal !== null);
  // A spaardoel only for something you can't buy yet; one that is on can always be stopped.
  el('shop-save-button').classList.toggle('hidden', !saving && wallet >= item.price);
  el('shop-save-button').textContent = saving ? 'Stop met sparen' : '🎯 Hier spaar ik voor';
  el('shop-close-button').textContent = refusal === null ? 'Nee' : 'Sluiten';
  el('shop-offer').classList.remove('hidden');
}

function closeShopOffer() {
  shopOfferItemId = null;
  el('shop-offer').classList.add('hidden');
}

function onBuy() {
  const itemId = shopOfferItemId;
  closeShopOffer();
  if (!itemId) return; // a second tap on "Ja, kopen"
  const profile = activeProfile();
  const tile = buyItem(profile, itemId);
  if (tile === null) {
    renderPark('Dat lukte niet. Kijk nog eens in de winkel.');
    return;
  }
  saveState(appState);
  const item = parkItem(itemId);
  // The new thing stands ready to be moved: the next tap on a tile puts it there.
  parkSelectedTile = tile;
  renderPark(`Gekocht! ${item.emoji} staat in je park. Tik op een plek om het daar neer te zetten.`);
  el('park-grid').scrollIntoView();
}

function onToggleSaveFor() {
  const itemId = shopOfferItemId;
  closeShopOffer();
  if (!itemId) return;
  const profile = activeProfile();
  setSaveFor(profile, parkOf(profile).saveFor === itemId ? null : itemId);
  saveState(appState);
  renderPark();
}

// The first chapter not read yet, or the newest one to read again.
function firstChapterToRead(profile) {
  return Math.min(parkOf(profile).storyRead || 0, chaptersUnlocked(profile) - 1);
}

function showStory(chapter) {
  const profile = activeProfile();
  if (!profile) return showProfiles();
  storyChapter = Math.max(0, Math.min(chapter, chaptersUnlocked(profile) - 1));
  const before = parkOf(profile).storyRead || 0;
  markChapterRead(profile, storyChapter);
  if ((parkOf(profile).storyRead || 0) !== before) saveState(appState);
  el('story-emoji').textContent = storyChapter === 0 ? '📜' : COLLECTION[storyChapter - 1].emoji;
  el('story-title').textContent = `${storyChapter + 1}. ${STORY[storyChapter].title}`;
  el('story-text').textContent = chapterText(storyChapter, profile.name);
  const isLastUnlocked = storyChapter === chaptersUnlocked(profile) - 1;
  const goal = starGoal(profile.stars || 0);
  el('story-next-hint').textContent = !isLastUnlocked ? ''
    : storyChapter === STORY.length - 1 ? 'Dit was het laatste hoofdstuk. Wordt vervolgd!'
      : `Verdien nog ${goal.next - (profile.stars || 0)} ★ voor het volgende hoofdstuk.`;
  el('story-prev-button').classList.toggle('hidden', storyChapter === 0);
  el('story-next-button').classList.toggle('hidden', isLastUnlocked);
  el('story-speak-button').classList.toggle('hidden', !canSpeakDutch());
  showScreen('story');
  window.scrollTo(0, 0);
}

function speakStory() {
  if (!('speechSynthesis' in window) || !activeProfile()) return;
  speakText(`${STORY[storyChapter].title}. ${chapterText(storyChapter, activeProfile().name)}`);
}

// Parent setup: add or edit a child. The parent picks the groep for this school year; it moves up
// by itself every 1 August (currentGroep in profiles.js).
function groepLabel(profile) {
  const groep = currentGroep(profile);
  if (groep > LAST_GROEP) return 'basisschool klaar';
  return groep ? `groep ${groep}` : 'nog niet op school';
}

function renderSetupList() {
  const list = el('setup-list');
  list.innerHTML = '';
  listProfiles(appState).forEach(({ id, profile }) => {
    const item = document.createElement('li');
    item.appendChild(document.createTextNode(`${profile.name} (${groepLabel(profile)}) `));
    const edit = Object.assign(document.createElement('button'), { type: 'button', className: 'link-button', textContent: 'wijzig' });
    edit.addEventListener('click', () => showSetup(id));
    item.appendChild(edit);
    list.appendChild(item);
  });
}

function showSetup(profileId) {
  renderSetupList();
  const profile = profileId ? appState.profiles[profileId] : null;
  el('profile-form-title').textContent = profile ? `${profile.name} wijzigen` : 'Kind toevoegen';
  el('profile-id').value = profileId || '';
  el('profile-name').value = profile ? profile.name : '';
  el('profile-groep').value = String(profile ? Math.min(LAST_GROEP, currentGroep(profile)) : DEFAULT_GROEP);
  el('profile-weekgoal').value = String(profile ? profile.weekGoal : DEFAULT_WEEK_GOAL);
  el('profile-goal-stars').value = profile && profile.familyGoal ? profile.familyGoal.stars : '';
  el('profile-goal-text').value = profile && profile.familyGoal ? profile.familyGoal.text : '';
  el('profile-current-stars').textContent = profile
    ? `${profile.name} heeft ${profile.stars || 0} ★ verdiend (nu ${walletStars(profile)} ★ in de spaarpot).`
    : '';
  el('profile-form-error').textContent = '';
  el('delete-profile-button').classList.toggle('hidden', !profile);
  el('delete-profile-button').textContent = profile ? `${profile.name} verwijderen` : '';
  renderSyncBlock();
  showScreen('setup');
}

function onDeleteProfile() {
  const id = el('profile-id').value;
  const profile = appState.profiles[id];
  if (!profile) return;
  const sure = confirm(`${profile.name} verwijderen? Alle sterren, dieren en oefeningen van ${profile.name} worden gewist. Dit kan niet ongedaan worden gemaakt.`);
  if (!sure) return;
  appState = loadState();
  const sessionIds = appState.sessions.filter((s) => s.profileId === id).map((s) => s.id);
  deleteProfile(appState, id);
  saveState(appState);
  if (window.Cloud) window.Cloud.deleteProfile(id, sessionIds);
  if (activeProfileId === id) activeProfileId = null;
  showProfiles();
}

function onProfileFormSubmit(e) {
  e.preventDefault();
  const name = el('profile-name').value.trim();
  if (!name) {
    el('profile-form-error').textContent = 'Vul een naam in.';
    return;
  }
  // Optional family reward: both fields filled, or both empty (no reward).
  const goalStars = Number(el('profile-goal-stars').value);
  const goalText = el('profile-goal-text').value.trim();
  if ((goalText && !(Number.isInteger(goalStars) && goalStars > 0)) || (!goalText && el('profile-goal-stars').value !== '')) {
    el('profile-form-error').textContent = 'Vul bij het groot doel allebei in: een aantal sterren en wat jullie dan doen.';
    return;
  }
  appState = loadState();
  const existing = appState.profiles[el('profile-id').value];
  const groep = Number(el('profile-groep').value);
  // Only a changed groep starts a new count; otherwise the school year it was set in stays.
  const groepChanged = !existing || groep !== Math.min(LAST_GROEP, currentGroep(existing));
  saveProfile(appState, el('profile-id').value || null, {
    name,
    ...(groepChanged ? { groep, groepSchoolYear: schoolYearOf() } : {}),
    weekGoal: Number(el('profile-weekgoal').value),
    familyGoal: goalText ? { stars: goalStars, text: goalText } : null
  });
  saveState(appState);
  showProfiles();
}

function tierConfigFor(skill, tier) {
  return skill.tiers.find((t) => t.tier === tier) || skill.tiers[skill.tiers.length - 1];
}

function startSession() {
  appState = loadState(); // pick up a backup restored in another tab since this page loaded
  const groep = practiceGroep(activeProfile());
  const selection = selectSessionSkills(Object.values(childSkillsById), profileSkillStates(), groep);
  const record = startSessionRecord(appState, activeProfileId, selection);
  saveState(appState);
  session = {
    record, // the stored log for the parent view, saved after every exercise
    groep,
    targetMs: sessionMinutes(activeProfile()) * 60 * 1000,
    starsAtStart: activeProfile().stars || 0,
    starsEarned: 0,
    levelUps: [], // category names, for "Niveau omhoog: Tafels!"
    solvedWithHelp: 0,
    asked: new Set(), // exercises asked this session, to avoid repeats
    autoNextTimer: null,
    skillIds: selection.map((s) => s.skillId),
    activeMs: 0,
    exerciseCount: 0,
    exerciseStartedAt: null,
    previousSkillId: null,
    followUps: [], // [{ skillId, dueAt }] fresh exercise to check understanding after a shown solution
    followUpQueued: new Set(),
    masteredAsked: [], // mastered skills that already came up: once per session is enough
    examplesShown: [], // skills whose worked example was shown this session
    pendingPick: null, // the sum waiting behind a worked example
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
  // Confidence first: a session opens with sums the child is good at, and right after a worked
  // solution comes one they can do. (Children quit after a sum that went wrong, most of all when
  // it was the first of the session.)
  const warmingUp = session.exerciseCount < WARM_UP_SUMS;
  if (warmingUp || session.justStruggled) {
    const confident = confidentSkillIds(profileSkillStates(), childSkillsById, [session.previousSkillId]);
    const choice = confident.slice(0, CONFIDENT_CHOICES);
    if (choice.length) {
      pick = {
        skillId: pickRandom(choice),
        reason: warmingUp ? 'opwarmen met iets dat je goed kunt' : 'na de uitleg eerst een som die je goed kunt'
      };
    }
  }
  session.justStruggled = false;
  if (!pick && dueIndex >= 0) {
    const [followUp] = session.followUps.splice(dueIndex, 1);
    pick = { skillId: followUp.skillId, reason: 'controle na uitleg' };
  }
  if (!pick) {
    pick = pickNextSkill(session.skillIds, childSkillsById, profileSkillStates(), session.previousSkillId, session.groep, session.masteredAsked);
  }
  const skill = curriculumById[pick.skillId];
  const skillState = currentSkillState(skill);
  // A level above the child's ceiling (e.g. reached before the ceiling existed) comes down first,
  // before the example too: it must show a sum of the level the child is about to get.
  pick.ceilingChange = [applyCeiling(skill, skillState, session.groep), applyFastClimbCorrection(skill, skillState, session.groep)]
    .filter(Boolean).join('; ') || null;
  if (needsExample(skillState) && !session.examplesShown.includes(pick.skillId)) showExample(pick, skillState);
  else renderExercise(pick);
}

// A worked example before the sum itself: the same kind of sum with its solution and picture, to
// look at, not to answer. It doesn't count as a sum (no time, no star, no level).
function showExample(pick, skillState) {
  const skill = curriculumById[pick.skillId];
  const firstTime = !skillState.introSeen;
  skillState.introSeen = true;
  session.examplesShown.push(skill.id);
  session.pendingPick = pick;

  currentExercise = freshExercise(skill, tierConfigFor(skill, skillState.tier));
  currentExercise.answersGiven = [];
  session.hintLevel = 0;
  session.awaitingNext = false;
  stopSpeaking();
  updateSpeakButton();
  renderPrompt(currentExercise);
  renderVisual(currentExercise.hintVisual || currentExercise.visual);
  const solution = getHint(currentExercise.exerciseType, MAX_HINT_LEVEL, currentExercise.hintContext);
  el('feedback').textContent = `${firstTime ? EXAMPLE_NEW : EXAMPLE_AGAIN} ${solution}`;
  el('feedback').className = 'feedback feedback-hint'; // the hint colour: nothing went wrong here
  el('answer-area').classList.add('hidden');
  el('next-button').textContent = EXAMPLE_BUTTON;
  el('next-button').classList.remove('hidden');
  el('next-button').focus();
  window.scrollTo(0, 0);
  fitSessionToScreen();
}

function renderExercise(pick) {
  const skill = curriculumById[pick.skillId];
  const skillState = currentSkillState(skill);
  const tierConfig = tierConfigFor(skill, skillState.tier);
  if (isMastered(skill, skillState, session.groep) && !session.masteredAsked.includes(skill.id)) session.masteredAsked.push(skill.id);

  currentExercise = freshExercise(skill, tierConfig);
  currentExercise.pickReason = pick.reason;
  currentExercise.ceilingChange = pick.ceilingChange;
  currentExercise.tier = skillState.tier;
  currentExercise.answersGiven = [];
  session.hintLevel = 0;
  session.hadMistake = false;
  session.exerciseStartedAt = Date.now();

  stopSpeaking();
  updateSpeakButton();
  renderPrompt(currentExercise);
  renderVisual(currentExercise.visual);
  el('feedback').textContent = '';
  el('feedback').className = 'feedback';

  session.awaitingNext = false;
  el('answer-area').classList.remove('hidden');
  el('submit-button').classList.remove('hidden');
  el('next-button').classList.add('hidden');
  // Focus the first box before hiding any unused box: if the focused box were hidden first, the iPad
  // closes the keyboard, and it can't reopen it when this runs from the auto-continue timer.
  answerInputs[0].focus();
  layoutAnswerFields();
  window.scrollTo(0, 0);
  fitSessionToScreen();
}

// The boxes this sum needs, emptied: one, or two with a breukstreep or a ":" between them.
function layoutAnswerFields() {
  const isFraction = currentExercise.answerLayout === 'fraction';
  const isTime = currentExercise.answerLayout === 'time';
  el('answer-fields').classList.toggle('fraction', isFraction);
  el('answer-fields').classList.toggle('time', isTime);
  const separator = el('answer-fields').querySelector('.answer-separator');
  separator.className = `answer-separator ${isFraction ? 'breukstreep' : isTime ? 'time-colon' : 'hidden'}`;
  separator.textContent = isTime ? ':' : '';
  answerInputs.forEach((input, i) => {
    const field = currentExercise.answerFields[i];
    input.value = '';
    input.parentElement.classList.toggle('hidden', !field);
    if (!field) return;
    input.dataset.key = field.key;
    input.parentElement.querySelector('.field-label').textContent = field.label || '';
    if (isFraction || isTime) input.setAttribute('aria-label', field.key); // teller / noemer, uur / minuten
    else input.removeAttribute('aria-label');
  });
}

// The answer boxes are created once and reused for every sum. On the iPad the keyboard only opens
// on a tap, so the auto-continue (no tap) can only keep it up if the same box simply stays focused.
let answerInputs = [];

function buildAnswerInputs() {
  const container = el('answer-fields');
  container.innerHTML = '';
  answerInputs = [0, 1].map((i) => {
    // Between the two boxes: a breukstreep for fractions, a ":" for times (set per sum).
    if (i === 1) container.appendChild(Object.assign(document.createElement('div'), { className: 'answer-separator hidden' }));
    const wrapper = Object.assign(document.createElement('label'), { className: 'answer-field' });
    wrapper.appendChild(Object.assign(document.createElement('span'), { className: 'field-label' }));
    // A text field (not type="number") so Dutch notation like 45.230 reaches our own parser.
    const input = Object.assign(document.createElement('input'), {
      type: 'text', inputMode: 'numeric', autocomplete: 'off', spellcheck: false, className: 'answer-input-field'
    });
    input.addEventListener('keydown', (e) => onAnswerKeydown(e, input));
    wrapper.appendChild(input);
    container.appendChild(wrapper);
    return input;
  });
}

function activeInputs() {
  return answerInputs.slice(0, currentExercise.answerFields.length);
}

function onAnswerKeydown(e, input) {
  if (tempo) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    onTempoSubmit();
    return;
  }
  if (session.awaitingNext) {
    // During the pause after a correct answer: Enter moves on now; other typing is ignored.
    e.preventDefault();
    if (e.key === 'Enter') onNext();
    return;
  }
  if (e.key !== 'Enter') return;
  // Without this, the same Enter press also "clicks" the Volgende button that
  // receives focus after a shown solution, skipping the feedback entirely.
  e.preventDefault();
  // In a two-field answer, Enter in the first field moves on to the empty second one.
  const inputs = activeInputs();
  const next = inputs[inputs.indexOf(input) + 1];
  // (Not when the first box already holds a whole answer: "5/8", or a time like "3:15" or "3.15".)
  const wholeAnswerTyped = input.value.includes('/')
    || (currentExercise.answerLayout === 'time' && /\d\s*[:.]\s*\d/.test(input.value));
  if (next && next.value.trim() === '' && !wholeAnswerTyped) {
    next.focus();
    return;
  }
  onSubmit();
}

// No exact repeats within a session while unused variations remain. Some skills are small by
// nature (one tafel has 10 facts, halves/quarters only 4 fractions), so after enough tries a
// repeat is accepted rather than looping forever.
function freshExercise(skill, tierConfig) {
  let exercise;
  let key;
  for (let tries = 0; tries < MAX_TRIES_FOR_NEW_EXERCISE; tries++) {
    exercise = Exercises[skill.exerciseType](tierConfig, skill);
    // The question text alone isn't enough: every strook exercise asks the same question.
    key = `${exercise.prompt}|${JSON.stringify(exercise.correctAnswer)}`;
    if (!session.asked.has(key)) break;
  }
  session.asked.add(key);
  return exercise;
}

// A question may come in parts so fractions show stacked (like in the rekenschrift):
// ['text', { fraction: [1, 4] }, 'more text'].
function renderPrompt(exercise) {
  const promptEl = el('exercise-prompt');
  // Verhaalsommen are sentences, not sums: they start smaller.
  promptEl.classList.toggle('long', exercise.prompt.length > LONG_PROMPT_CHARS);
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

// A visual, or a list of them shown one below the other (e.g. a split picture with dots).
const VISUAL_RENDERERS = { strook: strookSvg, dots: dotsSvg, splits: splitsSvg, clock: clockSvg };

function renderVisual(visual) {
  const container = el('exercise-visual');
  container.innerHTML = '';
  container.classList.toggle('hidden', !visual);
  if (!visual) return;
  [].concat(visual).forEach((v) => {
    if (VISUAL_RENDERERS[v.type]) container.appendChild(VISUAL_RENDERERS[v.type](v));
    // Wegstrepen (D22): what to do, for a reader nearby; the child hears it with 🔊.
    if (v.crossable) container.appendChild(Object.assign(document.createElement('p'), { className: 'dots-caption', textContent: `Tik ${stippen(v.crossable)} weg` }));
  });
}

// A wijzerklok: 12 numbers, a tick per minute (longer every 5), a short thick hour hand that
// creeps along with the minutes (at half past it sits between two numbers) and a long minute hand.
function clockSvg(visual) {
  const svg = svgNode('svg', { viewBox: '-104 -104 208 208', class: 'clock', role: 'img' });
  svg.setAttribute('aria-label', 'Een wijzerklok');
  svg.appendChild(svgNode('circle', { cx: 0, cy: 0, r: 100, class: 'clock-face' }));
  const point = (angle, radius) => [Math.sin(angle) * radius, -Math.cos(angle) * radius];
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI;
    const [x1, y1] = point(angle, i % 5 === 0 ? 86 : 92);
    const [x2, y2] = point(angle, 98);
    svg.appendChild(svgNode('line', { x1, y1, x2, y2, class: i % 5 === 0 ? 'clock-tick five' : 'clock-tick' }));
  }
  const hand = (angle, length, cls) => {
    const [x2, y2] = point(angle, length);
    svg.appendChild(svgNode('line', { x1: 0, y1: 0, x2, y2, class: cls }));
  };
  hand(((visual.hour % 12) + visual.minute / 60) / 12 * 2 * Math.PI, 46, 'clock-hand hour');
  hand((visual.minute / 60) * 2 * Math.PI, 84, 'clock-hand minute');
  // The numbers go on top of the hands (with a white edge), so a hand never hides one.
  for (let n = 1; n <= 12; n++) {
    const [x, y] = point((n / 12) * 2 * Math.PI, 68);
    const label = svgNode('text', { x, y: y + 7, 'text-anchor': 'middle', class: 'clock-number' });
    label.textContent = String(n);
    svg.appendChild(label);
  }
  svg.appendChild(svgNode('circle', { cx: 0, cy: 0, r: 5, class: 'clock-centre' }));
  return svg;
}

// Splitsen as in groep 3: the whole number on top, its two parts in boxes below; the missing
// part is an open box with a "?".
function splitsSvg(visual) {
  const svg = svgNode('svg', { viewBox: '-2 -2 204 154', class: 'splits', role: 'img' });
  svg.setAttribute('aria-label', `${visual.whole} splitsen in ${visual.part} en hoeveel?`);
  svg.appendChild(svgNode('path', { d: 'M100 56L45 94M100 56L155 94', class: 'splits-line' }));
  const box = (x, y, text, open) => {
    svg.appendChild(svgNode('rect', { x, y, width: 80, height: 56, rx: 10, class: open ? 'splits-box open' : 'splits-box' }));
    const label = svgNode('text', { x: x + 40, y: y + 39, 'text-anchor': 'middle', class: 'splits-text' });
    label.textContent = text;
    svg.appendChild(label);
  };
  box(60, 0, String(visual.whole), false);
  box(5, 94, String(visual.part), false);
  box(115, 94, '?', true);
  return svg;
}

function svgNode(tag, attributes) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
  return node;
}

// Dots in ten-frames of 2 rows of 5 (the classroom's five-structure), filled row by row, so
// 8 + 5 visibly fills the first 10 before spilling into the second frame.
const DOT_CELL = 36;
const FRAME_GAP = 16;

function dotsSvg(visual) {
  const kinds = visual.parts.flatMap((part) => Array(part.count).fill(part.kind));
  const frames = Math.max(1, Math.ceil(kinds.length / 10));
  const frameWidth = 5 * DOT_CELL;
  const width = frames * frameWidth + (frames - 1) * FRAME_GAP;
  const height = 2 * DOT_CELL;
  const svg = svgNode('svg', { viewBox: `-2 -2 ${width + 4} ${height + 4}`, class: visual.crossable ? 'dots crossable' : 'dots', role: 'img' });
  svg.setAttribute('aria-label', `${kinds.length} stippen`);
  for (let i = 0; i < frames * 10; i++) {
    const frame = Math.floor(i / 10);
    const x = frame * (frameWidth + FRAME_GAP) + (i % 5) * DOT_CELL;
    const y = Math.floor((i % 10) / 5) * DOT_CELL;
    const kind = kinds[i];
    // A dot the child may tap away is one group with its whole cell, so a tap near it counts too.
    const holder = visual.crossable && kind ? svg.appendChild(svgNode('g', { class: 'dot-tap' })) : svg;
    holder.appendChild(svgNode('rect', { x, y, width: DOT_CELL, height: DOT_CELL, class: 'dot-cell' }));
    if (!kind) continue;
    const cx = x + DOT_CELL / 2;
    const cy = y + DOT_CELL / 2;
    holder.appendChild(svgNode('circle', { cx, cy, r: DOT_CELL * 0.36, class: `dot dot-${kind}` }));
    if (kind === 'gone') holder.appendChild(dotCross(cx, cy));
  }
  if (visual.crossable) makeCrossable(svg);
  return svg;
}

function dotCross(cx, cy) {
  const d = DOT_CELL * 0.3;
  return svgNode('path', { d: `M${cx - d} ${cy - d}L${cx + d} ${cy + d}M${cx + d} ${cy - d}L${cx - d} ${cy + d}`, class: 'dot-cross' });
}

// Wegstrepen (D22): a tap crosses a dot out, a second tap brings it back. The answer box keeps the
// focus (the iPad keyboard must stay up, see CLAUDE.md): the touch or mouse press is cancelled
// before it can move the focus, and the box is focused again in case a browser moved it anyway.
// How many dots are crossed out is kept on the sum, for the session log.
function makeCrossable(svg) {
  currentExercise.crossed = 0;
  const toggle = (event) => {
    event.preventDefault();
    const group = event.target.closest && event.target.closest('.dot-tap');
    if (group) {
      const circle = group.querySelector('circle');
      const crossed = group.classList.toggle('crossed');
      circle.classList.toggle('dot-a', !crossed);
      circle.classList.toggle('dot-gone', crossed);
      const cross = group.querySelector('.dot-cross');
      if (crossed) group.appendChild(dotCross(Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy'))));
      else if (cross) cross.remove();
      currentExercise.crossed = svg.querySelectorAll('.dot-tap.crossed').length;
    }
    if (!activeInputs().includes(document.activeElement)) answerInputs[0].focus();
  };
  // A touch is handled as a touch only: cancelling it also stops the mouse events a browser makes
  // from it, so one tap never toggles twice.
  svg.addEventListener('touchstart', toggle, { passive: false });
  svg.addEventListener('mousedown', toggle);
}

// A strook (bar) split into equal parts, the first `coloured` parts filled - the classroom breukenkast.
function strookSvg(visual) {
  const width = 320;
  const height = 56;
  const svg = svgNode('svg', { viewBox: `-2 -2 ${width + 4} ${height + 4}`, class: 'strook', role: 'img' });
  svg.setAttribute('aria-label', `Strook in ${visual.parts} gelijke stukken, ${visual.coloured} gekleurd`);
  const partWidth = width / visual.parts;
  for (let i = 0; i < visual.parts; i++) {
    svg.appendChild(svgNode('rect', {
      x: i * partWidth, y: 0, width: partWidth, height, class: i < visual.coloured ? 'strook-part coloured' : 'strook-part'
    }));
  }
  return svg;
}

// Everything in a sum (question, picture, hint, answer box) should fit above the iPad keyboard
// without scrolling. Font sizes in the session use --fit; shrink step by step until the card fits.
function fitSessionToScreen() {
  if (el('screen-session').classList.contains('hidden')) return;
  const style = document.body.style;
  const card = document.querySelector('.card');
  const view = window.visualViewport;
  const visibleHeight = view ? view.height : window.innerHeight;
  const visibleWidth = view ? view.width : window.innerWidth;
  // Wide but short (an iPad lying down with the keyboard up): question left, answer right. Decided
  // from what is really visible; the page's own height doesn't change when the keyboard comes up.
  document.body.classList.toggle('wide-short', visibleWidth > visibleHeight && visibleHeight <= WIDE_SHORT_MAX_HEIGHT);
  let fit = 1;
  style.setProperty('--fit', fit);
  while (card.getBoundingClientRect().bottom > visibleHeight && fit > MIN_FIT + 0.001) {
    fit = Math.round((fit - FIT_STEP) * 100) / 100;
    style.setProperty('--fit', fit);
  }
}

// 🔊 Read aloud with the device's own Dutch voice, only on a tap. The question has its own
// spoken sentence ("Hoeveel is 3 plus 4?"); a shown hint or solution is read after it.
function dutchVoice() {
  return window.speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').toLowerCase().startsWith('nl'));
}

// Some browsers list their voices only later; an empty list is worth a try with lang nl-NL.
function canSpeakDutch() {
  if (!('speechSynthesis' in window)) return false;
  return window.speechSynthesis.getVoices().length === 0 || !!dutchVoice();
}

function toSpeech(text) {
  return text
    .replace(/ \+ /g, ' plus ')
    .replace(/ - /g, ' min ')
    .replace(/ = \?/g, ' is hoeveel?')
    .replace(/ = /g, ' is ')
    .replace(/ [x×] /g, ' keer ')
    .replace(/ : /g, ' gedeeld door ');
}

function speakExercise() {
  if (!currentExercise || !('speechSynthesis' in window)) return;
  const parts = [currentExercise.speech || toSpeech(currentExercise.prompt)];
  const feedback = el('feedback');
  if (feedback.textContent && !feedback.classList.contains('feedback-correct')) parts.push(toSpeech(feedback.textContent));
  speakText(parts.join(' '));
}

function speakText(text) {
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'nl-NL';
  const voice = dutchVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function updateSpeakButton() {
  el('speak-button').classList.toggle('hidden', !(activeProfile() && offersReadAloud(activeProfile()) && canSpeakDutch()));
}

function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function readAnswer() {
  const inputs = activeInputs();
  // A child used to writing "5/8" may type the whole fraction in the teller box.
  const typedFraction = currentExercise.answerLayout === 'fraction'
    && inputs[1].value.trim() === ''
    && inputs[0].value.match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
  if (typedFraction) {
    return { values: { teller: Number(typedFraction[1]), noemer: Number(typedFraction[2]) }, complete: true, valid: true };
  }
  // Likewise a whole time, "3:15" or "3.15", in the hour box.
  const typedTime = currentExercise.answerLayout === 'time'
    && inputs[1].value.trim() === ''
    && inputs[0].value.match(/^\s*(\d{1,2})\s*[:.]\s*(\d{1,2})\s*$/);
  if (typedTime) {
    return { values: { uur: Number(typedTime[1]), minuten: Number(typedTime[2]) }, complete: true, valid: true };
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
  if (currentExercise.answerLayout === 'time') return tijdTekst(values.uur, values.minuten);
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
  if (tempo) {
    onTempoSubmit();
    return;
  }
  if (session.awaitingNext || session.pendingPick) return; // already answered correctly, or a worked example is showing
  const { values, complete, valid } = readAnswer();
  // An empty field or something that isn't a number is not a wrong answer - it shouldn't count against mastery.
  if (!complete) return;
  if (!valid) {
    el('feedback').textContent = { fraction: INVALID_FRACTION_MESSAGE, time: INVALID_TIME_MESSAGE }[currentExercise.answerLayout] || INVALID_NUMBER_MESSAGE;
    el('feedback').className = 'feedback feedback-hint';
    clearAnswerFields();
    fitSessionToScreen();
    return;
  }

  if (looksLikeMashing(values)) {
    el('feedback').textContent = MASH_MESSAGE;
    el('feedback').className = 'feedback feedback-hint';
    clearAnswerFields();
    fitSessionToScreen();
    return;
  }

  currentExercise.answersGiven.push(formatAnswer(values));
  // Wegstrepen (D22): how many dots were crossed out at the first answer, for the session log.
  if (currentExercise.answersGiven.length === 1 && currentExercise.crossed !== undefined) currentExercise.crossedAtAnswer = currentExercise.crossed;
  if (isCorrect(values)) {
    concludeExercise(true);
  } else {
    session.hadMistake = true;
    session.hintLevel += 1;
    if (session.hintLevel >= MAX_HINT_LEVEL) {
      concludeExercise(false);
    } else {
      // The starting number typed as the first answer (9 for 9 - 2): a tip about exactly that (D22).
      // A second time the usual next hint follows (count back), which helps more than the tip again.
      const tip = currentExercise.startNumberTip;
      showHint(tip && session.hintLevel === 1 && values.antwoord === tip.value ? tip.text : null);
    }
  }
}

// Far too many digits (a young child drumming on the keyboard) is not a wrong answer.
function looksLikeMashing(values) {
  const numbers = (object) => Object.values(object).filter((v) => typeof v === 'number').map(Math.abs);
  const limit = 10 ** (String(Math.trunc(Math.max(1, ...numbers(currentExercise.correctAnswer)))).length + MASH_EXTRA_DIGITS);
  return numbers(values).some((v) => v >= limit);
}

// `text`: instead of the usual hint for this level (a tip about the mistake just made).
function showHint(text = null) {
  const hintText = text || getHint(currentExercise.exerciseType, session.hintLevel, currentExercise.hintContext);
  el('feedback').textContent = hintText;
  el('feedback').className = 'feedback feedback-hint';
  // For a child who can't read yet, the picture is the real hint.
  if (currentExercise.hintVisual) renderVisual(currentExercise.hintVisual);
  clearAnswerFields();
  fitSessionToScreen();
}

function clearAnswerFields() {
  activeInputs().forEach((i) => { i.value = ''; });
  answerInputs[0].focus();
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
  // Compared with the level just before this answer: a level changed on another iPad meanwhile
  // (merged in, D20) is not a level up earned here.
  const tierBefore = skillState.tier;
  // Right but slow (pauses excluded): counts as right, but not towards a level up. Not for word
  // problems: reading the story takes time too.
  const slow = recordedCorrect && spentMs > SLOW_ANSWER_MS && currentExercise.prompt.length <= LONG_PROMPT_CHARS;
  const levelChange = recordAnswer(skill, skillState, recordedCorrect, groepCeilingTier(skill, session.groep), slow, {
    calibrationTop: groepStartTier(skill, session.groep),
    solutionShown: !solved
  });
  session.justStruggled = !solved;
  if (skillState.tier > tierBefore) session.levelUps.push(skill.category);
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
    // Picture sums all ask the same question: the log also says what the picture showed.
    prompt: currentExercise.logPrompt || currentExercise.prompt,
    answers: currentExercise.answersGiven,
    firstTryCorrect: recordedCorrect,
    slow,
    hintsShown: Math.min(session.hintLevel, MAX_HINT_LEVEL - 1),
    solutionShown: !solved,
    seconds: Math.round(spentMs / 1000),
    reason: currentExercise.pickReason,
    levelChange: [currentExercise.ceilingChange, levelChange].filter(Boolean).join('; ') || null,
    ...(currentExercise.crossedAtAnswer !== undefined ? { crossed: currentExercise.crossedAtAnswer } : {})
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
    if (currentExercise.hintVisual) renderVisual(currentExercise.hintVisual);
  }

  updateProgress();
  el('next-button').textContent = sessionTimeReached() ? 'Klaar!' : 'Volgende';
  el('next-button').classList.remove('hidden');
  if (solved) {
    // Keep the flow going: the answer box stays visible and focused (so the iPad keyboard stays
    // up) and the next sum follows by itself. "Volgende" remains for an impatient tap.
    session.awaitingNext = true;
    el('submit-button').classList.add('hidden');
    session.autoNextTimer = setTimeout(onNext, AUTO_NEXT_MS);
  } else {
    // After a shown solution the child taps on, so it gets read (the keyboard goes down meanwhile).
    el('answer-area').classList.add('hidden');
    el('next-button').focus();
  }
  fitSessionToScreen();
}

// Pause: nothing runs on (no auto-continue, no time counted) until the child taps Verder.
function pauseSession() {
  // A Tempo-ronde can't be paused (the clock is the point): leaving the app drops the round.
  if (tempo) {
    stopTempo();
    return;
  }
  if (!session || session.pausedAt || el('screen-session').classList.contains('hidden')) return;
  clearTimeout(session.autoNextTimer);
  session.autoNextTimer = null;
  session.pausedAt = Date.now();
  if (document.activeElement) document.activeElement.blur(); // keyboard down
  showScreen('pause');
}

function resumeSession() {
  if (!session || !session.pausedAt) return;
  // The pause doesn't count as time spent on this sum (nor towards the session's minutes).
  session.exerciseStartedAt += Date.now() - session.pausedAt;
  session.pausedAt = null;
  showScreen('session');
  // This tap is what lets the iPad open the keyboard again, so focus now, not later.
  if (session.awaitingNext) {
    onNext(); // paused during "Goed!": straight on to the next sum
  } else if (!el('answer-area').classList.contains('hidden')) {
    answerInputs[0].focus();
  } else {
    el('next-button').focus();
  }
  fitSessionToScreen();
}

function sessionTimeReached() {
  return session.activeMs >= session.targetMs;
}

function updateProgress() {
  const pct = Math.min(100, (session.activeMs / session.targetMs) * 100);
  el('progress-fill').style.width = `${pct}%`;
}

function onNext() {
  if (tempo) { // the Start! button of a Tempo-ronde
    startTempoRound();
    return;
  }
  // A tap during the auto-continue pause and the timer must not both advance.
  clearTimeout(session.autoNextTimer);
  session.autoNextTimer = null;
  if (el('next-button').classList.contains('hidden')) return;
  if (session.pendingPick) {
    // The worked example has been looked at: now the child's own sum of that kind.
    const pick = session.pendingPick;
    session.pendingPick = null;
    renderExercise(pick);
    return;
  }
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
  celebrations.push(...starCelebrations(profile, session.starsAtStart));
  if (session.solvedWithHelp > 0) {
    const n = session.solvedWithHelp;
    celebrations.push(`Je hebt ${n} ${n === 1 ? 'som' : 'sommen'} opgelost met een hint: goed doorgezet!`);
  }

  session.record.completed = true;
  saveState(appState);

  el('summary-score').textContent = `${totalCorrect} van de ${totalAttempts} goed`;
  el('summary-count').textContent = `${totalAttempts} ${totalAttempts === 1 ? 'som' : 'sommen'} gemaakt`;
  el('summary-stars').textContent = `+${session.starsEarned + bonus} ★ verdiend · ★ ${walletStars(profile)} in je spaarpot`;
  el('summary-park-badge').classList.toggle('hidden', unreadChapters(profile) === 0);
  renderStarGoal(el('summary-goal-fill'), el('summary-goal-text'), profile.stars);
  renderCelebrations('summary-celebrations', celebrations);
  renderList('summary-strong', strong, 'Nog geen duidelijk sterke vaardigheden deze keer.');
  renderList('summary-practice', needsPractice, 'Niets om extra te oefenen — sterk gedaan!');
  renderWeek(el('summary-week-dots'), el('summary-week-message'), profile);

  showScreen('summary');
}

// What the stars earned since `starsBefore` brought: a new animal in the park, the family goal.
function starCelebrations(profile, starsBefore) {
  const lines = charactersUnlockedBetween(starsBefore, profile.stars)
    .map((character) => `Nieuw in je park: ${character.emoji} ${character.name}! Er is een nieuw hoofdstuk.`);
  if (familyGoalReachedBetween(profile.familyGoal, starsBefore, profile.stars)) {
    lines.push(`Groot doel gehaald: ${profile.familyGoal.text}! Laat het aan je ouders zien.`);
  }
  return lines;
}

function renderCelebrations(listId, items) {
  const list = el(listId);
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

// ---- Tempo-ronde (rules in js/tempo.js) ----

function showTempoMenu() {
  if (!activeProfile()) { // the child was removed on another iPad meanwhile
    showProfiles();
    return;
  }
  const container = el('tempo-kinds');
  container.innerHTML = '';
  tempoKindsFor(activeProfile()).forEach(({ kind, open, best, lockText }) => {
    const button = Object.assign(document.createElement('button'), { type: 'button', className: 'tempo-kind', disabled: !open });
    button.appendChild(Object.assign(document.createElement('span'), { className: 'tempo-kind-name', textContent: `${open ? '' : '🔒 '}${kind.name}` }));
    button.appendChild(Object.assign(document.createElement('span'), { className: 'tempo-kind-example', textContent: kind.example }));
    const status = !open ? lockText : best === null ? 'Nog geen record' : `Record: ${best}`;
    button.appendChild(Object.assign(document.createElement('span'), { className: 'tempo-kind-status', textContent: status }));
    if (open) button.addEventListener('click', () => startTempo(kind.id));
    container.appendChild(button);
  });
  showScreen('tempo');
}

function startTempo(kindId) {
  appState = loadState(); // as startSession: pick up a backup restored in another tab
  if (!activeProfile()) {
    showProfiles();
    return;
  }
  tempo = { kindId, round: 1, running: false, timer: null, endsAt: 0, readyAt: 0, sumStartedAt: 0, score: 0, answers: [] };
  showScreen('session');
  showTempoGetReady();
}

// Before each round: a tap on Start. That tap is also what lets the iPad open the keyboard.
function showTempoGetReady() {
  const kind = TEMPO_KINDS.find((k) => k.id === tempo.kindId);
  el('exercise-prompt').classList.remove('long');
  el('exercise-prompt').textContent = `${kind.name} · ronde ${tempo.round} van ${TEMPO_ROUNDS}`;
  renderVisual(null);
  el('feedback').textContent = tempo.round === 1
    ? '1 minuut. Maak zoveel sommen als je kunt!'
    : 'Even ademhalen. Dan nog 1 minuut!';
  el('feedback').className = 'feedback feedback-hint';
  el('progress-fill').style.width = '100%';
  el('answer-area').classList.add('hidden');
  el('next-button').textContent = 'Start!';
  el('next-button').classList.remove('hidden');
  window.scrollTo(0, 0);
  fitSessionToScreen();
}

function startTempoRound() {
  if (tempo.running || Date.now() < tempo.readyAt) return;
  tempo.running = true;
  tempo.endsAt = Date.now() + TEMPO_ROUND_MS;
  el('feedback').textContent = '';
  el('feedback').className = 'feedback';
  el('next-button').classList.add('hidden');
  el('answer-area').classList.remove('hidden');
  el('submit-button').classList.remove('hidden');
  nextTempoSum();
  answerInputs[0].focus();
  layoutAnswerFields();
  tempo.timer = setInterval(tickTempo, 200);
  window.scrollTo(0, 0);
  fitSessionToScreen();
}

function tickTempo() {
  const left = tempo.endsAt - Date.now();
  el('progress-fill').style.width = `${Math.max(0, (left / TEMPO_ROUND_MS) * 100)}%`;
  if (left <= 0) endTempoRound();
}

function nextTempoSum() {
  currentExercise = tempoSum(tempo.kindId, currentExercise && currentExercise.prompt, tempoTables(activeProfile()));
  tempo.sumStartedAt = Date.now();
  renderPrompt(currentExercise);
  answerInputs[0].value = '';
}

// No right or wrong on screen and no hint: straight on to the next sum, as on the paper test.
function onTempoSubmit() {
  if (!tempo.running || Date.now() >= tempo.endsAt) return; // time is up, the timer just hasn't ticked yet
  const typed = answerInputs[0].value.trim();
  if (typed === '') return;
  const value = parseDutchInteger(typed);
  // Not a number, or far too many digits (drumming on the keyboard): not an answer.
  if (Number.isNaN(value) || looksLikeMashing({ antwoord: value })) {
    answerInputs[0].value = '';
    return;
  }
  const correct = value === currentExercise.correctAnswer.antwoord;
  if (correct) tempo.score += 1;
  tempo.answers.push({ solved: currentExercise.solved, correct, ms: Date.now() - tempo.sumStartedAt });
  nextTempoSum();
}

// Time is up: a sum that was half typed doesn't count.
function endTempoRound() {
  clearInterval(tempo.timer);
  tempo.timer = null;
  tempo.running = false;
  if (tempo.round < TEMPO_ROUNDS) {
    tempo.round += 1;
    tempo.readyAt = Date.now() + TEMPO_START_GUARD_MS;
    showTempoGetReady();
  } else {
    showTempoResult();
  }
}

// ✕, or the app going to the background: the round is dropped and simply doesn't count.
function stopTempo() {
  if (!tempo) return;
  clearInterval(tempo.timer);
  tempo = null;
  if (document.activeElement) document.activeElement.blur(); // keyboard down
  showTempoMenu();
}

function showTempoResult() {
  const { kindId, score, answers } = tempo;
  tempo = null;
  if (document.activeElement) document.activeElement.blur();
  const profile = activeProfile();
  if (!profile) {
    showProfiles();
    return;
  }
  const starsBefore = profile.stars || 0;
  const result = recordTempoRound(profile, kindId, score, answers.filter((a) => !a.correct).length);
  saveState(appState);

  el('tempo-score').textContent = `${score} goed in ${TEMPO_ROUNDS} minuten`;
  el('tempo-record').textContent = result.first ? 'Dat is nu je record. Kun je het verbeteren?'
    : result.isRecord ? `Nieuw record! Het was ${result.previousBest}.`
      : score > 0 && score === result.previousBest ? `Precies je record van ${result.previousBest}!`
        : `Je record is ${result.previousBest}.`;
  el('tempo-record').classList.toggle('is-record', result.isRecord);
  el('tempo-stars').textContent = result.stars
    ? `+${result.stars} ★ verdiend · ★ ${walletStars(profile)} in je spaarpot`
    : '';
  renderCelebrations('tempo-celebrations', starCelebrations(profile, starsBefore));
  const misses = tempoMisses(answers);
  el('tempo-misses-block').classList.toggle('hidden', misses.length === 0);
  renderList('tempo-misses', misses, '');
  el('tempo-again-button').dataset.kind = kindId;
  showScreen('tempo-result');
}

// Another tab (the parent view) changed the saved data, e.g. restored a backup: adopt it
// instead of overwriting it on the next save. A running session's record is kept.
window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE_KEY) return;
  appState = loadState();
  if (activeProfile()) loadChildSkills();
  if (session) {
    const same = appState.sessions.find((s) => s.id === session.record.id);
    if (same) session.record = same;
    else appState.sessions.push(session.record);
  }
});

window.addEventListener('DOMContentLoaded', init);
