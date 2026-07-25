"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAllWords, Word } from "@/lib/firebase/firestore";
import { updateWordProgress } from "@/lib/firebase/srs";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FlashcardsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [deck, setDeck] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchDeck = async () => {
      try {
        const words = await getAllWords(user.uid);
        // Shuffle the deck for practice
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        setDeck(shuffled);
      } catch (err) {
        console.error("Failed to load flashcards", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDeck();
  }, [user]);

  const handleGrade = async (quality: number) => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    
    const currentWord = deck[currentIndex];
    
    try {
      await updateWordProgress(user.uid, currentWord.id!, currentWord.srs, quality);
      
      // Move to next card
      if (currentIndex + 1 < deck.length) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        setIsFinished(true);
      }
    } catch (err) {
      console.error("Failed to update word progress", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (url: string | undefined) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(e => console.error("Error playing audio", e));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400 animate-pulse">Assembling your deck...</p>
      </div>
    );
  }

  if (isFinished || deck.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-32 h-32 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">All Caught Up!</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
          {deck.length === 0 
            ? "You don't have any words due for review right now. Add some new words or check back later." 
            : "Awesome work! You've reviewed all your due flashcards for this session."}
        </p>
        <div className="flex gap-4">
          <Link 
            href="/dashboard"
            className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all"
          >
            Back to Dashboard
          </Link>
          {deck.length === 0 && (
            <Link 
              href="/dashboard/add"
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all"
            >
              Add New Words
            </Link>
          )}
        </div>
      </div>
    );
  }

  const word = deck[currentIndex];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto min-h-[85vh] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.push("/dashboard")}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
          {currentIndex + 1} / {deck.length}
        </div>
        
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-10 overflow-hidden">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${((currentIndex) / deck.length) * 100}%` }}
        ></div>
      </div>

      {/* Flashcard Area */}
      <div className="flex-1 flex flex-col justify-center">
        <div 
          className="bg-white dark:bg-gray-800 shadow-xl dark:shadow-2xl rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col min-h-[400px] w-full"
        >
          {/* Card Front */}
          <div className="p-10 flex-1 flex flex-col items-center justify-center text-center relative border-b border-gray-100 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80">
            <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white capitalize mb-4 tracking-tight">
              {word.word}
            </h2>
            
            {word.audio_url && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(word.audio_url);
                }}
                className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-primary rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
              </button>
            )}
          </div>

          {/* Card Back / Action Area */}
          <div className="p-8 flex-1 bg-white dark:bg-gray-800">
            {!isFlipped ? (
              <div 
                className="h-full flex items-center justify-center cursor-pointer group"
                onClick={() => setIsFlipped(true)}
              >
                <p className="text-gray-400 dark:text-gray-500 font-medium tracking-widest uppercase group-hover:text-primary transition-colors flex items-center gap-2">
                  Tap to Reveal <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Meaning</h4>
                    <p className="text-xl text-gray-800 dark:text-gray-200">{word.meaning}</p>
                  </div>
                  
                  {word.banglaMeaning && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bangla</h4>
                      <p className="text-2xl font-bold text-[#0F766E] dark:text-teal-400 font-bangla">{word.banglaMeaning}</p>
                    </div>
                  )}
                  
                  {word.example && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Example</h4>
                      <p className="text-gray-600 dark:text-gray-400 italic">"{word.example}"</p>
                    </div>
                  )}

                  {word.synonyms && word.synonyms.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {word.synonyms.map(syn => (
                        <span key={syn} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-xs font-medium">
                          {syn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grading Controls */}
      <div className="mt-8 h-24">
        {isFlipped && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-300">
            <button
              disabled={isProcessing}
              onClick={() => handleGrade(1)} // 1 maps to Incorrect/Forgot
              className="flex flex-col items-center justify-center py-4 px-6 rounded-2xl border-2 border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-200 dark:hover:border-red-900/50 transition-all disabled:opacity-50"
            >
              <span className="text-sm font-bold uppercase tracking-widest mb-1">Forgot</span>
              <span className="text-xs text-red-400 dark:text-red-500/70 opacity-80">Needs more practice</span>
            </button>
            <button
              disabled={isProcessing}
              onClick={() => handleGrade(4)} // 4 maps to Correct/Got it
              className="flex flex-col items-center justify-center py-4 px-6 rounded-2xl border-2 border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-200 dark:hover:border-green-900/50 transition-all disabled:opacity-50"
            >
              <span className="text-sm font-bold uppercase tracking-widest mb-1">Got it</span>
              <span className="text-xs text-green-400 dark:text-green-500/70 opacity-80">I remember this</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
