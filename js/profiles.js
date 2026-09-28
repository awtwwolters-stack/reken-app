// Children's profiles. Names and birth dates live only in this browser's storage, never in
// the code: the repository is public.

// A profile without a groep (the old unnamed test profile) counts as groep 6.
const DEFAULT_GROEP = 6;
const DEFAULT_WEEK_GOAL = 4;

// Dutch schools place children by their age on 1 October of the school year (which starts in
// August): 4 -> groep 1, ..., 9 -> groep 6. Children born october-december are often placed a
// groep earlier or later, so the parent always confirms. Below 1 = not in school yet.
function estimateGroep(birthDate, today = new Date()) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const schoolYearStart = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
  let ageOnFirstOctober = schoolYearStart - year;
  if (month > 10 || (month === 10 && day > 1)) ageOnFirstOctober -= 1;
  return ageOnFirstOctober - 3;
}

function isAutumnChild(birthDate) {
  const month = Number(birthDate.split('-')[1]);
  return month >= 10;
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
  return profile && Number.isInteger(profile.groep) ? profile.groep : DEFAULT_GROEP;
}

// A child can practise once there are sums for their groep (not yet for kleuters).
function canPractise(profile) {
  return skillsForGroep(CURRICULUM.skills, practiceGroep(profile)).length > 0;
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
