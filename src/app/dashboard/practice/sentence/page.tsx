"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAllWords } from "@/hooks/useWords";
import Link from "next/link";
import { ArrowLeft, CheckCircle, RotateCcw, XCircle } from "lucide-react";

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

interface WordChip {
  id: string;
  text: string;
}

export default function SentenceConstructionPage() {
  const { user } = useAuth();
  const { data: allWords = [], isLoading } = useAllWords(user?.uid);
  
  const sentences = useMemo(() => {
    return allWords.filter(w => w.example && w.example.trim().length > 0 && w.example !== "Fetching example...");
  }, [allWords]);

  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [bankChips, setBankChips] = useState<WordChip[]>([]);
  const [constructedChips, setConstructedChips] = useState<WordChip[]>([]);
  
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentWord = sentences[currentIndex];

  useEffect(() => {
    if (currentWord) {
      // Split by spaces, preserving punctuation attached to words for now,
      // or we can strip punctuation to make it simpler.
      // Let's strip punctuation at the end of sentences for cleaner chips.
      const rawWords = currentWord.example.trim().split(/\s+/);
      
      const chips = rawWords.map((word, idx) => ({
        id: `chip-${idx}`,
        text: word,
      }));
      
      setBankChips(shuffleArray(chips));
      setConstructedChips([]);
      setIsCorrect(null);
    }
  }, [currentIndex, currentWord]);

  const handleBankChipClick = (chip: WordChip) => {
    if (isCorrect !== null) return;
    setBankChips(prev => prev.filter(c => c.id !== chip.id));
    setConstructedChips(prev => [...prev, chip]);
  };

  const handleConstructedChipClick = (chip: WordChip) => {
    if (isCorrect !== null) return;
    setConstructedChips(prev => prev.filter(c => c.id !== chip.id));
    setBankChips(prev => [...prev, chip]);
  };

  // Auto-check when all chips are used
  useEffect(() => {
    if (currentWord && bankChips.length === 0 && constructedChips.length > 0) {
      const target = currentWord.example.trim();
      const attempt = constructedChips.map(c => c.text).join(" ");
      
      if (attempt === target) {
        setIsCorrect(true);
      } else {
        setIsCorrect(false);
      }
    }
  }, [bankChips, constructedChips, currentWord]);

  const nextSentence = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const resetSentence = () => {
    const allChips = [...bankChips, ...constructedChips];
    setBankChips(shuffleArray(allChips));
    setConstructedChips([]);
    setIsCorrect(null);
  };

  if (isLoading) {
    return (
      <div className="py-6 max-w-3xl mx-auto px-4 flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (sentences.length === 0) {
    return (
      <div className="py-6 max-w-3xl mx-auto px-4 text-center">
        <Link href="/dashboard/practice" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-8">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Practice Hub
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sentence Builder</h1>
        <p className="text-gray-500 dark:text-gray-400">You need to add words with example sentences to play this mode.</p>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-3xl mx-auto px-4">
      <Link href="/dashboard/practice" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Practice Hub
      </Link>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sentence Builder</h1>
        <p className="text-gray-600 dark:text-gray-400">Construct the sentence for the target word.</p>
        <div className="mt-4 inline-block bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-4 py-2 rounded-full font-bold text-xl tracking-wide">
          {currentWord.word}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {/* Drop Zone */}
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 min-h-[160px] bg-gray-50 dark:bg-gray-900/50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Your Sentence</p>
          <div className="flex flex-wrap gap-2">
            {constructedChips.map(chip => (
              <button
                key={chip.id}
                onClick={() => handleConstructedChipClick(chip)}
                className={`px-4 py-2 bg-white dark:bg-gray-800 border-2 rounded-xl text-lg font-medium shadow-sm transition-all hover:-translate-y-1 ${isCorrect === true ? 'border-green-500 text-green-700 dark:text-green-400' : isCorrect === false ? 'border-red-500 text-red-700 dark:text-red-400 animate-shake' : 'border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'}`}
              >
                {chip.text}
              </button>
            ))}
            {constructedChips.length === 0 && (
              <div className="w-full text-center py-6 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                Tap words below to build the sentence
              </div>
            )}
          </div>
        </div>

        {/* Word Bank */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Word Bank</p>
            <button 
              onClick={resetSentence}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {bankChips.map(chip => (
              <button
                key={chip.id}
                onClick={() => handleBankChipClick(chip)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-lg font-medium hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:text-orange-700 dark:hover:text-orange-300 transition-colors shadow-sm"
              >
                {chip.text}
              </button>
            ))}
          </div>
        </div>
        
        {/* Result Area */}
        <div className={`p-6 flex flex-col items-center transition-all ${isCorrect === true ? 'bg-green-50 dark:bg-green-900/20' : isCorrect === false ? 'bg-red-50 dark:bg-red-900/20' : 'hidden'}`}>
          {isCorrect === true && (
            <>
              <div className="flex items-center text-green-600 dark:text-green-400 font-bold mb-4">
                <CheckCircle className="w-5 h-5 mr-2" />
                Perfect!
              </div>
              <button 
                onClick={nextSentence}
                className="px-8 py-3 bg-green-500 text-white rounded-xl font-bold shadow-md hover:bg-green-600 transition-colors w-full sm:w-auto"
              >
                Next Sentence
              </button>
            </>
          )}
          {isCorrect === false && (
            <div className="flex items-center text-red-600 dark:text-red-400 font-bold">
              <XCircle className="w-5 h-5 mr-2" />
              Not quite right. Try again!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
