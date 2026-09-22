// Persists progress in the browser (localStorage). No accounts, no server.
// State is keyed by profile so adding siblings later doesn't require a new storage format.

const STORAGE_KEY = 'reken-app-state-v1';
const DEFAULT_PROFILE_ID = 'default';

function emptySkillState() {
  return {
    tier: 1,
    recentResults: [],
    totalAttempts: 0,
    lastPracticed: null
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
    return JSON.parse(raw);
  } catch (e) {
    return { profiles: {}, sessions: [] };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // localStorage unavailable (private browsing etc.) - progress just won't persist.
  }
}

function getSkillState(state, profileId, skillId) {
  if (!state.profiles[profileId]) {
    state.profiles[profileId] = { skills: {} };
  }
  if (!state.profiles[profileId].skills[skillId]) {
    state.profiles[profileId].skills[skillId] = emptySkillState();
  }
  return state.profiles[profileId].skills[skillId];
}

function recordSession(state, profileId, summary) {
  state.sessions.push({
    profileId,
    date: new Date().toISOString(),
    ...summary
  });
}
