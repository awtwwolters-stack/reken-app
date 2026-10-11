// Parent/debug view: session history, backup, and what the adaptive system knows per skill.
// Deliberately functional rather than polished. All text is set with textContent, never as
// HTML, because a restored backup file is outside data.

function formatDate(timestamp) {
  if (!timestamp) return 'nooit';
  const d = new Date(timestamp);
  return d.toLocaleDateString('nl-NL') + ' ' + d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

function node(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined && text !== null) e.textContent = String(text);
  if (className) e.className = className;
  return e;
}

function tableRow(cells, cellTag = 'td') {
  const tr = document.createElement('tr');
  cells.forEach((c) => tr.appendChild(node(cellTag, c)));
  return tr;
}

function skillName(skillsById, id) {
  return skillsById[id] ? skillsById[id].name : id;
}

function helpText(ex) {
  if (ex.firstTryCorrect) return ex.slow ? 'meteen goed, maar traag (telt niet om omhoog te gaan)' : 'meteen goed';
  const hints = ex.hintsShown === 1 ? '1 hint' : `${ex.hintsShown} hints`;
  return ex.solutionShown ? `${hints} + uitleg getoond` : `${hints}, toen goed`;
}

const ALL_CHILDREN = 'all';
const OVERVIEW_DAYS = 7;

// Named children only ('' for the old unnamed test profile and removed children).
function childName(state, profileId) {
  const profile = state.profiles[profileId];
  return profile && profile.name ? profile.name : '';
}

// "niveau 2 → 3: ..." (several joined by "; "): how often a level went up and down.
function levelMoves(exercises) {
  let up = 0;
  let down = 0;
  exercises.forEach((ex) => {
    const matches = (ex.levelChange || '').match(/niveau \d+ → \d+/g) || [];
    matches.forEach((m) => {
      const [from, to] = m.match(/\d+/g).map(Number);
      if (to > from) up += 1; else down += 1;
    });
  });
  return { up, down };
}

// Where a child stands compared with their own groep: the average over practised skills of
// (level - the level that fits the start of their groep).
function levelVersusGroep(profile, skillsById) {
  const groep = practiceGroep(profile);
  const practised = Object.entries(profile.skills || {}).filter(([id, st]) => skillsById[id] && st.totalAttempts > 0);
  if (practised.length === 0) return '-';
  const average = (list) => list.reduce((a, b) => a + b, 0) / list.length;
  const level = average(practised.map(([, st]) => st.tier));
  const versus = average(practised.map(([id, st]) => st.tier - groepStartTier(skillsById[id], groep)));
  const nl = (n) => n.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const place = Math.abs(versus) < 0.25 ? `op het niveau van groep ${groep}` : `${nl(Math.abs(versus))} ${versus > 0 ? 'boven' : 'onder'} groep ${groep}`;
  return `${nl(level)} (${place})`;
}

// One row per child for the last week: how much they practised and which way their levels moved.
function renderOverview(state, skillsById) {
  const tbody = document.getElementById('overview-body');
  tbody.innerHTML = '';
  const since = Date.now() - OVERVIEW_DAYS * 24 * 60 * 60 * 1000;
  listProfiles(state).forEach(({ id, profile }) => {
    const sessions = (state.sessions || []).filter((s) => s.profileId === id && Array.isArray(s.exercises) && s.exercises.length > 0 && new Date(s.startedAt).getTime() >= since);
    const exercises = sessions.flatMap((s) => s.exercises);
    const firstTry = exercises.filter((e) => e.firstTryCorrect).length;
    const moves = levelMoves(exercises);
    tbody.appendChild(tableRow([
      profile.name,
      currentGroep(profile),
      `${sessions.length} (${sessions.filter((s) => s.completed).length} afgerond)`,
      Math.round(sessions.reduce((n, s) => n + (s.activeSeconds || 0), 0) / 60),
      exercises.length,
      exercises.length ? `${Math.round((firstTry / exercises.length) * 100)}%` : '-',
      `${moves.up} omhoog, ${moves.down} omlaag`,
      levelVersusGroep(profile, skillsById),
      `${profile.stars || 0} ★`
    ]));
  });
}

