import { getApp, getApps, initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase wiring for FridgeToMeal (project fridgetomeal-b08fe) — web.
 *
 * The web config values below are Firebase's public app identifiers —
 * they are designed to ship in client code. Access is controlled by
 * Firebase Authentication plus the Firestore security rules (each user
 * can only read and write their own /users/<uid> tree). No admin keys
 * or secrets live here; the Gemini key stays server-side on Vercel.
 *
 * Platform note: this file serves web (and tooling). Native builds use
 * firebase.native.ts instead, which imports the scoped @firebase/*
 * packages — the umbrella 'firebase/auth' entry has no React Native
 * build, so on Android/iOS it silently resolves to the browser build
 * whose sessions live in memory only and are lost when the app closes.
 * Every module imports its Auth/Firestore helpers from './firebase' so
 * each platform always gets one consistent set of Firebase modules.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyAgT6gPO5zgKG8ht0S9zKyaxS7vKbhSYTM',
  authDomain: 'fridgetomeal-b08fe.firebaseapp.com',
  projectId: 'fridgetomeal-b08fe',
  storageBucket: 'fridgetomeal-b08fe.firebasestorage.app',
  messagingSenderId: '934917653625',
  appId: '1:934917653625:web:80e3f70236cb76a18680a8',
};

/** OAuth web client ID for the native Google Sign-In flow (not a secret). */
export const GOOGLE_WEB_CLIENT_ID =
  '934917653625-e6k8ecuvc27daqht30j7f8qj3pnm3e15.apps.googleusercontent.com';

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = firebaseAuth.getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  type User,
} from 'firebase/auth';

export {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
