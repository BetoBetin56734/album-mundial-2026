import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, setDoc, getDoc,
  collection, onSnapshot, updateDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFwwZLKINVvbjD5_Ejhmg-Xjnm2PB7-zY",
  authDomain: "album-mundial-2026-51652.firebaseapp.com",
  projectId: "album-mundial-2026-51652",
  storageBucket: "album-mundial-2026-51652.firebasestorage.app",
  messagingSenderId: "891664834785",
  appId: "1:891664834785:web:9f4824c3c3248e8b5217a0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── user helpers ─────────────────────────────────────────

export async function createUser(id, data) {
  await setDoc(doc(db, "users", id), data);
}

export async function getUser(id) {
  const snap = await getDoc(doc(db, "users", id));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserCollection(id, collection_data) {
  await updateDoc(doc(db, "users", id), { collection: collection_data });
}

// Listen to ALL users in real time
export function subscribeToUsers(callback) {
  return onSnapshot(collection(db, "users"), (snap) => {
    const users = {};
    snap.forEach(d => { users[d.id] = d.data(); });
    callback(users);
  });
}
