import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, setDoc, getDoc, deleteDoc,
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

export async function createRoom(id, data)       { await setDoc(doc(db,"rooms",id), data); }
export async function setRoomHost(id, hostId)    { await updateDoc(doc(db,"rooms",id), {hostId}); }
export async function getRoom(id)                { const s=await getDoc(doc(db,"rooms",id)); return s.exists()?s.data():null; }
export function subscribeToRoom(id, cb)          { return onSnapshot(doc(db,"rooms",id), snap=>cb(snap.exists()?snap.data():null)); }
export function subscribeToRooms(cb)             { return onSnapshot(collection(db,"rooms"), snap=>{const r={};snap.forEach(d=>{r[d.id]=d.data();});cb(r);}); }

export async function createUser(id, data)       { await setDoc(doc(db,"users",id), data); }
export async function deleteUser(id)             { await deleteDoc(doc(db,"users",id)); }
export async function updateUserCollection(id,col){ await updateDoc(doc(db,"users",id),{collection:col}); }
export async function updateUserReady(id,ready)  { await updateDoc(doc(db,"users",id),{ready}); }
export async function updateUserLastSeen(id)     { try{await updateDoc(doc(db,"users",id),{lastSeen:Date.now()});}catch{} }
export function subscribeToUsers(cb)             { return onSnapshot(collection(db,"users"), snap=>{const u={};snap.forEach(d=>{u[d.id]=d.data();});cb(u);}); }
