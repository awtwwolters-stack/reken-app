// Cloud sync between iPads (Firebase: Google sign-in + Firestore database), see BACKLOG D12.
//
// Offline-first: localStorage stays the working copy (js/storage.js), so the app starts at once and
// works without internet. This file sends what changed and brings in what other iPads changed.
// Without js/cloud-config.js filled in, or when the Firebase code can't be loaded, the app simply
// keeps working on this iPad only.
//
// Data: families/{parent's user id}/profiles/{profileId} - one document per child, so children
// practising on different iPads never overwrite each other - and families/{uid}/sessions/{id}.
// A child is written in one server step that first combines it with the cloud's copy
// (mergeProfile, js/storage.js), so an iPad that was signed out or offline can't undo progress
// made elsewhere (BACKLOG D20).
// The Firestore security rule (set in the Firebase console) lets only that signed-in parent read
// or write it; the web config in the public repository is not a secret.

const SDK = 'https://www.gstatic.com/firebasejs/12.19.0';
const LINKED_KEY = 'reken-app-cloud-linked'; // the account this iPad's data has been merged with
const SYNCED_KEY = 'reken-app-cloud-synced'; // what the cloud has, per document, as last seen here
const BASE_KEY = 'reken-app-cloud-base'; // per child: the cloud's version as last seen here
const MAX_WRITES_PER_BATCH = 450; // Firestore allows 500 per batch

let A = null; // firebase-auth module
let F = null; // firebase-firestore module
let auth = null;
let db = null;
let uid = null;
let refs = null; // { profile: collection, session: collection }
let synced = {}; // 'profile/p123' -> signature of the cloud's version
let bases = {}; // 'p123' -> the cloud's version of that child as last seen here (to combine from)
const writing = {}; // 'p123' -> true while this iPad's server step for that child runs
const writeAgain = {}; // 'p123' -> { overwrite }: send once more when the running step is done
const heldBack = {}; // 'p123' -> what the cloud sent for that child during the running step
let remoteIds = { profile: new Set(), session: new Set() };
let unsubscribers = [];

// Profiles are small: their content is the signature (stableStringify in js/storage.js: keys
// sorted, so field order can't matter). Sessions only grow, so a few numbers tell whether one
// changed.

function signature(kind, data) {
  if (kind === 'profile') return stableStringify(data);
  return `${(data.exercises || []).length}|${!!data.completed}|${data.activeSeconds || 0}`;
}

function loadSynced() {
  try {
    const stored = JSON.parse(localStorage.getItem(SYNCED_KEY) || 'null');
    return stored && stored.uid === uid ? stored.docs : {};
  } catch (e) {
    return {};
  }
}

function saveSynced() {
  try {
    localStorage.setItem(SYNCED_KEY, JSON.stringify({ uid, docs: synced }));
  } catch (e) {
    // Without it, the next start just re-sends a little more than needed.
  }
}

function loadBases() {
  try {
    const stored = JSON.parse(localStorage.getItem(BASE_KEY) || 'null');
    return stored && stored.uid === uid ? stored.docs : {};
  } catch (e) {
    return {};
  }
}

function saveBases() {
  try {
    localStorage.setItem(BASE_KEY, JSON.stringify({ uid, docs: bases }));
  } catch (e) {
    // Without it, combining falls back to the signature below or, failing that, to the safest choice.
  }
}

// The cloud's version of a child as last seen here. iPads from before D20 only kept the
// signature, which for a child is the content itself.
function baseOf(id) {
  if (bases[id]) return bases[id];
  const sig = synced[`profile/${id}`];
  if (!sig) return null;
  try {
    return JSON.parse(sig);
  } catch (e) {
    return null;
  }
}

// `save` false: the caller saves once after a whole batch of changes.
function rememberBase(id, data, save = true) {
  if (data) {
    bases[id] = copyData(data);
    synced[`profile/${id}`] = signature('profile', data);
  } else {
    delete bases[id];
    delete synced[`profile/${id}`];
  }
  if (!save) return;
  saveBases();
  saveSynced();
}

function handToPage(changes) {
  if (changes.length && Cloud.hooks) Cloud.hooks.remoteChanges(changes);
}

function sessionsOf(state, id) {
  return state.sessions.filter((record) => record.profileId === id);
}

// Network trouble: the child is simply sent again later. Anything else is shown.
const RETRY_LATER = ['unavailable', 'failed-precondition', 'aborted', 'deadline-exceeded', 'cancelled'];

