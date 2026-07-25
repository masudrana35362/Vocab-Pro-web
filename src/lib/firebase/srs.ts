import { Timestamp, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "./config";
import { SRSData, Word } from "./firestore";

// SM-2 Algorithm Implementation
// Quality: 
// 0: Complete blackout
// 1: Incorrect, but remembered upon seeing answer
// 2: Incorrect, but seemed easy to remember
// 3: Correct, but with difficulty
// 4: Correct, after a hesitation
// 5: Correct, perfect response

export const calculateNextReview = (srs: SRSData | undefined, quality: number): SRSData => {
  let { interval, easeFactor, timesMissed, masteryLevel } = srs || {
    interval: 0,
    easeFactor: 2.5,
    timesMissed: 0,
    masteryLevel: 0
  };

  if (quality >= 3) {
    // Correct
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    
    masteryLevel = Math.min(masteryLevel + 1, 5);
  } else {
    // Incorrect
    interval = 1;
    timesMissed += 1;
    masteryLevel = Math.max(0, masteryLevel - 1);
  }

  // Update Ease Factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Calculate next review timestamp
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    interval,
    easeFactor,
    nextReview: Timestamp.fromDate(nextReviewDate),
    timesMissed,
    masteryLevel
  };
};

export const updateWordProgress = async (uid: string, wordId: string, currentSrs: SRSData, quality: number) => {
  const newSrs = calculateNextReview(currentSrs, quality);
  const wordRef = doc(db, "users", uid, "words", wordId);
  const userRef = doc(db, "users", uid);
  
  await updateDoc(wordRef, {
    srs: newSrs
  });
  
  // Update user stats if correct
  if (quality >= 3) {
     // A simple way to track activity. Real app might need a more robust streak calculator.
     await updateDoc(userRef, {
       lastActivityDate: Timestamp.now()
     });
  }
  
  return newSrs;
};
