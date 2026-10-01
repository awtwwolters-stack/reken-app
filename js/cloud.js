// Cloud sync between iPads (Firebase: Google sign-in + Firestore database), see BACKLOG D12.
//
// Offline-first: localStorage stays the working copy (js/storage.js), so the app starts at once and
// works without internet. This file sends what changed and brings in what other iPads changed.
// Without js/cloud-config.js filled in, or when the Firebase code can't be loaded, the app simply
// keeps working on this iPad only.
//
// Data: families/{parent's user id}/profiles/{profileId} - one document per child, so children
// practising on different iPads never overwrite each other - and families/{uid}/sessions/{id}.
// The Firestore security rule (set in the Firebase console) lets only that signed-in parent read
// or write it; the web config in the public repository is not a secret.

const SDK = 'https://www.gstatic.com/firebasejs/12.19.0';
const LINKED_KEY = 'reken-app-cloud-linked'; // the account this iPad's data has been merged with
const SYNCED_KEY = 'reken-app-cloud-synced'; // what the cloud has, per document, as last seen here
const MAX_WRITES_PER_BATCH = 450; // Firestore allows 500 per batch

let A = null; // firebase-auth module
let F = null; // firebase-firestore module
let auth = null;
let db = null;
let uid = null;
let refs = null; // { profile: collection, session: collection }
let synced = {}; // 'profile/p123' -> signature of the cloud's version
let remoteIds = { profile: new Set(), session: new Set() };
let unsubscribers = [];

// Profiles are small: their content is the signature (keys sorted, so field order can't matter).
// Sessions only grow, so a few numbers tell whether one changed.
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

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

// Sends the children and sessions whose content differs from what the cloud has.
function push(state) {
  if (Cloud.state !== 'on') return;
  const operations = [];
  const keys = [];
  const named = new Set();
  syncedProfiles(state).forEach(([id, profile]) => {
    named.add(id);
    const sig = signature('profile', profile);
    if (synced[`profile/${id}`] === sig) return;
    synced[`profile/${id}`] = sig;
    keys.push(`profile/${id}`);
    operations.push((batch) => batch.set(F.doc(refs.profile, id), profile));
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
      const key = `${kind}/${change.doc.id}`;
      const data = change.type === 'removed' ? null : change.doc.data();
      const sig = data ? signature(kind, data) : undefined;
      if (synced[key] === sig) return;
      if (data) synced[key] = sig;
      else delete synced[key];
      changes.push({ kind, id: change.doc.id, data });
    });
    Cloud.online = !snap.metadata.fromCache;
    if (Cloud.online) Cloud.lastSyncAt = Date.now();
    saveSynced();
    if (changes.length && Cloud.hooks) Cloud.hooks.remoteChanges(changes);
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
    profileDocs.forEach((d) => { cloudProfiles[d.id] = d.data(); synced[`profile/${d.id}`] = signature('profile', d.data()); });
    sessionDocs.forEach((d) => { cloudSessions.push(d.data()); synced[`session/${d.id}`] = signature('session', d.data()); });
    const local = Cloud.hooks.getState();
    keepPreCloudBackup(local);
    const merged = mergeForFirstLink(local, cloudProfiles, cloudSessions);
    localStorage.setItem(LINKED_KEY, uid);
    setState('on');
    Cloud.hooks.replaceState(merged); // saving it sends what this iPad adds
  } else {
    setState('on');
    // Progress made here while the cloud wasn't running goes up before anything comes down.
    push(Cloud.hooks.getState());
  }
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
      setState('failed', 'De cloud kon niet geladen worden (geen internet?). De app werkt gewoon op deze iPad.');
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

  async signOut() {
    localStorage.removeItem(LINKED_KEY); // signing in again merges again (by name, so no doubles)
    await A.signOut(auth);
  },

  // A child removed on this iPad disappears from the cloud (and so from every iPad) too.
  deleteProfile(profileId, sessionIds) {
    if (this.state !== 'on') return;
    const operations = [(batch) => batch.delete(F.doc(refs.profile, profileId))];
    delete synced[`profile/${profileId}`];
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
      if (!keepProfiles.has(id)) { operations.push((batch) => batch.delete(F.doc(refs.profile, id))); delete synced[`profile/${id}`]; }
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
window.addEventListener('online', () => { if (Cloud.state === 'failed') Cloud.retry(); });
