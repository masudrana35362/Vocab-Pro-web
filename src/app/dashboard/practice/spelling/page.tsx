"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Word } from "@/lib/firebase/firestore";
import { updateWordProgress } from "@/lib/firebase/srs";
import Link from "next/link";

const shuffle = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Custom Keyboard Component
const CustomKeyboard = ({ 
  onKeyPress, 
  onBackspace, 
  onHint, 
  onSubmit, 
  isSubmitEnabled,
  isAnswered
}: {
  onKeyPress: (key: string) => void,
  onBackspace: () => void,
  onHint: () => void,
  onSubmit: () => void,
  isSubmitEnabled: boolean,
  isAnswered: boolean
}) => {
  const rows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  return (
    <div className="w-full max-w-md mx-auto mt-auto mb-4 bg-gray-100 dark:bg-gray-800 p-2 rounded-2xl shadow-inner">
      {rows.map((row, i) => (
        <div key={i} className="flex justify-center mb-2 gap-1 md:gap-2">
          {i === 2 && (
            <button 
              onClick={onHint}
              disabled={isAnswered}
              className="px-2 md:px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-300 transition-colors shadow-sm disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          )}
          
          {row.map(key => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              disabled={isAnswered}
              className="flex-1 max-w-[40px] py-3 bg-white dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-bold text-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 uppercase"
            >
              {key}
            </button>
          ))}
          
          {i === 2 && (
            <button 
              onClick={onBackspace}
              disabled={isAnswered}
              className="px-2 md:px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-300 transition-colors shadow-sm disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>
            </button>
          )}
        </div>
      ))}
      <div className="flex justify-center mt-2 px-1">
        <button
          onClick={onSubmit}
          disabled={!isSubmitEnabled}
          className={`w-full py-4 rounded-xl font-bold text-lg tracking-wider transition-colors shadow-sm
            ${isSubmitEnabled 
              ? "bg-primary text-white hover:bg-indigo-700" 
              : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"}`}
        >
          {isAnswered ? "NEXT WORD" : "CHECK ANSWER"}
        </button>
      </div>
    </div>
  );
};

export default function SpellingBeePage() {
  const { user } = useAuth();
  const [quizWords, setQuizWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [input, setInput] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchWords() {
      if (!user) return;
      const snapshot = await getDocs(collection(db, "users", user.uid, "words"));
      const words = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Word));
      
      const shuffled = shuffle(words);
      setQuizWords(shuffled.slice(0, 10)); 
      setLoading(false);
    }
    fetchWords();
  }, [user]);

  useEffect(() => {
    if (quizWords.length > 0 && currentIndex < quizWords.length) {
      playAudio();
    }
  }, [currentIndex, quizWords]);

  const currentWord = quizWords[currentIndex];

  const playAudio = () => {
    if (!currentWord) return;
    
    if (currentWord.audio_url) {
      const audio = new Audio(currentWord.audio_url);
      audio.play().catch(e => console.error("Audio play failed:", e));
    } else {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(currentWord.word);
        utterance.lang = 'en-US';
        utterance.rate = 0.85; 
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleKeyPress = (char: string) => {
    if (input.length < currentWord.word.length) {
      setInput(prev => prev + char);
    }
  };

  const handleBackspace = () => {
    setInput(prev => prev.slice(0, -1));
  };

  const handleHint = () => {
    if (input.length < currentWord.word.length) {
      setInput(prev => prev + currentWord.word[input.length].toLowerCase());
    }
  };

  const checkAnswer = async () => {
    if (!user || updating) return;
    setUpdating(true);

    const correct = input.toLowerCase() === currentWord.word.toLowerCase();
    setIsCorrect(correct);
    setIsAnswered(true);

    try {
      await updateWordProgress(user.uid, currentWord.id!, currentWord.srs, correct ? 4 : 1);
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < quizWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setInput("");
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      setSessionComplete(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (quizWords.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">No words found</h2>
        <Link href="/dashboard/add" className="px-6 py-3 bg-primary text-white rounded-xl">Add Words</Link>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-sm border border-gray-100 dark:border-gray-700">
          <span className="text-8xl mb-6 block">🐝</span>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Spelling Bee Complete!</h2>
          <Link href="/dashboard/practice" className="px-6 py-3 bg-primary text-white rounded-xl inline-block mt-4">
            Back to Practice Hub
          </Link>
        </div>
      </div>
    );
  }

  const getPos = (tags: string[]) => {
    const posTags = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'];
    const found = tags.find(t => posTags.includes(t.toLowerCase()));
    return found ? found : 'Word';
  };
  const pos = getPos(currentWord.tags);

  return (
    <div className="min-h-screen bg-[#F8F9FE] dark:bg-gray-900 flex flex-col pt-4 px-4">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard/practice" className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">
            {currentIndex + 1} OF {quizWords.length}
          </span>
        </div>

        {/* Big Play Button */}
        <div className="flex flex-col items-center justify-center flex-1 min-h-[250px]">
          <button 
            onClick={playAudio}
            className="w-28 h-28 bg-[#3F35CE] rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 mb-4"
          >
            <svg className="w-14 h-14 text-white ml-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Tap to listen again</p>

          {/* Word Input Display */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: currentWord.word.length }).map((_, i) => {
              const char = input[i];
              const isWrong = isAnswered && !isCorrect && char?.toLowerCase() !== currentWord.word[i].toLowerCase();
              return (
                <div 
                  key={i} 
                  className={`w-10 h-12 md:w-12 md:h-14 rounded-lg flex items-center justify-center text-2xl font-bold uppercase border-b-4 transition-all
                    ${char 
                      ? (isWrong 
                          ? "bg-red-100 border-red-500 text-red-700" 
                          : "bg-white border-primary text-gray-900") 
                      : "bg-gray-100 border-gray-300 text-transparent"
                    }
                  `}
                >
                  {char || "_"}
                </div>
              );
            })}
          </div>

          {/* Hint Pill */}
          <div className="bg-[#E3EAFB] dark:bg-[#1E293B] text-[#4B608F] dark:text-[#94A3B8] px-4 py-1.5 rounded-full flex items-center mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm font-medium capitalize">{pos}</span>
          </div>

          {/* Result Text */}
          <div className={`h-16 flex flex-col items-center justify-center transition-opacity duration-300 ${isAnswered ? 'opacity-100' : 'opacity-0'}`}>
            {isCorrect ? (
              <h3 className="text-2xl font-bold text-green-600">Correct! ✨</h3>
            ) : (
              <div className="text-center">
                <p className="text-sm text-red-500 mb-1">Incorrect. The word was:</p>
                <p className="text-2xl font-black text-red-600 uppercase tracking-widest">{currentWord.word}</p>
              </div>
            )}
          </div>
        </div>

        <CustomKeyboard 
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onHint={handleHint}
          onSubmit={isAnswered ? handleNext : checkAnswer}
          isSubmitEnabled={isAnswered || input.length === currentWord.word.length}
          isAnswered={isAnswered}
        />
        
      </div>
    </div>
  );
}