// One child goes up in one server step (a transaction): read the cloud's copy; if it is no longer
// what this iPad last saw, combine the two (mergeProfile); with `repair`, apply the one-time
// repairs (repairProfile); write. Offline the step fails instead of queueing a write that would
// land later over newer progress: the child is sent again on the next save, or when the internet is
// back. `overwrite` (restoring a backup) writes this iPad's copy as it is.
async function sendProfile(id, { overwrite = false, repair = false } = {}) {
  if (writing[id]) {
    const again = writeAgain[id] || {};
    writeAgain[id] = { overwrite: overwrite || !!again.overwrite, repair: repair || !!again.repair };
    return;
  }
  writing[id] = true;
  let sent = null; // this iPad's copy as the step read it
  let read; // the cloud's copy as the step read it
  let removedElsewhere = false;
  try {
    const written = await F.runTransaction(db, async (tx) => {
      const ref = F.doc(refs.profile, id);
      const snap = await tx.get(ref);
      const state = Cloud.hooks.getState();
      sent = copyData(state.profiles[id]);
      read = snap.exists() ? snap.data() : null;
      if (!sent) return null;
      // Gone from the cloud although this iPad has seen it there: removed on another iPad.
      if (!read && !overwrite && baseOf(id)) {
        removedElsewhere = true;
        return null;
      }
      let next = sent;
      if (!overwrite && read && signature('profile', read) !== synced[`profile/${id}`]) {
        next = mergeProfile(baseOf(id), sent, read);
      }
      if (repair && !overwrite) next = repairProfile(next, sessionsOf(state, id)) || next;
      tx.set(ref, next);
      return next;
    });
    if (removedElsewhere) {
      rememberBase(id, null);
      handToPage([{ kind: 'profile', id, data: null }]);
    } else if (written) {
      rememberBase(id, written);
      // The cloud now has more than this iPad had: take it in, combined with anything done here
      // while the step ran.
      if (!sameData(written, sent)) handToPage([{ kind: 'profile', id, data: written, base: sent }]);
    }
  } catch (e) {
    if (!RETRY_LATER.includes(e.code)) setState('failed', `Opslaan in de cloud lukte niet (${e.code || e.message}).`);
  } finally {
    writing[id] = false;
    if (id in heldBack) {
      // What the cloud sent meanwhile, unless it was the copy the step already combined or wrote.
      const held = heldBack[id];
      delete heldBack[id];
      const sig = held ? signature('profile', held) : undefined;
      if (sig !== synced[`profile/${id}`] && !(held && read && sig === signature('profile', read))) {
        const base = baseOf(id);
        rememberBase(id, held);
        handToPage([{ kind: 'profile', id, data: held, base }]);
      }
    }
    const again = writeAgain[id];
    delete writeAgain[id];
    if (again) sendProfile(id, again);
  }
}

// After signing in: children whose progress needs a one-time repair (repairProfile) are sent, so
// the repair is made on the cloud's copy, once for the whole family.
function repairWhereNeeded(state) {
  syncedProfiles(state).forEach(([id, profile]) => {
    if (repairProfile(profile, sessionsOf(state, id))) sendProfile(id, { repair: true });
  });
}

function setState(state, problem = null) {
  Cloud.state = state;
  Cloud.problem = problem;
  if (Cloud.hooks && Cloud.hooks.statusChanged) Cloud.hooks.statusChanged();
}

// Named children only: the unnamed old test profile stays on its own iPad.
function syncedProfiles(state) {
  return Object.entries(state.profiles).filter(([, profile]) => profile.name);
}

// `keys`: the synced marks these writes set; if a write fails they are forgotten, so the next
// save sends those documents again instead of assuming the cloud has them.
function commitInBatches(operations, keys = []) {
  for (let i = 0; i < operations.length; i += MAX_WRITES_PER_BATCH) {
    const batch = F.writeBatch(db);
    operations.slice(i, i + MAX_WRITES_PER_BATCH).forEach((op) => op(batch));
    // Offline, this waits until there is internet again; the write itself is already queued.
    batch.commit().catch((e) => {
      keys.forEach((key) => { delete synced[key]; });
      saveSynced();
      setState('failed', `Opslaan in de cloud lukte niet (${e.code || e.message}).`);
    });
  }
}

// Sends the children and sessions whose content differs from what the cloud has. Children go one
// by one through sendProfile; sessions (one document each, never written by two iPads) in batches.
function push(state, options = {}) {
  if (Cloud.state !== 'on') return;
  const operations = [];
  const keys = [];
  const named = new Set();
  syncedProfiles(state).forEach(([id, profile]) => {
    named.add(id);
    if (!options.overwrite && synced[`profile/${id}`] === signature('profile', profile)) return;
    sendProfile(id, { overwrite: !!options.overwrite });
  });
  state.sessions.forEach((record) => {
    if (!named.has(record.profileId)) return;
    const id = String(record.id);
    const sig = signature('session', record);
    if (synced[`session/${id}`] === sig) return;
    synced[`session/${id}`] = sig;
    keys.push(`session/${id}`);
    operations.push((batch) => batch.set(F.doc(refs.session, id), record));
  });
  if (operations.length === 0) return;
  saveSynced();
  commitInBatches(operations, keys);
}