function renderSessions(state, skillsById, profileId) {
  const container = document.getElementById('parent-sessions');
  container.innerHTML = '';
  const everyone = profileId === ALL_CHILDREN;
  const sessions = (state.sessions || []).filter((s) => everyone ? childName(state, s.profileId) : s.profileId === profileId).reverse();
  if (sessions.length === 0) {
    container.appendChild(node('p', 'Nog geen sessies gedaan.'));
    return;
  }

  sessions.forEach((s) => {
    const details = node('details');
    const exercises = s.exercises;

    if (!Array.isArray(exercises)) {
      // Session saved before the answer history existed: only totals are known.
      details.appendChild(node('summary', `${formatDate(s.startedAt || s.date)} — ${s.totalCorrect} van ${s.totalAttempts} goed (geen details bewaard)`));
      container.appendChild(details);
      return;
    }

    const minutes = Math.round((s.activeSeconds || 0) / 60);
    const firstTry = exercises.filter((e) => e.firstTryCorrect).length;
    const pct = exercises.length ? Math.round((firstTry / exercises.length) * 100) : 0;
    // The child's name first: with several children the list is scanned by who did what.
    const summary = node('summary', '');
    summary.appendChild(node('strong', childName(state, s.profileId)));
    summary.appendChild(document.createTextNode(` — ${formatDate(s.startedAt)} — ${minutes} min, ${exercises.length} ${exercises.length === 1 ? 'som' : 'sommen'}, ${pct}% meteen goed — `));
    summary.appendChild(s.completed ? node('span', 'afgerond') : node('strong', `gestopt na ${minutes} min`, 'stopped'));
    details.appendChild(summary);

    const skills = (s.skills || []).map((k) => `${skillName(skillsById, k.skillId)} (${k.reason})`).join('; ');
    details.appendChild(node('p', `Gekozen vaardigheden: ${skills}`));

    const table = node('table');
    table.appendChild(tableRow(['Tijd', 'Vaardigheid', 'Niveau', 'Som', 'Antwoorden', 'Hulp', 'Seconden', 'Waarom gekozen', 'Niveauwijziging'], 'th'));
    exercises.forEach((ex) => {
      table.appendChild(tableRow([
        new Date(ex.at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
        skillName(skillsById, ex.skillId),
        ex.tier,
        ex.prompt,
        (ex.answers || []).join(' → '),
        helpText(ex),
        ex.seconds,
        ex.reason,
        ex.levelChange || ''
      ]));
    });
    details.appendChild(table);
    container.appendChild(details);
  });
}

// "3 / 4", or "3 / 4 (max 3 voor groep 5)" when the ceiling is below the top level.
function levelText(skill, skillState, groep) {
  const ceiling = groepCeilingTier(skill, groep);
  // A stored level above the ceiling comes down at the child's next sum; show where it will be.
  const text = `${Math.min(skillState.tier, ceiling)} / ${maxTier(skill)}`;
  return ceiling < maxTier(skill) ? `${text} (max ${ceiling} voor groep ${groep})` : text;
}

function renderSkills(state, profileId) {
  document.getElementById('skills-section').classList.toggle('hidden', profileId === ALL_CHILDREN);
  document.getElementById('skills-choose-child').classList.toggle('hidden', profileId !== ALL_CHILDREN);
  if (profileId === ALL_CHILDREN) return;
  const profile = state.profiles[profileId];
  const profileSkills = (profile && profile.skills) || {};
  const tbody = document.getElementById('parent-table-body');
  tbody.innerHTML = '';

  // Only this child's skills; the not-yet-built groep-6 topics are listed for the older children.
  const groep = practiceGroep(profile);
  const childSkills = skillsForGroep(CURRICULUM.skills, groep);
  const childSkillsById = Object.fromEntries(childSkills.map((s) => [s.id, s]));
  const unbuilt = groep >= 5 ? CURRICULUM.skills.filter((s) => !s.implemented) : [];
  [...childSkills, ...unbuilt].forEach((skill) => {
    if (!skill.implemented) {
      const row = tableRow([skill.name, skill.domain]);
      const note = node('td', 'nog niet gebouwd (staat in de data, wachtend op implementatie)', 'not-implemented');
      note.colSpan = 7;
      row.appendChild(note);
      tbody.appendChild(row);
      return;
    }

    const skillState = stateOrNew(skill, profileSkills, childSkillsById, groep);
    const rate = successRate(skillState);
    const { bucket, reason } = classifySkill(skill, skillState, profileSkills);
    const change = skillState.lastTierChange;
    tbody.appendChild(tableRow([
      skill.name,
      skill.domain,
      levelText(skill, skillState, groep),
      rate === null ? '-' : `${Math.round(rate * 100)}%`,
      skillState.totalAttempts,
      formatDate(skillState.lastPracticed),
      bucket,
      reason,
      change ? `${formatDate(change.at)}: ${change.reason}` : '-'
    ]));
  });
}

function renderBackupStatus(state) {
  const status = document.getElementById('backup-status');
  if (!state.lastBackupAt) {
    status.textContent = 'Nog geen back-up gemaakt. De voortgang staat alleen in deze browser.';
    return;
  }
  const days = Math.floor((Date.now() - state.lastBackupAt) / (1000 * 60 * 60 * 24));
  status.textContent = `Laatste back-up: ${formatDate(state.lastBackupAt)} (${days === 0 ? 'vandaag' : `${days} dag(en) geleden`}).`;
}

function renderParentView() {
  const state = loadState();
  const skillsById = Object.fromEntries(CURRICULUM.skills.map((s) => [s.id, s]));
  const profileId = renderChildSelect(state);
  renderOverview(state, skillsById);
  renderBackupStatus(state);
  renderSessions(state, skillsById, profileId);
  renderSkills(state, profileId);
}

// Keeps the current choice; otherwise all children together. Returns the chosen profile id (or ALL_CHILDREN).
function renderChildSelect(state) {
  const select = document.getElementById('child-select');
  const previous = select.value;
  const profiles = listProfiles(state);
  select.innerHTML = '';
  select.appendChild(Object.assign(document.createElement('option'), { value: ALL_CHILDREN, textContent: 'Alle kinderen' }));
  profiles.forEach(({ id, profile }) => select.appendChild(Object.assign(document.createElement('option'), { value: id, textContent: profile.name })));
  const ids = [ALL_CHILDREN].concat(profiles.map((p) => p.id));
  select.value = ids.includes(previous) ? previous : ALL_CHILDREN;
  return select.value;
}

function showBackupMessage(text, isError = false) {
  const message = document.getElementById('backup-message');
  message.textContent = text;
  message.className = isError ? 'error' : '';
}

function backupFileName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `reken-app-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// The first shareable variant: some share sheets refuse application/json but accept text/plain.
function shareableFile(contents, name) {
  if (!navigator.share || !navigator.canShare) return null;
  for (const type of ['application/json', 'text/plain']) {
    const file = new File([contents], name, { type });
    if (navigator.canShare({ files: [file] })) return file;
  }
  return null;
}

// Every outcome shows a message: a tap that seems to do nothing is indistinguishable from a bug.
async function makeBackup() {
  showBackupMessage('Back-up maken…');
  const state = loadState();
  state.lastBackupAt = Date.now();
  const contents = backupFileContents(state);
  const name = backupFileName();
  const shareable = shareableFile(contents, name);
  try {
    if (shareable) {
      // On the iPad this opens the share sheet (save to Files, AirDrop, mail).
      await navigator.share({ files: [shareable], title: 'Reken App back-up' });
      showBackupMessage(`Back-up gedeeld: ${name}. Kies "Bewaar in Bestanden" als je hem op de iPad wilt bewaren.`);
    } else {
      downloadFile(new File([contents], name, { type: 'application/json' }));
      showBackupMessage(`Back-up gedownload: ${name} (kijk bij Downloads of in Bestanden).`);
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      showBackupMessage('Opslaan geannuleerd: er is geen back-up gemaakt.', true);
      return;
    }
    showBackupMessage(`Back-up mislukt (${e.name}: ${e.message}). Stuur deze melding door, dan zoeken we het uit.`, true);
    return;
  }
  saveState(state);
  renderBackupStatus(state);
}

// Works without any file or share support: the backup travels as plain text (Notities, mail).
async function copyBackup() {
  const state = loadState();
  state.lastBackupAt = Date.now();
  const contents = backupFileContents(state);
  try {
    await navigator.clipboard.writeText(contents);
    saveState(state);
    renderBackupStatus(state);
    showBackupMessage('Back-up gekopieerd. Plak hem nu in Notities of mail hem naar jezelf.');
  } catch (e) {
    const box = document.getElementById('backup-text');
    box.value = contents;
    box.focus();
    box.select();
    showBackupMessage('Automatisch kopiëren lukte niet. De back-up staat in het vak hieronder: selecteer alles en kopieer.', true);
  }
}

function restoreFromPaste() {
  const text = document.getElementById('backup-text').value.trim();
  if (!text) {
    showBackupMessage('Plak eerst een back-up in het vak.', true);
    return;
  }
  restoreFromText(text);
}

async function restoreBackup(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  restoreFromText(await file.text());
}

function restoreFromText(text) {
  let imported;
  try {
    imported = parseBackupFile(text);
  } catch (e) {
    showBackupMessage('Dit is geen geldige Reken App back-up. Er is niets veranderd.', true);
    return;
  }
  const when = imported.lastBackupAt ? formatDate(imported.lastBackupAt) : 'een onbekende datum';
  if (window.Cloud && ['loading', 'linking'].includes(window.Cloud.state)) {
    showBackupMessage('De cloud is nog aan het laden. Probeer het over een paar seconden opnieuw; er is niets veranderd.', true);
    return;
  }
  const everywhere = window.Cloud && window.Cloud.state === 'on' ? ' op alle iPads' : '';
  if (!confirm(`Dit vervangt alle huidige voortgang${everywhere} door de back-up van ${when}. Doorgaan?`)) return;

  imported = migrateState(imported);
  saveState(imported);
  if (window.Cloud) window.Cloud.removeMissing(imported);
  renderParentView();
  showBackupMessage('Back-up teruggezet.');
}

// This iPad's own data from before its first sync, kept aside when the family data was merged.
function renderPreCloudBackup() {
  let contents = null;
  try { contents = localStorage.getItem(PRE_CLOUD_BACKUP_KEY); } catch (e) { contents = null; }
  document.getElementById('precloud').classList.toggle('hidden', !contents);
  document.getElementById('precloud-button').onclick = () => downloadFile(new File([contents], 'reken-app-backup-voor-synchroniseren.json', { type: 'application/json' }));
}

// Cloud sync (js/cloud.js): changes from other iPads show up here as they come in.
function startCloudSync() {
  if (!window.Cloud) return;
  window.Cloud.start({
    getState: loadState,
    replaceState: (state) => { saveState(state); renderParentView(); renderPreCloudBackup(); },
    remoteChanges: (changes) => {
      const state = loadState();
      if (changes.map((c) => applyRemoteChange(state, c)).some(Boolean)) {
        saveState(state);
        renderParentView();
      }
    },
    statusChanged: () => {}
  });
}

window.addEventListener('DOMContentLoaded', () => {
  if (typeof pageIsStale === 'function' && pageIsStale()) return; // old page copy: a fresh one is on its way
  document.getElementById('backup-button').addEventListener('click', makeBackup);
  document.getElementById('restore-input').addEventListener('change', restoreBackup);
  document.getElementById('child-select').addEventListener('change', renderParentView);
  document.getElementById('copy-backup-button').addEventListener('click', copyBackup);
  document.getElementById('paste-restore-button').addEventListener('click', restoreFromPaste);
  document.getElementById('selftest-button').addEventListener('click', () => {
    // js/selftest.js: every kind of sum, on this device, in this browser.
    const box = document.getElementById('selftest-result');
    box.textContent = 'Bezig met controleren…';
    box.className = '';
    // A moment later, so "Bezig" is on screen first: on an older iPad the check takes a few seconds.
    setTimeout(() => {
      let result;
      try {
        result = runSelfTest();
      } catch (e) {
        box.textContent = `✗ De controle zelf liep vast: ${e.message}. Maak een foto en stuur hem door.`;
        box.className = 'error';
        return;
      }
      box.textContent = selfTestSummary(result).join('\n');
      box.className = result.problems.length ? 'error' : '';
    }, 50);
  });
  document.getElementById('app-version').textContent = `versie ${APP_VERSION}`;
  renderParentView();
  renderPreCloudBackup();
  startCloudSync();
});
