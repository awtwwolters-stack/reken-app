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
  if (ex.firstTryCorrect) return 'meteen goed';
  const hints = ex.hintsShown === 1 ? '1 hint' : `${ex.hintsShown} hints`;
  return ex.solutionShown ? `${hints} + uitleg getoond` : `${hints}, toen goed`;
}

function renderSessions(state, skillsById, profileId) {
  const container = document.getElementById('parent-sessions');
  container.innerHTML = '';
  const sessions = (state.sessions || []).filter((s) => s.profileId === profileId).reverse();
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
    const summary = node('summary', `${formatDate(s.startedAt)} — ${minutes} min, ${exercises.length} ${exercises.length === 1 ? 'som' : 'sommen'}, ${pct}% meteen goed — `);
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

function renderSkills(state, skillsById, profileId) {
  const profile = state.profiles[profileId];
  const profileSkills = (profile && profile.skills) || {};
  const tbody = document.getElementById('parent-table-body');
  tbody.innerHTML = '';

  CURRICULUM.skills.forEach((skill) => {
    if (!skill.implemented) {
      const row = tableRow([skill.name, skill.domain]);
      const note = node('td', 'nog niet gebouwd (staat in de data, wachtend op implementatie)', 'not-implemented');
      note.colSpan = 7;
      row.appendChild(note);
      tbody.appendChild(row);
      return;
    }

    const skillState = stateOrNew(skill, profileSkills, skillsById, practiceGroep(profile));
    const rate = successRate(skillState);
    const { bucket, reason } = classifySkill(skill, skillState, profileSkills);
    const change = skillState.lastTierChange;
    tbody.appendChild(tableRow([
      skill.name,
      skill.domain,
      `${skillState.tier} / ${maxTier(skill)}`,
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
  renderBackupStatus(state);
  renderSessions(state, skillsById, profileId);
  renderSkills(state, skillsById, profileId);
}

// Keeps the current choice; otherwise the child who practised last. Returns the chosen profile id.
function renderChildSelect(state) {
  const select = document.getElementById('child-select');
  const previous = select.value;
  const profiles = listProfiles(state);
  select.innerHTML = '';
  profiles.forEach(({ id, profile }) => select.appendChild(Object.assign(document.createElement('option'), { value: id, textContent: profile.name })));
  const ids = profiles.map((p) => p.id);
  select.value = [previous, state.lastProfileId, ids[0]].find((id) => id && ids.includes(id)) || '';
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
  if (!confirm(`Dit vervangt alle huidige voortgang door de back-up van ${when}. Doorgaan?`)) return;

  saveState(imported);
  renderParentView();
  showBackupMessage('Back-up teruggezet.');
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('backup-button').addEventListener('click', makeBackup);
  document.getElementById('restore-input').addEventListener('change', restoreBackup);
  document.getElementById('child-select').addEventListener('change', renderParentView);
  document.getElementById('copy-backup-button').addEventListener('click', copyBackup);
  document.getElementById('paste-restore-button').addEventListener('click', restoreFromPaste);
  document.getElementById('app-version').textContent = `versie ${APP_VERSION}`;
  renderParentView();
});
