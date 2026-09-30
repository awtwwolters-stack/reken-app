// Firebase web config for cloud sync between iPads (see js/cloud.js). Not a secret: the data is
// protected by the Firestore security rule, which lets only the signed-in parent read and write
// their own family's data (firestore.rules in this repository). null = sync off; the app then
// works on each iPad separately.
window.FIREBASE_CONFIG = null;
