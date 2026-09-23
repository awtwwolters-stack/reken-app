// Simple, explainable mastery tracking - no machine learning.
// Every decision this file makes can be printed as a plain-language reason,
// which is what the parent/debug view (parent.html) shows.

// Level rules are deliberately asymmetric: going up needs more evidence than going down.
// A symmetric rule settles where the child succeeds ~50% of the time; this settles near
// the 75-85% target (0.8^3 is about 0.5). Tuned by simulation, see BACKLOG.md.
const RESULT_WINDOW = 8;
const MIN_TIER = 1;
const CALIBRATION_ATTEMPTS = 6;
const CALIBRATION_UP_STREAK = 3;
const STEADY_UP_MIN_ANSWERS = 8;
const STEADY_UP_RATE = 0.9;
const STEADY_DOWN_MIN_ANSWERS = 6;
const STEADY_DOWN_RATE = 0.5;
const WEAK_MIN_ANSWERS = 5;
const WEAK_RATE = 0.6;
const DAYS_UNTIL_DUE_FOR_REVIEW = 2;
const MIN_SETTLED_SKILLS_FOR_PERSONAL_START = 3;

const MIN_SESSION_SKILLS = 4;
const MAX_SESSION_SKILLS = 6;
const MAX_SKILLS_PER_CATEGORY = 2;
const BUCKET_WEIGHTS = { zwak: 3, nieuw: 3, kalibreren: 3, automatiseren: 2, herhalen: 1, sterk: 1, later: 1 };

function maxTier(skill) {
  return skill.tiers.length;
}

function successRate(skillState) {
  const results = skillState.recentResults;
  if (results.length === 0) return null;
  const correct = results.filter(Boolean).length;
  return correct / results.length;
}

