// Persists progress in the browser (localStorage): the working copy, so the app starts at once
// and works without internet. With cloud sync on (js/cloud.js), every save is also sent to the
// family's cloud copy, and changes from other iPads are merged in (applyRemoteChange).

// v1 data was test-only and is not migrated.
const STORAGE_KEY = 'reken-app-state-v2';

function emptySkillState(skill, startTier) {
  return {
    tier: startTier,
    recentResults: [],
    totalAttempts: 0,
    lastPracticed: null,
    calibrationDone: false,
    lastTierChange: null
  };
}

function loadState() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    raw = null;
  }
  if (!raw) {
    return { profiles: {}, sessions: [] };
  }
  try {
    return migrateState(JSON.parse(raw));
  } catch (e) {
    return { profiles: {}, sessions: [] };
  }
}

// One-time data conversions, each recorded in state.migrations so it runs once (in this order).
// keersomLevels (2026-09-29): keersommen levels were rebuilt by kind of sum. A stored level keeps
// its number, which now holds slightly easier sums (a cautious start); old answers were given at
// the old level, so they are cleared and the app collects fresh evidence.
function migrateState(state) {
  state.migrations = state.migrations || {};
  if (!state.migrations.keersomLevels) {
    Object.values(state.profiles || {}).forEach((profile) => {
      const skill = profile.skills && profile.skills.vermenigvuldigen_grote_getallen;
      if (skill) skill.recentResults = [];
    });
    state.migrations.keersomLevels = true;
  }
  // plusMinHandig (2026-09-29): a new level 3 (handy numbers) was inserted for optellen and
  // aftrekken, so stored levels 3 and 4 move up one; their old answers are cleared.
  if (!state.migrations.plusMinHandig) {
    Object.values(state.profiles || {}).forEach((profile) => {
      ['optellen_tot_100000', 'aftrekken_tot_100000'].forEach((id) => {
        const skill = profile.skills && profile.skills[id];
        if (skill && skill.tier >= 3) {
          skill.tier += 1;
          skill.recentResults = [];
        }
      });
    });
    state.migrations.plusMinHandig = true;
  }
  // schoolYearGroep (2026-09-30): the groep now moves up by itself every school year, so it is
  // stored with the school year it was set in (all existing groepen were set in 2026-2027). Birth
  // dates are no longer kept (privacy: nothing more than needed goes to the cloud).
  if (!state.migrations.schoolYearGroep) {
    Object.values(state.profiles || {}).forEach((profile) => {
      if (Number.isInteger(profile.groep) && !Number.isInteger(profile.groepSchoolYear)) profile.groepSchoolYear = 2026;
      delete profile.birthDate;
      delete profile.groep6Content;
    });
    state.migrations.schoolYearGroep = true;
  }
  return state;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // localStorage unavailable (private browsing etc.) - progress just won't persist.
  }
  // Cloud sync, when set up and signed in: sends only the children and sessions that changed.
  if (window.Cloud) window.Cloud.push(state);
}

// A change from another iPad: { kind: 'profile' | 'session', id, data }, data null when removed
// there. The child practising on this iPad right now (`keep.profileId`) and their running session
// (`keep.sessionId`) are newer here and left alone; this iPad's next save wins for them.
// Returns whether anything changed.
function applyRemoteChange(state, change, keep = {}) {
  if (change.kind === 'profile') {
    if (change.id === keep.profileId) return false;
    if (change.data) state.profiles[change.id] = change.data;
    else delete state.profiles[change.id];
    return true;
  }
  if (change.id === keep.sessionId) return false;
  const index = state.sessions.findIndex((s) => String(s.id) === change.id);
  if (!change.data) {
    if (index >= 0) state.sessions.splice(index, 1);
    return index >= 0;
  }
  if (index >= 0) state.sessions[index] = change.data;
  else {
    state.sessions.push(change.data);
    state.sessions.sort((a, b) => a.id - b.id);
    if (state.sessions.length > MAX_STORED_SESSIONS) state.sessions.splice(0, state.sessions.length - MAX_STORED_SESSIONS);
  }
  return true;
}

