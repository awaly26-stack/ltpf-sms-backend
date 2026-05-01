
// Fix: Use standard compatibility imports for Firebase v9+ to resolve missing modular exports
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

// Initialisation de Firebase avec les identifiants du projet
const firebaseConfig = {
  apiKey: "AIzaSyCw0OJyyuGUpp9Qaw6e9xshET9XFx1Q-PQ",
  authDomain: "ltpf-edupro.firebaseapp.com",
  projectId: "ltpf-edupro",
  storageBucket: "ltpf-edupro.firebasestorage.app",
  messagingSenderId: "310888237632",
  appId: "1:310888237632:web:67b8f97001c97427aa2da5",
  measurementId: "G-N4EK886Y3V"
};

// Fix: Utilisation du pattern compatibility pour la robustesse de l'initialisation
const app = firebase.apps.length > 0 ? firebase.app() : firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(app);

// Optimisation de la connexion Firestore pour les environnements réseau restreints
const db = firebase.firestore(app);
db.settings({
  experimentalForceLongPolling: true
});

export { app, auth, db };
export default app;