function daysSince(timestamp) {
  if (!timestamp) return Infinity;
  return (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
}

// At the right level a child still misses ~1 in 5, so "struggling" needs clearly more than that.
function isClearlyStruggling(skillState) {
  const rate = successRate(skillState);
  return skillState.recentResults.length >= WEAK_MIN_ANSWERS && rate < WEAK_RATE;
}

// Calibration: the first answers on a skill, to find its level quickly. It ends early at
// the first step down - the level has been found, and stepping back up would ping-pong.
function isCalibrating(skillState) {
  return skillState.totalAttempts < CALIBRATION_ATTEMPTS && !skillState.calibrationDone;
}

// Updates a skill's state after one answer. Returns the reason if the level changed, else null.
function recordAnswer(skill, skillState, wasCorrect) {
  const calibrating = isCalibrating(skillState);
  skillState.recentResults.push(wasCorrect);
  if (skillState.recentResults.length > RESULT_WINDOW) {
    skillState.recentResults.shift();
  }
  skillState.totalAttempts += 1;
  skillState.lastPracticed = Date.now();

  const results = skillState.recentResults;
  const rate = successRate(skillState);
  let direction = 0;
  let why = '';

  if (calibrating) {
    const lastUp = results.slice(-CALIBRATION_UP_STREAK);
    const wrongInLastThree = results.slice(-3).filter((r) => !r).length;
    if (lastUp.length === CALIBRATION_UP_STREAK && lastUp.every(Boolean)) {
      direction = 1;
      why = `${CALIBRATION_UP_STREAK} keer op rij goed tijdens het bepalen van het niveau`;
    } else if (wrongInLastThree >= 2) {
      direction = -1;
      why = '2 van de laatste 3 niet in één keer goed tijdens het bepalen van het niveau';
    }
  } else if (results.length >= STEADY_UP_MIN_ANSWERS && rate >= STEADY_UP_RATE) {
    direction = 1;
    why = `laatste ${results.length} antwoorden ${Math.round(rate * 100)}% goed`;
  } else if (results.length >= STEADY_DOWN_MIN_ANSWERS && rate < STEADY_DOWN_RATE) {
    direction = -1;
    why = `laatste ${results.length} antwoorden maar ${Math.round(rate * 100)}% goed`;
  }

  const from = skillState.tier;
  const to = Math.min(maxTier(skill), Math.max(MIN_TIER, from + direction));
  if (to === from) return null;

  if (calibrating && direction === -1) skillState.calibrationDone = true;
  skillState.tier = to;
  // Answers given at the old level say nothing about the new one: collect fresh evidence.
  skillState.recentResults = [];
  const reason = `niveau ${from} → ${to}: ${why}`;
  skillState.lastTierChange = { at: Date.now(), from, to, reason };
  return reason;
}

// Classifies a skill into a bucket, with a human-readable reason. Used both for
// session selection and for the parent/debug view.
function classifySkill(skill, skillState, allSkillStates) {
  const rate = successRate(skillState);
  const overdue = daysSince(skillState.lastPracticed) >= DAYS_UNTIL_DUE_FOR_REVIEW;

  if (skillState.totalAttempts === 0) {
    // A prerequisite only blocks a skill on clear evidence of struggle (the same bar as
    // "zwak") - never because it's unproven or had a few unlucky answers.
    const prereqsMet = skill.prerequisites.every((prereqId) => {
      const prereqState = allSkillStates[prereqId];
      return !prereqState || !isClearlyStruggling(prereqState);
    });
    if (prereqsMet) {
      return { bucket: 'nieuw', reason: 'nog niet geoefend, voorkennis is aanwezig' };
    }
    return { bucket: 'later', reason: 'voorkennis nog niet sterk genoeg' };
  }
  if (isCalibrating(skillState)) {
    return { bucket: 'kalibreren', reason: `niveau wordt nog bepaald (nu ${skillState.tier} van ${maxTier(skill)})` };
  }
  // Too few answers at this level to call it weak or strong yet (e.g. just after a level change).
  if (skillState.recentResults.length < WEAK_MIN_ANSWERS) {
    return { bucket: 'kalibreren', reason: `niveau ${skillState.tier}, nog te weinig antwoorden om te beoordelen` };
  }
  if (isClearlyStruggling(skillState)) {
    return { bucket: 'zwak', reason: `laag slagingspercentage (${Math.round(rate * 100)}%)` };
  }
  if (rate >= STEADY_UP_RATE && overdue) {
    const days = Math.floor(daysSince(skillState.lastPracticed));
    return { bucket: 'automatiseren', reason: `sterk, maar ${days} dag(en) niet geoefend` };
  }
  if (overdue) {
    return { bucket: 'herhalen', reason: 'lang niet geoefend' };
  }
  return { bucket: 'sterk', reason: `${Math.round(rate * 100)}% goed op niveau ${skillState.tier}` };
}

// Where a not-yet-practised skill starts for this child: the curriculum's estimate, shifted
// by how this child does elsewhere (one level below the estimate on average -> start one lower).
// Until then, `groepOffset` (negative for a child below groep 6) gives a first estimate.
function personalStartTier(skill, profileSkillStates, skillsById, groepOffset = 0) {
  const offsets = Object.entries(profileSkillStates)
    .filter(([id, state]) => skillsById[id] && state.totalAttempts > 0 && !isCalibrating(state))
    .map(([id, state]) => state.tier - skillsById[id].startTier);
  // One skill that dropped after two slips must not lower every new skill: wait for a few.
  if (offsets.length < MIN_SETTLED_SKILLS_FOR_PERSONAL_START) {
    return Math.min(maxTier(skill), Math.max(MIN_TIER, skill.startTier + groepOffset));
  }
  // Truncate, not round: only shift when the child is a full level off on average. An uneven
  // child (+1 here, 0 there) should start new skills at the plain estimate.
  const offset = Math.trunc(offsets.reduce((a, b) => a + b, 0) / offsets.length);
  return Math.min(maxTier(skill), Math.max(MIN_TIER, skill.startTier + offset));
}

function stateOrNew(skill, profileSkillStates, skillsById, groepOffset = 0) {
  return profileSkillStates[skill.id]
    || emptySkillState(skill, personalStartTier(skill, profileSkillStates, skillsById, groepOffset));
}

function classifyAll(curriculumSkills, profileSkillStates) {
  const skillsById = Object.fromEntries(curriculumSkills.map((s) => [s.id, s]));
  return curriculumSkills
    .filter((s) => s.implemented)
    .map((skill) => {
      const state = stateOrNew(skill, profileSkillStates, skillsById);
      return { skill, state, ...classifySkill(skill, state, profileSkillStates) };
    });
}

// Chooses the 4-6 skills a session focuses on. Returns [{ skillId, bucket, reason }].
function selectSessionSkills(curriculumSkills, profileSkillStates) {
  const entries = classifyAll(curriculumSkills, profileSkillStates);
  const picks = [];
  const perCategory = {};

  function canAdd(entry, respectCategoryCap = true) {
    if (picks.includes(entry) || picks.length >= MAX_SESSION_SKILLS) return false;
    return !respectCategoryCap || (perCategory[entry.skill.category] || 0) < MAX_SKILLS_PER_CATEGORY;
  }
  function add(entry) {
    picks.push(entry);
    perCategory[entry.skill.category] = (perCategory[entry.skill.category] || 0) + 1;
  }
  function addUpTo(candidates, limit) {
    let added = 0;
    for (const entry of candidates) {
      if (added >= limit) break;
      if (canAdd(entry)) { add(entry); added += 1; }
    }
  }
  const inBucket = (bucket) => entries.filter((e) => e.bucket === bucket);
  const oldestFirst = (a, b) => (a.state.lastPracticed || 0) - (b.state.lastPracticed || 0);

  addUpTo(inBucket('zwak').sort((a, b) => successRate(a.state) - successRate(b.state)), 2);

  // New skills: curriculum order, but first categories the child has never practised, then
  // categories this session doesn't have yet - otherwise late categories (verhaalsommen) starve.
  // On a first session everything is new, so new skills may fill the whole session.
  const nothingPracticedYet = entries.every((e) => e.state.totalAttempts === 0);
  const newLimit = nothingPracticedYet ? MAX_SESSION_SKILLS : 2;
  const practisedCategories = new Set(entries.filter((e) => e.state.totalAttempts > 0).map((e) => e.skill.category));
  const fresh = inBucket('nieuw');
  for (let n = 0; n < newLimit; n++) {
    const unrepresented = (e) => canAdd(e) && !perCategory[e.skill.category];
    const next = fresh.find((e) => unrepresented(e) && !practisedCategories.has(e.skill.category))
      || fresh.find(unrepresented)
      || fresh.find((e) => canAdd(e));
    if (!next) break;
    add(next);
  }

  addUpTo(inBucket('kalibreren').sort(oldestFirst), 2);
  addUpTo(inBucket('automatiseren').sort(oldestFirst), 1);
  addUpTo(inBucket('herhalen').sort(oldestFirst), 1);

  // Top up to the minimum; relax the category cap only if that's the only way to get there.
  const topUpOrder = [
    ...inBucket('nieuw'), ...inBucket('kalibreren'), ...inBucket('zwak'),
    ...inBucket('sterk').sort(oldestFirst), ...inBucket('automatiseren'),
    ...inBucket('herhalen'), ...inBucket('later')
  ];
  for (const entry of topUpOrder) {
    if (picks.length >= MIN_SESSION_SKILLS) break;
    if (canAdd(entry)) add(entry);
  }
  for (const entry of topUpOrder) {
    if (picks.length >= MIN_SESSION_SKILLS) break;
    if (canAdd(entry, false)) add(entry);
  }

  return picks.map((p) => ({ skillId: p.skill.id, bucket: p.bucket, reason: p.reason }));
}

// Picks the next exercise's skill among the session's skills, weighted by the skill's
// *current* bucket (so a skill that turns weak mid-session gets more practice), never
// the same skill twice in a row. Returns { skillId, bucket, reason }.
function pickNextSkill(sessionSkillIds, skillsById, profileSkillStates, previousSkillId) {
  let candidates = sessionSkillIds.filter((id) => id !== previousSkillId);
  if (candidates.length === 0) candidates = sessionSkillIds;

  const weighted = candidates.map((id) => {
    const skill = skillsById[id];
    const state = stateOrNew(skill, profileSkillStates, skillsById);
    const { bucket, reason } = classifySkill(skill, state, profileSkillStates);
    return { skillId: id, bucket, reason, weight: BUCKET_WEIGHTS[bucket] || 1 };
  });

  const total = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * total;
  for (const w of weighted) {
    roll -= w.weight;
    if (roll < 0) return w;
  }
  return weighted[weighted.length - 1];
}