function practisedSums(profile) {
  return Object.values(profile.skills || {}).reduce((n, s) => n + (s.totalAttempts || 0), 0);
}

// The first sign-in on an iPad: combine what this iPad has with the family's cloud copy. A child
// on both (same name) keeps the version with the most practised sums, under the cloud's id so
// every iPad agrees; sessions are combined. The unnamed old test profile stays on this iPad only.
const PRE_CLOUD_BACKUP_KEY = 'reken-app-state-before-cloud';

function mergeForFirstLink(local, cloudProfiles, cloudSessions) {
  const merged = Object.assign({}, local, { profiles: {}, sessions: [] });
  const idByName = {};
  Object.entries(cloudProfiles).forEach(([id, profile]) => {
    merged.profiles[id] = profile;
    if (profile.name) idByName[profile.name.trim().toLowerCase()] = id;
  });
  const newId = {};
  Object.entries(local.profiles).forEach(([id, profile]) => {
    const cloudId = profile.name ? idByName[profile.name.trim().toLowerCase()] : null;
    if (!cloudId) {
      merged.profiles[id] = profile;
      return;
    }
    newId[id] = cloudId;
    if (practisedSums(profile) > practisedSums(merged.profiles[cloudId])) merged.profiles[cloudId] = profile;
  });
  const byId = {};
  cloudSessions.forEach((s) => { byId[s.id] = s; });
  local.sessions.forEach((s) => {
    if (!byId[s.id]) byId[s.id] = Object.assign({}, s, { profileId: newId[s.profileId] || s.profileId });
  });
  merged.sessions = Object.values(byId).sort((a, b) => a.id - b.id).slice(-MAX_STORED_SESSIONS);
  if (newId[local.lastProfileId]) merged.lastProfileId = newId[local.lastProfileId];
  return merged;
}

// Before the first merge, this iPad's own data is kept aside (downloadable in the parent view).
function keepPreCloudBackup(state) {
  try {
    if (!localStorage.getItem(PRE_CLOUD_BACKUP_KEY)) localStorage.setItem(PRE_CLOUD_BACKUP_KEY, backupFileContents(state));
  } catch (e) {
    // No room or no storage: the merge keeps the most-practised version anyway.
  }
}

function getSkillState(state, profileId, skill, startTier) {
  if (!state.profiles[profileId]) {
    state.profiles[profileId] = { skills: {} };
  }
  if (!state.profiles[profileId].skills[skill.id]) {
    state.profiles[profileId].skills[skill.id] = emptySkillState(skill, startTier);
  }
  return state.profiles[profileId].skills[skill.id];
}

// ~5 KB per session; 300 sessions stays far below the browser's ~5 MB storage limit.
const MAX_STORED_SESSIONS = 300;

// Created when a session starts and saved after every exercise, so a session the child
// stops halfway still leaves a record (completed stays false).
function startSessionRecord(state, profileId, selection) {
  const record = {
    id: Date.now(),
    profileId,
    startedAt: new Date().toISOString(),
    completed: false,
    activeSeconds: 0,
    skills: selection,
    exercises: []
  };
  state.sessions.push(record);
  if (state.sessions.length > MAX_STORED_SESSIONS) {
    state.sessions.splice(0, state.sessions.length - MAX_STORED_SESSIONS);
  }
  return record;
}

const BACKUP_FORMAT = 'reken-app-backup';

function backupFileContents(state) {
  return JSON.stringify({ format: BACKUP_FORMAT, exportedAt: new Date().toISOString(), state }, null, 1);
}

// Returns the state inside a backup file, or throws if the file isn't a Reken App backup.
function parseBackupFile(text) {
  const data = JSON.parse(text);
  const state = data && data.format === BACKUP_FORMAT ? data.state : null;
  if (!state || !state.profiles || typeof state.profiles !== 'object' || !Array.isArray(state.sessions)) {
    throw new Error('not a Reken App backup');
  }
  return state;
}
