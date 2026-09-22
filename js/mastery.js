// Simple, explainable mastery tracking - no machine learning.
// Every decision this file makes can be printed as a plain-language reason,
// which is what the parent/debug view (parent.html) shows.

const RESULT_WINDOW = 8;
const MIN_ATTEMPTS_TO_EVALUATE = 5;
const TIER_UP_THRESHOLD = 0.85;
const TIER_DOWN_THRESHOLD = 0.70;
const MIN_TIER = 1;
const MAX_TIER = 5;
const DAYS_UNTIL_DUE_FOR_REVIEW = 2;

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

// Updates a skill's state after one answer. Returns { skillState, tierChanged, reason }.
function recordAnswer(skillState, wasCorrect) {
  skillState.recentResults.push(wasCorrect);
  if (skillState.recentResults.length > RESULT_WINDOW) {
    skillState.recentResults.shift();
  }
  skillState.totalAttempts += 1;
  skillState.lastPracticed = Date.now();

  let reason = null;
  if (skillState.recentResults.length >= MIN_ATTEMPTS_TO_EVALUATE) {
    const rate = successRate(skillState);
    if (rate >= TIER_UP_THRESHOLD && skillState.tier < MAX_TIER) {
      skillState.tier += 1;
      skillState.recentResults = skillState.recentResults.slice(-3);
      reason = `tier omhoog naar ${skillState.tier}: laatste antwoorden gingen goed (${Math.round(rate * 100)}%)`;
    } else if (rate < TIER_DOWN_THRESHOLD && skillState.tier > MIN_TIER) {
      skillState.tier -= 1;
      skillState.recentResults = skillState.recentResults.slice(-3);
      reason = `tier omlaag naar ${skillState.tier}: dit ging nog lastig (${Math.round(rate * 100)}%)`;
    }
  }
  return { skillState, reason };
}

// Classifies a skill into a bucket, with a human-readable reason. Used both for
// session selection and for the parent/debug view.
function classifySkill(skill, skillState, allSkillStates) {
  const rate = successRate(skillState);
  const notPracticed = skillState.totalAttempts === 0;
  const overdue = daysSince(skillState.lastPracticed) >= DAYS_UNTIL_DUE_FOR_REVIEW;

  if (notPracticed) {
    // Cold start: assume normal group-6 level. A prerequisite only blocks a skill when
    // we have actual evidence the child struggles with it - never just because it's
    // unproven, which would collapse the variety of a first session.
    const prereqsMet = skill.prerequisites.every((prereqId) => {
      const prereqState = allSkillStates[prereqId];
      if (!prereqState) return true;
      const prereqRate = successRate(prereqState);
      return prereqRate === null || prereqRate >= TIER_DOWN_THRESHOLD;
    });
    if (prereqsMet) {
      return { bucket: 'nieuw', reason: 'nog niet geoefend, voorkennis is aanwezig' };
    }
    return { bucket: 'later', reason: 'voorkennis nog niet sterk genoeg' };
  }
  if (rate !== null && rate < TIER_DOWN_THRESHOLD) {
    return { bucket: 'zwak', reason: `laag slagingspercentage (${Math.round(rate * 100)}%)` };
  }
  if (rate !== null && rate >= TIER_UP_THRESHOLD && overdue) {
    const days = Math.floor(daysSince(skillState.lastPracticed));
    return { bucket: 'automatiseren', reason: `sterk, maar ${days} dag(en) niet geoefend` };
  }
  if (overdue) {
    return { bucket: 'herhalen', reason: 'lang niet geoefend' };
  }
  return { bucket: 'sterk', reason: `goed op schema (${Math.round((rate ?? 1) * 100)}%)` };
}

// Builds a practice session: a list of { skillId, tier, reason }, length = sessionSize.
// Mixes weak skills, automatisation review of strong skills, and new material -
// deliberately simple percentages rather than a tuned/learned model.
function selectSession(curriculumSkills, profileSkillStates, sessionSize = 12) {
  const implemented = curriculumSkills.filter((s) => s.implemented);

  const withState = implemented.map((skill) => {
    const state = profileSkillStates[skill.id] || { tier: 1, recentResults: [], totalAttempts: 0, lastPracticed: null };
    const { bucket, reason } = classifySkill(skill, state, profileSkillStates);
    return { skill, state, bucket, reason };
  });

  const weak = withState.filter((s) => s.bucket === 'zwak');
  const automatisation = withState.filter((s) => s.bucket === 'automatiseren');
  const fresh = withState.filter((s) => s.bucket === 'nieuw');
  const catchAll = withState.filter((s) => ['herhalen', 'sterk'].includes(s.bucket));

  const targetWeak = Math.round(sessionSize * 0.4);
  const targetAuto = Math.round(sessionSize * 0.3);
  const targetFresh = sessionSize - targetWeak - targetAuto;

  const picks = [];
  function fillFrom(pool, count) {
    for (let i = 0; i < count && pool.length > 0; i++) {
      picks.push(pool[i % pool.length]);
    }
  }
  fillFrom(weak, Math.min(targetWeak, weak.length || targetWeak));
  fillFrom(automatisation, Math.min(targetAuto, automatisation.length || targetAuto));
  fillFrom(fresh, Math.min(targetFresh, fresh.length || targetFresh));

  // Top up the session. Skills not yet picked come first, so a session covers as much
  // breadth as it can before it starts repeating a skill.
  const fallbackPool = [...catchAll, ...weak, ...automatisation, ...fresh];
  const unused = fallbackPool.filter((candidate) => !picks.includes(candidate));
  let fallbackIndex = 0;
  while (picks.length < sessionSize && fallbackPool.length > 0) {
    if (unused.length > 0) {
      picks.push(unused.shift());
    } else {
      picks.push(fallbackPool[fallbackIndex % fallbackPool.length]);
      fallbackIndex += 1;
    }
  }

  return picks.slice(0, sessionSize).map((p) => ({
    skillId: p.skill.id,
    tier: p.state.tier,
    reason: p.reason
  }));
}
