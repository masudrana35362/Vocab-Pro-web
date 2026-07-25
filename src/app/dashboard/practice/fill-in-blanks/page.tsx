"use client";

import { useEffect, useState, useRef } from "react";
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

export default function FillInBlanksPage() {
  const { user } = useAuth();
  const [quizWords, setQuizWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [input, setInput] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [updating, setUpdating] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchWords() {
      if (!user) return;
      const snapshot = await getDocs(collection(db, "users", user.uid, "words"));
      const words = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Word));
      
      const wordsWithExamples = words.filter(w => w.example && w.example.length > 5);
      const shuffled = shuffle(wordsWithExamples);
      setQuizWords(shuffled.slice(0, 10));
      setLoading(false);
    }
    fetchWords();
  }, [user]);

  useEffect(() => {
    setShowHint(false);
    setInput("");
    setIsAnswered(false);
    setIsCorrect(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [currentIndex]);

  const currentWord = quizWords[currentIndex];

  const checkAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || updating || !input.trim()) return;
    
    setUpdating(true);
    const correct = input.trim().toLowerCase() === currentWord.word.toLowerCase();
    
    setIsCorrect(correct);
    setIsAnswered(true);

    try {
      await updateWordProgress(user.uid, currentWord.id!, currentWord.srs, correct ? 4 : 2);
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const nextWord = () => {
    if (currentIndex < quizWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0F7A65]"></div>
      </div>
    );
  }

  if (quizWords.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">No suitable words</h2>
        <p className="text-gray-500 mb-8">You need words with example sentences in your library to play this mode.</p>
        <Link href="/dashboard/add" className="px-6 py-3 bg-[#0F7A65] text-white rounded-xl">Add Words</Link>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-sm border border-gray-100 dark:border-gray-700">
          <span className="text-8xl mb-6 block">✍️</span>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Practice Complete!</h2>
          <Link href="/dashboard/practice" className="px-6 py-3 bg-[#0F7A65] text-white rounded-xl inline-block mt-4">
            Back to Practice Hub
          </Link>
        </div>
      </div>
    );
  }

  // Parse sentence to insert the input field
  const regex = new RegExp(`\\b${currentWord.word}\\b`, 'i'); // case insensitive match
  const match = currentWord.example.match(regex);
  const sentence = currentWord.example;
  
  let beforeText = sentence;
  let afterText = "";
  
  if (match && match.index !== undefined) {
    beforeText = sentence.substring(0, match.index);
    afterText = sentence.substring(match.index + currentWord.word.length);
  }

  const progress = ((currentIndex + 1) / quizWords.length) * 100;

  return (
    <div className="min-h-screen bg-[#F8F9FE] dark:bg-gray-900 pt-6 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Top Bar matching Android */}
        <div className="flex items-center mb-4">
          <Link href="/dashboard/practice" className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider ml-2">
            FILL IN THE BLANKS
          </span>
        </div>

        {/* Slim Dark Green Progress Bar */}
        <div className="w-full bg-[#E5E7EB] dark:bg-gray-800 rounded-full h-1.5 mb-12 overflow-hidden">
          <div 
            className="bg-[#0F7A65] h-1.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-[24px] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center min-h-[300px]">
          
          <form onSubmit={checkAnswer} className="w-full mb-12">
            {/* Sentence with Inline Input */}
            <div className="text-2xl font-bold text-gray-900 dark:text-white leading-[1.8] text-center">
              {beforeText}
              <span className="inline-block mx-2 relative top-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isAnswered}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className={`w-[120px] md:w-[160px] text-center bg-transparent border-2 rounded-xl py-1 px-2 transition-all outline-none 
                    ${!isAnswered ? "border-[#3F35CE] text-[#3F35CE] dark:text-indigo-400" : ""}
                    ${isAnswered && isCorrect ? "border-green-600 text-green-600 bg-green-50" : ""}
                    ${isAnswered && !isCorrect ? "border-red-500 text-red-500 bg-red-50" : ""}
                  `}
                  style={{ width: `${Math.max(input.length * 15 + 40, 100)}px` }} // dynamic width
                />
              </span>
              {afterText}
            </div>
            
            {/* Hidden submit for form enter key */}
            <button type="submit" className="hidden">Submit</button>
          </form>

          {/* Hint Toggle */}
          <button 
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="bg-[#F8F9FE] dark:bg-gray-700 text-[#3F35CE] dark:text-indigo-400 px-5 py-2.5 rounded-full flex items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[15px] font-medium">
              {showHint ? currentWord.meaning : "Show Definition"}
            </span>
          </button>

          {/* Answer Reveal (if incorrect) */}
          <div className={`mt-8 flex flex-col items-center transition-opacity duration-300 ${isAnswered && !isCorrect ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
             <p className="text-red-500 font-medium mb-1">Incorrect. The correct word is:</p>
             <p className="text-3xl font-extrabold text-red-600 capitalize">{currentWord.word}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <button
            onClick={isAnswered ? nextWord : () => checkAnswer()}
            disabled={!input.trim() && !isAnswered}
            className={`w-full py-4 rounded-xl font-bold text-lg tracking-wider transition-colors shadow-sm
              ${(input.trim() || isAnswered)
                ? "bg-[#3F35CE] text-white hover:bg-indigo-700" 
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"}`}
          >
            {isAnswered ? "NEXT QUESTION" : "SUBMIT"}
          </button>
        </div>

      </div>
    </div>
  );
}
