import { collection, doc, setDoc, getDoc, getDocs, query, where, Timestamp, orderBy, limit, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "./config";

import { UserProfile, Word, UserSettings, SRSData } from "@/types";
export type { UserProfile, Word, UserSettings, SRSData };

// --- Firestore Helpers ---

// Get a user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
};

// Add a new word for a user
export const addWord = async (uid: string, wordData: Omit<Word, "id" | "createdAt" | "srs">) => {
  const wordsRef = collection(db, "users", uid, "words");
  const newWordRef = await addDoc(wordsRef, {
    ...wordData,
    srs: {
      interval: 0,
      easeFactor: 2.5,
      nextReview: Timestamp.now(),
      masteryLevel: 0,
      timesMissed: 0
    },
    createdAt: Timestamp.now()
  });
  return newWordRef.id;
};

// Get a single word
export const getWord = async (uid: string, wordId: string): Promise<Word | null> => {
  const docRef = doc(db, "users", uid, "words", wordId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Word;
  }
  return null;
};

// Update an existing word
export const updateWord = async (uid: string, wordId: string, wordData: Partial<Word>) => {
  const docRef = doc(db, "users", uid, "words", wordId);
  await updateDoc(docRef, wordData);
};

// Delete a word
export const deleteWord = async (uid: string, wordId: string) => {
  const docRef = doc(db, "users", uid, "words", wordId);
  await deleteDoc(docRef);
};

// Get words due for review today
export const getDueWords = async (uid: string) => {
  const wordsRef = collection(db, "users", uid, "words");
  const q = query(
    wordsRef, 
    where("srs.nextReview", "<=", Timestamp.now()),
    orderBy("srs.nextReview", "asc"),
    limit(50)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Word));
};

// Get all words for a user
export const getAllWords = async (uid: string) => {
  const wordsRef = collection(db, "users", uid, "words");
  const q = query(wordsRef, orderBy("createdAt", "desc"));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Word));
};
