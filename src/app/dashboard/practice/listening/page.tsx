"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAllWords } from "@/hooks/useWords";
import Link from "next/link";
import { ArrowLeft, Play, CheckCircle, XCircle, Volume2 } from "lucide-react";

export default function ListeningComprehensionPage() {
  const { user } = useAuth();
  const { data: allWords = [], isLoading } = useAllWords(user?.uid);
  
  const sentences = useMemo(() => {
    return allWords.filter(w => w.example && w.example.trim().length > 0 && w.example !== "Fetching example...");
  }, [allWords]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentWord = sentences[currentIndex];

  const playAudio = () => {
    if (!currentWord || !window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(currentWord.example);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // slightly slower for comprehension
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      inputRef.current?.focus();
    };
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  // Play audio when moving to a new sentence
  useEffect(() => {
    if (currentWord) {
      setIsCorrect(null);
      setUserInput("");
      const timer = setTimeout(() => {
        playAudio();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentWord]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const normalizeText = (text: string) => {
    return text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ").trim();
  };

  const checkAnswer = () => {
    if (!currentWord) return;
    
    const target = normalizeText(currentWord.example);
    const attempt = normalizeText(userInput);
    
    if (attempt === target) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
  };

  const nextSentence = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop or finish
      setCurrentIndex(0);
    }
  };

  if (isLoading) {
    return (
      <div className="py-6 max-w-3xl mx-auto px-4 flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Listening Comprehension</h1>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Listening Comprehension</h1>
        <p className="text-gray-600 dark:text-gray-400">Listen to the sentence and transcribe it.</p>
        <p className="text-sm font-medium text-indigo-500 mt-2">
          Sentence {currentIndex + 1} of {sentences.length}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-10">
        
        {/* Audio Player */}
        <div className="flex flex-col items-center mb-10">
          <button
            onClick={playAudio}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500 scale-105' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 hover:scale-105'}`}
          >
            {isPlaying ? (
              <Volume2 className="w-10 h-10 animate-pulse" />
            ) : (
              <Play className="w-10 h-10 ml-2" />
            )}
          </button>
          <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
            {isPlaying ? "Speaking..." : "Tap to Listen"}
          </p>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isCorrect === true}
            placeholder="Type what you hear..."
            className={`w-full p-4 text-lg border-2 rounded-xl resize-none transition-colors outline-none bg-transparent ${isCorrect === true ? 'border-green-500 text-green-700 dark:text-green-400' : isCorrect === false ? 'border-red-500 focus:border-red-600' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:text-white'}`}
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                checkAnswer();
              }
            }}
          />

          {isCorrect === true && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center text-green-600 dark:text-green-400 font-bold mb-2">
                <CheckCircle className="w-5 h-5 mr-2" />
                Perfect!
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic mb-6">"{currentWord.example}"</p>
              <button 
                onClick={nextSentence}
                className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold shadow-md hover:bg-indigo-600 transition-colors"
              >
                Next Sentence
              </button>
            </div>
          )}

          {isCorrect === false && (
            <div className="flex items-center justify-between animate-in fade-in">
              <div className="flex items-center text-red-600 dark:text-red-400 font-bold">
                <XCircle className="w-5 h-5 mr-2" />
                Not quite right. Try again!
              </div>
              <button
                onClick={() => setIsCorrect(null)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear
              </button>
            </div>
          )}

          {isCorrect === null && (
            <button
              onClick={checkAnswer}
              disabled={userInput.trim().length === 0}
              className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Check Answer
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
