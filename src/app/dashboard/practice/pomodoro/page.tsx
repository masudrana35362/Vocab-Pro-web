"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, ArrowLeft, Coffee, Brain } from "lucide-react";

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

export default function PomodoroPage() {
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? BREAK_TIME : FOCUS_TIME);
  };

  const switchMode = (breakMode: boolean) => {
    setIsActive(false);
    setIsBreak(breakMode);
    setTimeLeft(breakMode ? BREAK_TIME : FOCUS_TIME);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer finished
      if (!isBreak) {
        setSessionsCompleted(s => s + 1);
      }
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.play().catch(e => console.error("Audio error", e));
      switchMode(!isBreak);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  // Calculate SVG Circle progress
  const totalTime = isBreak ? BREAK_TIME : FOCUS_TIME;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="py-6 max-w-2xl mx-auto px-4">
      <Link href="/dashboard/practice" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Practice Hub
      </Link>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Focus Session</h1>
        <p className="text-gray-600 dark:text-gray-400">Use the Pomodoro technique for deep learning.</p>
        {sessionsCompleted > 0 && (
          <p className="mt-4 text-sm font-medium text-primary">
            🔥 {sessionsCompleted} {sessionsCompleted === 1 ? "session" : "sessions"} completed today
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 sm:p-12 flex flex-col items-center">
        
        {/* Mode Toggles */}
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-full mb-12">
          <button
            onClick={() => switchMode(false)}
            className={`flex items-center px-6 py-2 rounded-full text-sm font-medium transition-all ${!isBreak ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}
          >
            <Brain className="w-4 h-4 mr-2" />
            Focus
          </button>
          <button
            onClick={() => switchMode(true)}
            className={`flex items-center px-6 py-2 rounded-full text-sm font-medium transition-all ${isBreak ? 'bg-white dark:bg-gray-800 text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}
          >
            <Coffee className="w-4 h-4 mr-2" />
            Break
          </button>
        </div>

        {/* Timer Circle */}
        <div className="relative flex items-center justify-center w-72 h-72 mb-12">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="144"
              cy="144"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-gray-100 dark:text-gray-700"
            />
            {/* Progress Circle */}
            <circle
              cx="144"
              cy="144"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-linear ${isBreak ? 'text-teal-500' : 'text-primary'}`}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-bold tracking-tighter text-gray-900 dark:text-white font-mono">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-sm uppercase tracking-widest text-gray-500 font-medium mt-2">
              {isBreak ? 'Rest' : 'Focus'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={resetTimer}
            className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button
            onClick={toggleTimer}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 ${isBreak ? 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/30' : 'bg-primary hover:bg-indigo-600 shadow-primary/30'}`}
          >
            {isActive ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current translate-x-1" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
