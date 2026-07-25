"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Word } from "@/lib/firebase/firestore";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWords() {
      if (!user) return;
      const wordsRef = collection(db, "users", user.uid, "words");
      const q = query(wordsRef, orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);
      const wordsData = snapshot.docs.map(doc => doc.data() as Word);
      setWords(wordsData);
      setLoading(false);
    }
    fetchWords();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate mastery distribution
  const masteryCounts = [0, 0, 0, 0, 0, 0]; // Levels 0-5
  words.forEach(w => {
    const level = w.srs?.masteryLevel ?? 0;
    masteryCounts[level]++;
  });
  
  const totalWords = words.length || 1; // avoid division by zero

  return (
    <div className="py-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Progress & Analytics</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Deep insights into your vocabulary growth.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mastery Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Mastery Distribution</h2>
          
          <div className="space-y-4">
            {masteryCounts.map((count, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-gray-700 dark:text-gray-300">Level {index}</span>
                  <span className="text-gray-500">{count} words</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${index === 5 ? 'bg-green-500' : index >= 3 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                    style={{ width: `${(count / totalWords) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badge Gallery */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Badge Gallery</h2>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className={`p-4 rounded-2xl ${totalWords >= 10 ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-800' : 'bg-gray-50 dark:bg-gray-700 opacity-50 grayscale'}`}>
              <div className="text-4xl mb-2">🌱</div>
              <div className="text-xs font-bold text-gray-900 dark:text-white">Beginner</div>
              <div className="text-[10px] text-gray-500">10 Words</div>
            </div>
            
            <div className={`p-4 rounded-2xl ${totalWords >= 50 ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-800' : 'bg-gray-50 dark:bg-gray-700 opacity-50 grayscale'}`}>
              <div className="text-4xl mb-2">🌿</div>
              <div className="text-xs font-bold text-gray-900 dark:text-white">Explorer</div>
              <div className="text-[10px] text-gray-500">50 Words</div>
            </div>

            <div className={`p-4 rounded-2xl ${totalWords >= 250 ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-800' : 'bg-gray-50 dark:bg-gray-700 opacity-50 grayscale'}`}>
              <div className="text-4xl mb-2">🌳</div>
              <div className="text-xs font-bold text-gray-900 dark:text-white">Virtuoso</div>
              <div className="text-[10px] text-gray-500">250 Words</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
