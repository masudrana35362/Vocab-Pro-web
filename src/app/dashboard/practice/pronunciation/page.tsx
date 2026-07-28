"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDueWords } from "@/hooks/useWords";
import Link from "next/link";
import { ArrowLeft, Mic, CheckCircle, XCircle, Volume2 } from "lucide-react";

// Add TypeScript types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function PronunciationCoachPage() {
  const { user } = useAuth();
  const { data: dueWords = [], isLoading } = useDueWords(user?.uid);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const recognitionRef = useRef<any>(null);

  const currentWord = dueWords[currentIndex];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript("");
          setIsCorrect(null);
        };

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcriptResult = event.results[current][0].transcript;
          setTranscript(transcriptResult);
          checkPronunciation(transcriptResult);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          // If no speech is detected, we can let the user try again
          if (event.error !== 'no-speech') {
            setTranscript("Error: " + event.error);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setIsSupported(false);
      }
    }
  }, [currentWord]); // Re-bind if needed, though mostly static

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Recognition already started", e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const playReferenceAudio = () => {
    if (!currentWord) return;
    if (currentWord.audio_url) {
      new Audio(currentWord.audio_url).play().catch(e => console.error(e));
    } else if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const normalizeWord = (w: string) => w.toLowerCase().replace(/[^a-z]/g, "");

  const checkPronunciation = (heard: string) => {
    if (!currentWord) return;
    
    // Very basic comparison. In reality, phonetics or fuzzy matching is better.
    const target = normalizeWord(currentWord.word);
    const spoken = normalizeWord(heard);
    
    // Check if the target word is within the spoken phrase (sometimes speech API adds small words)
    if (spoken.includes(target)) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
  };

  const nextWord = () => {
    if (currentIndex < dueWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTranscript("");
      setIsCorrect(null);
    } else {
      setCurrentIndex(0);
      setTranscript("");
      setIsCorrect(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-6 max-w-3xl mx-auto px-4 flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (dueWords.length === 0) {
    return (
      <div className="py-6 max-w-3xl mx-auto px-4 text-center">
        <Link href="/dashboard/practice" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-8">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Practice Hub
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Pronunciation Coach</h1>
        <p className="text-gray-500 dark:text-gray-400">No words due for review. Add more words to practice!</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="py-6 max-w-3xl mx-auto px-4 text-center">
        <Link href="/dashboard/practice" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-8">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Practice Hub
        </Link>
        <div className="bg-red-50 dark:bg-red-900/30 p-8 rounded-3xl border border-red-100 dark:border-red-800">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Browser Not Supported</h1>
          <p className="text-red-500 dark:text-red-300">
            Your browser does not support the Web Speech API required for pronunciation practice. 
            Please try using Google Chrome, Microsoft Edge, or Safari.
          </p>
        </div>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Pronunciation Coach</h1>
        <p className="text-gray-600 dark:text-gray-400">Speak the word clearly into your microphone.</p>
        <p className="text-sm font-medium text-pink-500 mt-2">
          Word {currentIndex + 1} of {dueWords.length}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 sm:p-12 flex flex-col items-center">
        
        <div className="flex items-center justify-center gap-4 mb-12 w-full">
          <h2 className="text-5xl font-extrabold text-gray-900 dark:text-white capitalize tracking-tight">
            {currentWord.word}
          </h2>
          <button 
            onClick={playReferenceAudio}
            className="p-2 text-gray-400 hover:text-pink-500 transition-colors"
            title="Listen to reference"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        {/* Microphone Button */}
        <div className="relative mb-8">
          {isListening && (
            <div className="absolute inset-0 bg-pink-400 rounded-full animate-ping opacity-75"></div>
          )}
          <button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-pink-600 shadow-xl shadow-pink-500/50 scale-95' : 'bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-500/30 hover:scale-105'}`}
          >
            <Mic className="w-12 h-12 text-white" />
          </button>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-10">
          {isListening ? "Listening... Release to check." : "Hold the button and speak"}
        </p>

        {/* Results Area */}
        <div className="w-full min-h-[100px] flex flex-col items-center justify-center">
          {transcript && (
            <div className="text-center mb-6">
              <p className="text-sm text-gray-400 uppercase tracking-wider font-bold mb-2">You said:</p>
              <p className="text-2xl text-gray-800 dark:text-gray-200 font-medium">"{transcript}"</p>
            </div>
          )}
          
          {isCorrect === true && (
             <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
               <div className="flex items-center text-green-600 dark:text-green-400 font-bold mb-6 text-xl">
                 <CheckCircle className="w-6 h-6 mr-2" />
                 Great job!
               </div>
               <button 
                 onClick={nextWord}
                 className="px-8 py-3 bg-green-500 text-white rounded-xl font-bold shadow-md hover:bg-green-600 transition-colors"
               >
                 Next Word
               </button>
             </div>
          )}
          
          {isCorrect === false && (
            <div className="flex items-center text-red-600 dark:text-red-400 font-bold text-lg animate-in fade-in slide-in-from-bottom-2">
              <XCircle className="w-6 h-6 mr-2" />
              Not quite. Try again!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
