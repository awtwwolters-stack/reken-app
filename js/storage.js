// Persists progress in the browser (localStorage). No accounts, no server.
// State is keyed by profile so adding siblings later doesn't require a new storage format.

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

// One-time data conversions, each recorded in state.migrations so it runs once.
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
  return state;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // localStorage unavailable (private browsing etc.) - progress just won't persist.
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
