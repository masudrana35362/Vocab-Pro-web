"use client";

import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useAllWords, useDueWords } from "@/hooks/useWords";
import { getLast7DaysData } from "@/lib/utils/chartData";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Use React Query hooks
  const { 
    data: profile, 
    isLoading: isProfileLoading,
    error: profileError
  } = useProfile(user?.uid);
  
  const { 
    data: allWords = [], 
    isLoading: isWordsLoading,
    error: wordsError
  } = useAllWords(user?.uid);
  
  const {
    data: dueWords = [],
    isLoading: isDueWordsLoading
  } = useDueWords(user?.uid);

  const isLoading = isProfileLoading || isWordsLoading || isDueWordsLoading;
  const isError = profileError || wordsError;

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load dashboard data. Please try again.");
    }
  }, [isError]);

  const chartData = getLast7DaysData(allWords);
  const maxCount = Math.max(...chartData.map(d => d.count), 5); // Minimum height scale of 5

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Welcome back, {profile?.displayName || "Scholar"}!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Quick Stats Cards */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl p-3">
              <span className="text-2xl">🔥</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Current Streak
                </dt>
                <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.streakCount || 0} Days
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 rounded-xl p-3">
              <span className="text-2xl">📚</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total Words
                </dt>
                <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.totalWords || allWords.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-primary overflow-hidden shadow-sm rounded-2xl border border-transparent p-6 text-white relative">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-1">Ready for Review</h3>
            <p className="text-3xl font-bold mb-4">{dueWords.length} <span className="text-sm font-normal opacity-80">words</span></p>
            <Link 
              href="/dashboard/practice/flashcards"
              className="inline-block bg-white text-primary px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-gray-50 transition-colors"
            >
              Start Flashcards
            </Link>
          </div>
          {/* Abstract decoration */}
          <div className="absolute right-0 bottom-0 opacity-10">
             <span className="text-9xl">🧠</span>
          </div>
        </div>
      </div>

      {/* Activity Graph or Empty State */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Words Added (Last 7 Days)</h2>
        
        {allWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
            <BookOpen className="w-12 h-12 mb-3 opacity-20" />
            <p className="mb-4">Your library is empty. Let's start learning!</p>
            <Link 
              href="/dashboard/add"
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Add Your First Word
            </Link>
          </div>
        ) : (
          <div className="flex items-end justify-between h-48 pt-4">
            {chartData.map((data, index) => {
              // Calculate height percentage
              const heightPct = data.count > 0 ? Math.max((data.count / maxCount) * 100, 10) : 0;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="w-full flex justify-center group relative h-36">
                    {/* Tooltip */}
                    {data.count > 0 && (
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none z-10">
                        {data.count} words
                      </div>
                    )}
                    
                    {/* Bar */}
                    <div 
                      className="w-10 bg-primary/20 dark:bg-primary/40 rounded-t-lg relative overflow-hidden mt-auto"
                      style={{ height: '100%' }} // Full height of container for background
                    >
                      <div 
                        className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all duration-700 ease-out"
                        style={{ height: `${heightPct}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* X-Axis Label */}
                  <span className="text-xs font-medium text-gray-500 mt-3">{data.day}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
