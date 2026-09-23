// Persists progress in the browser (localStorage). No accounts, no server.
// State is keyed by profile so adding siblings later doesn't require a new storage format.

// v2: skills start at their curriculum startTier; v1 data was test-only and is not migrated.
const STORAGE_KEY = 'reken-app-state-v2';
const DEFAULT_PROFILE_ID = 'default';

function emptySkillState(skill, startTier = skill.startTier || 1) {
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

function getSkillState(state, profileId, skill, startTier) {
  if (!state.profiles[profileId]) {
    state.profiles[profileId] = { skills: {} };
  }
  if (!state.profiles[profileId].skills[skill.id]) {
    state.profiles[profileId].skills[skill.id] = emptySkillState(skill, startTier);
  }
  return state.profiles[profileId].skills[skill.id];
}

function recordSession(state, profileId, summary) {
  state.sessions.push({
    profileId,
    date: new Date().toISOString(),
    ...summary
  });
}
