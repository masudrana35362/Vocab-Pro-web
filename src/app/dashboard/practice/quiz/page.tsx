"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Word } from "@/lib/firebase/firestore";
import { updateWordProgress } from "@/lib/firebase/srs";
import Link from "next/link";

// Helper to shuffle array
const shuffle = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function QuizPage() {
  const { user } = useAuth();
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [quizWords, setQuizWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchWords() {
      if (!user) return;
      const snapshot = await getDocs(collection(db, "users", user.uid, "words"));
      const words = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Word));
      setAllWords(words);
      
      const shuffled = shuffle(words);
      setQuizWords(shuffled.slice(0, 10));
      setLoading(false);
    }
    fetchWords();
  }, [user]);

  // Options are now meanings, not words
  const options = useMemo(() => {
    if (quizWords.length === 0 || allWords.length < 4) return [];
    
    const currentWord = quizWords[currentIndex];
    if (!currentWord) return [];

    const otherWords = allWords.filter(w => w.id !== currentWord.id);
    const shuffledOthers = shuffle(otherWords).slice(0, 3);
    
    return shuffle([currentWord, ...shuffledOthers]);
  }, [quizWords, currentIndex, allWords]);

  const handleSelect = async (option: Word) => {
    if (selectedOption !== null || updating || !user) return; 
    
    const currentWord = quizWords[currentIndex];
    const correct = option.id === currentWord.id;
    
    setSelectedOption(option.meaning);
    setIsCorrect(correct);
    setUpdating(true);

    try {
      await updateWordProgress(user.uid, currentWord.id!, currentWord.srs, correct ? 4 : 1);
      
      setTimeout(() => {
        if (currentIndex < quizWords.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setSelectedOption(null);
          setIsCorrect(null);
        } else {
          setSessionComplete(true);
        }
        setUpdating(false);
      }, 1500);
    } catch (error) {
      console.error(error);
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (allWords.length < 4) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Not enough words</h2>
        <p className="text-gray-500 mb-8">You need at least 4 words in your library to play the multiple choice quiz.</p>
        <Link href="/dashboard/add" className="px-6 py-3 bg-primary text-white rounded-xl">Add Words</Link>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-sm border border-gray-100 dark:border-gray-700">
          <span className="text-8xl mb-6 block">🏆</span>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Quiz Complete!</h2>
          <Link href="/dashboard/practice" className="px-6 py-3 bg-primary text-white rounded-xl inline-block mt-4">
            Back to Practice Hub
          </Link>
        </div>
      </div>
    );
  }

  const currentWord = quizWords[currentIndex];
  const progress = ((currentIndex + 1) / quizWords.length) * 100;
  
  // Extract POS from tags or default to Word
  const getPos = (tags: string[]) => {
    const posTags = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'];
    const found = tags.find(t => posTags.includes(t.toLowerCase()));
    return found ? found : 'Word';
  };

  const pos = getPos(currentWord.tags);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-6 px-4">
      <div className="max-w-xl mx-auto">
        
        {/* Top Bar matching Android */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link href="/dashboard/practice" className="p-2 mr-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">
              QUESTION {currentIndex + 1} OF {quizWords.length}
            </span>
          </div>
          <span className="text-xs font-bold text-green-600 tracking-wider">
            STREAK: 3
          </span>
        </div>

        {/* Slim Green Progress Bar */}
        <div className="w-full bg-primary/10 rounded-full h-1.5 mb-12 overflow-hidden">
          <div 
            className="bg-green-600 h-1.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex flex-col items-center mb-10 text-center">
          {/* Part of Speech Pill */}
          <div className="bg-indigo-100 dark:bg-indigo-900/30 text-primary px-4 py-1.5 rounded-full flex items-center mb-6">
            <span className="font-black mr-2 text-lg leading-none mt-[-4px]">•••</span>
            <span className="text-sm font-bold capitalize">{pos}</span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            What is the definition of
          </h2>
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary capitalize">
            {currentWord.word}?
          </h1>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {options.map((option, idx) => {
            const labels = ["A", "B", "C", "D"];
            let btnClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-primary hover:bg-primary/5";
            let labelClass = "bg-gray-100 dark:bg-gray-700 text-gray-500";
            
            if (selectedOption) {
              const isCorrectAnswer = option.meaning === currentWord.meaning;
              const isSelected = option.meaning === selectedOption;
              
              if (isCorrectAnswer) {
                btnClass = "bg-primary/5 border-primary text-gray-900 dark:text-white";
                labelClass = "bg-primary text-white";
              } else if (isSelected && !isCorrectAnswer) {
                btnClass = "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-900 dark:text-red-100";
                labelClass = "bg-red-500 text-white";
              } else {
                btnClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 opacity-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(option)}
                disabled={selectedOption !== null}
                className={`w-full p-4 flex items-center rounded-2xl border-2 transition-all text-left shadow-sm ${btnClass}`}
              >
                <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full font-bold mr-4 transition-colors ${labelClass}`}>
                  {labels[idx]}
                </div>
                <span className="text-lg font-medium leading-tight">
                  {option.meaning}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