function subscribe() {
  // includeMetadataChanges: also hear "now confirmed by the server" (no data change), which is
  // what tells online from offline; docChanges() below still lists only real data changes.
  unsubscribers = ['profile', 'session'].map((kind) => F.onSnapshot(refs[kind], { includeMetadataChanges: true }, (snap) => {
    remoteIds[kind] = new Set(snap.docs.map((d) => d.id));
    const changes = [];
    snap.docChanges().forEach((change) => {
      // This iPad's own write that the server hasn't confirmed yet: nothing new.
      if (change.doc.metadata.hasPendingWrites) return;
      const id = change.doc.id;
      const key = `${kind}/${id}`;
      const data = change.type === 'removed' ? null : change.doc.data();
      // While this iPad's own step for a child runs, what comes in waits for it (sendProfile).
      if (kind === 'profile' && writing[id]) {
        heldBack[id] = data;
        return;
      }
      const sig = data ? signature(kind, data) : undefined;
      if (synced[key] === sig) return;
      if (kind === 'profile') {
        const base = baseOf(id);
        rememberBase(id, data, false);
        changes.push({ kind, id, data, base });
        return;
      }
      if (data) synced[key] = sig;
      else delete synced[key];
      changes.push({ kind, id, data });
    });
    const wasOnline = Cloud.online;
    Cloud.online = !snap.metadata.fromCache;
    if (Cloud.online) Cloud.lastSyncAt = Date.now();
    saveSynced();
    saveBases();
    handToPage(changes);
    // Back online: children that couldn't go up while offline are sent now.
    if (Cloud.online && !wasOnline && Cloud.hooks) push(Cloud.hooks.getState());
    setState('on', Cloud.ruleOpen ? Cloud.problem : null);
  }, (e) => setState('failed', e.code === 'permission-denied'
    ? 'Geen toegang tot de cloud: controleer de beveiligingsregel in Firebase.'
    : `De cloud is niet bereikbaar (${e.code || e.message}).`)));
}

// Another family's data must never be readable: if the security rule was left open (Firestore's
// "test mode"), say so loudly instead of claiming the cloud is shielded.
async function checkRuleIsLocked() {
  try {
    await F.getDocFromServer(F.doc(db, 'families', 'rule-check-not-your-family', 'profiles', 'x'));
    return false; // readable: the rule is open
  } catch (e) {
    return e.code !== 'permission-denied' ? null : true;
  }
}

async function connect(user) {
  unsubscribers.forEach((stop) => stop());
  unsubscribers = [];
  uid = user.uid;
  Cloud.email = user.email;
  refs = {
    profile: F.collection(db, 'families', uid, 'profiles'),
    session: F.collection(db, 'families', uid, 'sessions')
  };
  synced = loadSynced();
  bases = loadBases();
  if (localStorage.getItem(LINKED_KEY) !== uid) {
    // First time on this iPad: merge with the family's cloud copy as the server has it.
    setState('linking');
    let profileDocs;
    let sessionDocs;
    try {
      [profileDocs, sessionDocs] = await Promise.all([F.getDocsFromServer(refs.profile), F.getDocsFromServer(refs.session)]);
    } catch (e) {
      setState('failed', e.code === 'permission-denied'
        ? 'Geen toegang tot de cloud: controleer de beveiligingsregel in Firebase.'
        : 'Voor de eerste keer samenvoegen is internet nodig. Probeer het opnieuw als er internet is.');
      return;
    }
    const cloudProfiles = {};
    const cloudSessions = [];
    synced = {};
    bases = {};
    profileDocs.forEach((d) => { cloudProfiles[d.id] = d.data(); rememberBase(d.id, d.data(), false); });
    saveBases();
    sessionDocs.forEach((d) => { cloudSessions.push(d.data()); synced[`session/${d.id}`] = signature('session', d.data()); });
    const local = Cloud.hooks.getState();
    keepPreCloudBackup(local);
    const merged = mergeForFirstLink(local, cloudProfiles, cloudSessions);
    localStorage.setItem(LINKED_KEY, uid);
    setState('on');
    Cloud.hooks.replaceState(merged); // saving it sends what this iPad adds
  } else {
    setState('on');
    // Progress made here while the cloud wasn't running goes up, combined with what the other
    // iPads did meanwhile (sendProfile).
    push(Cloud.hooks.getState());
  }
  repairWhereNeeded(Cloud.hooks.getState());
  subscribe();
  if ((await checkRuleIsLocked()) === false) {
    Cloud.ruleOpen = true;
    setState(Cloud.state, 'Let op: de beveiligingsregel in Firebase staat open. Iedereen kan jullie gegevens lezen. Zet de regel uit firestore.rules in Firebase.');
  }
}

