// Firebase web config for cloud sync between iPads (see js/cloud.js). Not a secret: the data is
// protected by the Firestore security rule, which lets only the signed-in parent read and write
// their own family's data (firestore.rules in this repository). null = sync off; the app then
// works on each iPad separately.
window.FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBSYjL6xWX1Y_8dgVaoAkfgqC0UiipiNH8',
  authDomain: 'reken-app-4df99.firebaseapp.com',
  projectId: 'reken-app-4df99',
  storageBucket: 'reken-app-4df99.firebasestorage.app',
  messagingSenderId: '849449515242',
  appId: '1:849449515242:web:89aef777711d7942cc3f93'
};
