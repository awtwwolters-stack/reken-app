// Children's profiles. Names and birth dates live only in this browser's storage, never in
// the code: the repository is public.

const GROEP_WITH_CONTENT = 6;
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

// Only groep-6 content exists; the parent decides per child whether to use it for now.
function canPractise(profile) {
  return !!profile.groep6Content;
}

// A child below groep 6 starts one level lower per groep, until their own answers take over.
function groepOffset(profile) {
  return profile && profile.groep ? Math.min(0, profile.groep - GROEP_WITH_CONTENT) : 0;
}