function disconnect() {
  unsubscribers.forEach((stop) => stop());
  unsubscribers = [];
  uid = null;
  refs = null;
  Cloud.email = null;
  setState('signedOut');
}

const Cloud = {
  // unconfigured | loading | failed | signedOut | linking | on
  state: window.FIREBASE_CONFIG ? 'loading' : 'unconfigured',
  problem: null,
  email: null,
  online: navigator.onLine,
  lastSyncAt: null,
  hooks: null, // from the page: getState(), replaceState(state), remoteChanges(changes), statusChanged()

  async start(hooks) {
    this.hooks = hooks;
    if (!window.FIREBASE_CONFIG) return;
    let appModule;
    try {
      [appModule, A, F] = await Promise.all([
        import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-firestore.js`)
      ]);
    } catch (e) {
      setState('failed', `De cloud kon niet geladen worden (geen internet, of deze iPad is te oud): ${e.message}. De app werkt gewoon op deze iPad.`);
      return;
    }
    const app = appModule.initializeApp(window.FIREBASE_CONFIG);
    auth = A.getAuth(app);
    db = F.initializeFirestore(app, {
      localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true
    });
    A.onAuthStateChanged(auth, (user) => (user ? connect(user) : disconnect()));
  },

  push,

  async signIn() {
    const provider = new A.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await A.signInWithPopup(auth, provider);
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        setState('signedOut', `Inloggen lukte niet (${e.code || e.message}).`);
      }
    }
  },

  // After a problem (no internet at the first merge, a failed save): connect again.
  retry() {
    if (!auth || !auth.currentUser) return;
    unsubscribers.forEach((stop) => stop());
    unsubscribers = [];
    connect(auth.currentUser);
  },

  // This iPad stays linked to the account: signing in again with it combines each child with
  // the cloud's copy from where this iPad left off (D20). Another account merges by name.
  async signOut() {
    await A.signOut(auth);
  },

  // A child removed on this iPad disappears from the cloud (and so from every iPad) too.
  deleteProfile(profileId, sessionIds) {
    if (this.state !== 'on') return;
    const operations = [(batch) => batch.delete(F.doc(refs.profile, profileId))];
    rememberBase(profileId, null);
    sessionIds.forEach((id) => {
      operations.push((batch) => batch.delete(F.doc(refs.session, String(id))));
      delete synced[`session/${id}`];
    });
    saveSynced();
    commitInBatches(operations);
  },

  // After restoring a backup: whatever the backup doesn't have is removed from the cloud as well.
  removeMissing(state) {
    if (this.state !== 'on') return;
    const keepProfiles = new Set(syncedProfiles(state).map(([id]) => id));
    const keepSessions = new Set(state.sessions.map((s) => String(s.id)));
    const operations = [];
    remoteIds.profile.forEach((id) => {
      if (!keepProfiles.has(id)) { operations.push((batch) => batch.delete(F.doc(refs.profile, id))); rememberBase(id, null); }
    });
    remoteIds.session.forEach((id) => {
      if (!keepSessions.has(id)) { operations.push((batch) => batch.delete(F.doc(refs.session, id))); delete synced[`session/${id}`]; }
    });
    saveSynced();
    if (operations.length) commitInBatches(operations);
  },

  statusText() {
    if (this.problem) return this.problem;
    if (this.state === 'loading') return 'Synchroniseren wordt geladen…';
    if (this.state === 'signedOut') return 'Uit. Log in om de voortgang op alle iPads te delen.';
    if (this.state === 'linking') return 'Bezig met samenvoegen met de andere iPads…';
    if (this.state !== 'on') return '';
    if (!this.online) return `Aan (${this.email}). Geen internet: wordt bijgewerkt zodra er weer internet is.`;
    const time = this.lastSyncAt ? new Date(this.lastSyncAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '';
    return `Aan (${this.email}). Laatst bijgewerkt ${time}.`;
  }
};

window.Cloud = Cloud;
window.addEventListener('online', () => {
  if (Cloud.state === 'failed') Cloud.retry();
  else if (Cloud.state === 'on' && Cloud.hooks) push(Cloud.hooks.getState());
});
