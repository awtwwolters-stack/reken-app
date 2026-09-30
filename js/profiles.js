// Children's profiles. Names live only in the app's data (this browser, and the family's cloud
// copy when sync is on), never in the code: the repository is public. No birth dates are kept.

// A profile without a groep (the old unnamed test profile) counts as groep 6.
const DEFAULT_GROEP = 6;
const DEFAULT_WEEK_GOAL = 4;

const LAST_GROEP = 8;

// The school year a date falls in, named by the year it starts: it starts on 1 August.
function schoolYearOf(date = new Date()) {
  return date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1;
}

// A profile stores the groep the parent chose and the school year it was chosen in; every new
// school year moves the child up one groep by itself. Staying down or skipping: the parent
// simply sets the groep again, which starts a new count. May exceed 8 (finished primary school).
function currentGroep(profile, today = new Date()) {
  if (!profile || !Number.isInteger(profile.groep)) return DEFAULT_GROEP;
  const since = Number.isInteger(profile.groepSchoolYear) ? profile.groepSchoolYear : schoolYearOf(today);
  return profile.groep + Math.max(0, schoolYearOf(today) - since);
}

function hasFinishedPrimarySchool(profile) {
  return currentGroep(profile) > LAST_GROEP;
}

// Named profiles only: the unnamed "default" profile holds pre-profile test data.
function listProfiles(state) {
  return Object.entries(state.profiles)
    .filter(([, profile]) => profile.name)
    .map(([id, profile]) => ({ id, profile }));
}

function saveProfile(state, id, fields) {
  const profileId = id || `p${Date.now()}`;
  const existing = state.profiles[profileId] || { skills: {}, stars: 0, practiceDays: [] };
  state.profiles[profileId] = Object.assign(existing, fields);
  return profileId;
}

// Removes a child with all their stars, progress and session history.
function deleteProfile(state, id) {
  delete state.profiles[id];
  state.sessions = state.sessions.filter((s) => s.profileId !== id);
  if (state.lastProfileId === id) delete state.lastProfileId;
}

// The child's groep decides which skills they practise and where each one starts.
// Groep 0 ("nog niet op school") is a real value, not a missing one.
function practiceGroep(profile) {
  return Math.min(LAST_GROEP, currentGroep(profile));
}

// A child can practise once there are sums for their groep (not yet for kleuters), until they
// have finished groep 8.
function canPractise(profile) {
  return !hasFinishedPrimarySchool(profile) && skillsForGroep(CURRICULUM.skills, practiceGroep(profile)).length > 0;
}

// Young children (still learning to read) get sessions of 5 minutes and a 🔊 button.
const YOUNG_READER_MAX_GROEP = 4;
const SHORT_SESSION_MAX_GROEP = 3;

function sessionMinutes(profile) {
  return practiceGroep(profile) <= SHORT_SESSION_MAX_GROEP ? 5 : 10;
}

function offersReadAloud(profile) {
  return practiceGroep(profile) <= YOUNG_READER_MAX_GROEP;
}
