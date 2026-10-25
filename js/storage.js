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
  if (!raw) return freshState();
  try {
    return migrateState(JSON.parse(raw));
  } catch (e) {
    return freshState();
  }
}

// Every one-time conversion in migrateState, by name. A new iPad starts with all of them done:
// its children come from the cloud already converted, and converting them again would push
// levels up a second time (BACKLOG D20). A new conversion must be added here too.
const MIGRATIONS = ['keersomLevels', 'plusMinHandig', 'schoolYearGroep'];

function freshState() {
  const migrations = {};
  MIGRATIONS.forEach((name) => { migrations[name] = true; });
  return { profiles: {}, sessions: [], migrations };
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

// `pushOptions.overwrite`: the cloud gets exactly this state instead of a combination with what
// it has (restoring a backup).
function saveState(state, pushOptions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // localStorage unavailable (private browsing etc.) - progress just won't persist.
  }
  // Cloud sync, when set up and signed in: sends only the children and sessions that changed.
  if (window.Cloud) window.Cloud.push(state, pushOptions);
}

// A change from the cloud: { kind: 'profile' | 'session', id, data, base }, data null when removed
// there. A child is combined with this iPad's copy (mergeProfile) when this iPad has changes the
// cloud doesn't have yet; `base` is the cloud version this iPad saw before. The child is updated in
// place, so a session running for them right now keeps working. That running session itself
// (`keep.sessionId`) is newer here and left alone. Returns whether anything changed.
function applyRemoteChange(state, change, keep = {}) {
  if (change.kind === 'profile') {
    const local = state.profiles[change.id];
    if (!change.data) {
      if (!local || change.id === keep.profileId) return false; // not in the middle of practice
      delete state.profiles[change.id];
      return true;
    }
    if (!local) {
      state.profiles[change.id] = copyData(change.data);
      return true;
    }
    const next = sameData(local, change.base) ? change.data : mergeProfile(change.base, local, change.data);
    if (sameData(local, next)) return false;
    replaceProfileInPlace(local, next);
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

// The first sign-in on an iPad: combine what this iPad has with the family's cloud copy. A child
// on both (same name) is combined part by part (mergeProfile without a base: per skill the copy
// with the most sums, the most stars), under the cloud's id so every iPad agrees; sessions are
// combined. The unnamed old test profile stays on this iPad only.
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
    merged.profiles[cloudId] = mergeProfile(null, profile, merged.profiles[cloudId]);
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

// ---- Combining two copies of one child (BACKLOG D20) ----
// A child is one cloud document. An iPad that was signed out or offline has an older copy, and
// sending that copy as it is would undo what was practised elsewhere in the meantime. So two
// copies are combined part by part, from the version both started from (`base`).

// Content as text, the same whatever the order of the keys; keys without a value don't count.
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? 'null' : stableStringify(v))).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().filter((k) => value[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sameData(a, b) {
  return stableStringify(a) === stableStringify(b);
}

function copyData(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

// What only one side changed wins; when both changed (or there is no base), the cloud's.
function pickChanged(base, local, remote, hasBase) {
  if (!hasBase) return remote !== undefined ? remote : local;
  if (sameData(local, base)) return remote;
  if (sameData(remote, base)) return local;
  return remote;
}

// A number that only grows (stars earned, sums made, tempo passes): the base plus what each side
// added since. Without a base, the higher one.
function mergeCount(base, local, remote, hasBase) {
  const l = local || 0;
  const r = remote || 0;
  if (!hasBase) return Math.max(l, r);
  return Math.max(l, r, l + r - (base || 0));
}

// Both sides practised a skill: level, recent answers and dates from the latest practice, and
// every sum counted. Without a base: the copy with the most sums.
function mergeSkill(base, local, remote, hasBase) {
  if (!local || !remote) return local || remote;
  if (hasBase && sameData(local, base)) return remote;
  if (hasBase && sameData(remote, base)) return local;
  const later = (local.lastPracticed || 0) > (remote.lastPracticed || 0) ? local : remote;
  if (!hasBase) {
    const l = local.totalAttempts || 0;
    const r = remote.totalAttempts || 0;
    return l === r ? later : (l > r ? local : remote);
  }
  const merged = copyData(later);
  merged.totalAttempts = mergeCount(base && base.totalAttempts, local.totalAttempts, remote.totalAttempts, true);
  if (local.introSeen || remote.introSeen) merged.introSeen = true;
  return merged;
}

// Tempo rounds from both sides (by their time), the best score, and every pass counted.
function mergeTempo(base, local, remote, hasBase) {
  if (!local || !remote) return local || remote;
  const kept = typeof TEMPO_KEPT_ROUNDS === 'number' ? TEMPO_KEPT_ROUNDS : 50;
  const merged = {};
  new Set([...Object.keys(local), ...Object.keys(remote)]).forEach((kind) => {
    const l = local[kind];
    const r = remote[kind];
    const b = base && base[kind];
    if (!l || !r) merged[kind] = l || r;
    else if (hasBase && sameData(l, b)) merged[kind] = r;
    else if (hasBase && sameData(r, b)) merged[kind] = l;
    else {
      const rounds = {};
      [...(l.rounds || []), ...(r.rounds || [])].forEach((round) => { rounds[round.at] = round; });
      merged[kind] = Object.assign({}, r, {
        best: Math.max(l.best || 0, r.best || 0),
        passes: mergeCount(b && b.passes, l.passes, r.passes, hasBase),
        rounds: Object.values(rounds).sort((x, y) => (x.at < y.at ? -1 : 1)).slice(-kept)
      });
    }
  });
  return merged;
}

// Bought items are only ever added at the end (js/park.js buyItem). What was in the base stays,
// each where the side that moved it put it; what either side bought since is all kept, so an item
// bought on two iPads is there twice (and paid twice). Clashing tiles are sorted out by
// parkLayout(), which puts a second item on a tile on the first free one.
function mergePark(base, local, remote, hasBase) {
  if (!local || !remote) return local || remote;
  if (hasBase && sameData(local, base)) return remote;
  if (hasBase && sameData(remote, base)) return local;
  const b = base || {};
  const baseItems = b.items || [];
  const localItems = local.items || [];
  const remoteItems = remote.items || [];
  const startsWithBase = (items) => baseItems.every((item, i) => items[i] && items[i].id === item.id);
  if (!hasBase || !startsWithBase(localItems) || !startsWithBase(remoteItems)) {
    return localItems.length > remoteItems.length ? local : remote; // no common start: the fullest park
  }
  const items = baseItems.map((item, i) => Object.assign({}, remoteItems[i], {
    tile: pickChanged(item.tile, localItems[i].tile, remoteItems[i].tile, true)
  }));
  items.push(...remoteItems.slice(baseItems.length), ...localItems.slice(baseItems.length));
  return Object.assign({}, remote, {
    items,
    animalTiles: pickChanged(b.animalTiles, local.animalTiles, remote.animalTiles, true),
    storyRead: Math.max(local.storyRead || 0, remote.storyRead || 0),
    saveFor: pickChanged(b.saveFor, local.saveFor, remote.saveFor, true)
  });
}

// Combines this iPad's copy of a child (`local`) with the cloud's (`remote`), keeping what each did
// since `base`. Without a base (an iPad's first link), the safest choice is made per part.
// Combining a copy with itself gives that copy, so it is safe to repeat.
function mergeProfile(base, local, remote) {
  if (!local || !remote) return copyData(local || remote);
  // A restored backup (js/parent.js) replaces what was there: the copy with the latest restore
  // wins whole, also over progress the other copy made before it knew of the restore.
  const localRestore = local.restoredAt || 0;
  const remoteRestore = remote.restoredAt || 0;
  if (localRestore !== remoteRestore) return copyData(localRestore > remoteRestore ? local : remote);
  const hasBase = !!base;
  if (sameData(local, remote) || (hasBase && sameData(local, base))) return copyData(remote);
  if (hasBase && sameData(remote, base)) return copyData(local);
  const b = base || {};
  const merged = {};
  new Set([...Object.keys(local), ...Object.keys(remote)]).forEach((key) => {
    const l = local[key];
    const r = remote[key];
    let value;
    if (key === 'stars') value = mergeCount(b.stars, l, r, hasBase);
    else if (key === 'skills') {
      value = {};
      const bs = b.skills || {};
      new Set([...Object.keys(l || {}), ...Object.keys(r || {})]).forEach((id) => {
        value[id] = mergeSkill(bs[id], (l || {})[id], (r || {})[id], hasBase);
      });
    } else if (key === 'practiceDays') value = [...new Set([...(l || []), ...(r || [])])].sort();
    else if (key === 'tempo') value = mergeTempo(b.tempo, l, r, hasBase);
    else if (key === 'park') value = mergePark(b.park, l, r, hasBase);
    else value = pickChanged(b[key], l, r, hasBase);
    if (value !== undefined) merged[key] = copyData(value);
  });
  return merged;
}

// Puts `source` into the stored child without replacing the skill objects a running session uses.
function replaceProfileInPlace(target, source) {
  const fresh = copyData(source);
  Object.keys(target).forEach((key) => { if (!(key in fresh)) delete target[key]; });
  Object.keys(fresh).forEach((key) => {
    if (key !== 'skills' || !target.skills) {
      target[key] = fresh[key];
      return;
    }
    Object.keys(target.skills).forEach((id) => { if (!(id in fresh.skills)) delete target.skills[id]; });
    Object.entries(fresh.skills).forEach(([id, skill]) => {
      const kept = target.skills[id];
      if (!kept) {
        target.skills[id] = skill;
        return;
      }
      Object.keys(kept).forEach((k) => { if (!(k in skill)) delete kept[k]; });
      Object.assign(kept, skill);
    });
  });
}

// ---- One-time repairs (BACKLOG D20) ----
// Done by js/cloud.js on the cloud's copy, inside the same server step as a write, so the family is
// repaired once however many iPads there are. Each rule checks the data itself: once repaired, it
// no longer applies.

// The day plusMinHandig (migrateState) was released.
const PLUS_MIN_HANDIG_AT = new Date(2026, 8, 29).getTime();

// The stars a finished session gave (js/app.js): one per sum solved, also after a hint, plus the
// bonus for finishing and for every level up. The week-goal bonus can't be told afterwards.
function sessionStars(record) {
  const solved = record.exercises.filter((e) => !e.solutionShown).length;
  const levelUps = record.exercises.filter((e) => {
    const m = /niveau (\d+) → (\d+)/.exec(e.levelChange || '');
    return m && Number(m[2]) > Number(m[1]);
  }).length;
  return solved + STAR_BONUS.sessionDone + levelUps * STAR_BONUS.levelUp;
}

// Only sessions from before D20 can have been lost; since then a child's progress is combined, never
// overwritten. (A later session can reach the cloud before its child's progress does; repairing it
// would count its stars twice.)
const LOST_SESSIONS_BEFORE = new Date(2026, 9, 25).getTime();

function sessionEnd(record) {
  return new Date(record.exercises[record.exercises.length - 1].at);
}

// Returns the repaired child, or null when nothing needs repairing. `sessions`: this child's.
function repairProfile(profile, sessions, now = Date.now()) {
  const repaired = copyData(profile);
  const skills = repaired.skills || {};
  const settled = sessions.filter((record) => record.exercises && record.exercises.length
    && sessionEnd(record).getTime() < LOST_SESSIONS_BEFORE);
  // 1. A finished session the child's progress lost (an older copy was sent over it): its day,
  //    its stars, and its sums counted again. The practice day is written when the summary shows,
  //    which may be just after midnight.
  const days = new Set(repaired.practiceDays || []);
  settled.forEach((record) => {
    if (!record.completed) return;
    const end = sessionEnd(record);
    const day = dateKey(end);
    if (days.has(day) || days.has(dateKey(new Date(end.getTime() + 60 * 60 * 1000)))) return;
    days.add(day);
    repaired.stars = (repaired.stars || 0) + sessionStars(record);
  });
  if (days.size !== (repaired.practiceDays || []).length) repaired.practiceDays = [...days].sort();
  const logged = {};
  settled.forEach((record) => record.exercises.forEach((e) => { logged[e.skillId] = (logged[e.skillId] || 0) + 1; }));
  Object.entries(logged).forEach(([id, n]) => {
    const skill = skills[id];
    if (skill && (skill.totalAttempts || 0) < n) skill.totalAttempts = n;
  });
  // 2. A plus/min level that a fresh iPad converted a second time: two above where its last
  //    recorded change (from before the conversion) put it, where one is right.
  ['optellen_tot_100000', 'aftrekken_tot_100000'].forEach((id) => {
    const skill = skills[id];
    const change = skill && skill.lastTierChange;
    if (!change || !(change.at < PLUS_MIN_HANDIG_AT) || change.to < 3 || skill.tier !== change.to + 2) return;
    skill.tier -= 1;
    skill.lastTierChange = {
      at: now,
      from: skill.tier + 1,
      to: skill.tier,
      reason: `niveau ${skill.tier + 1} → ${skill.tier}: hersteld, het niveau was twee keer omgezet`
    };
  });
  return sameData(repaired, profile) ? null : repaired;
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
