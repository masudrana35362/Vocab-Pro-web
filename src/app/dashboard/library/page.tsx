"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Word } from "@/lib/firebase/firestore";
import Link from "next/link";

export default function LibraryPage() {
  const { user } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTag]);

  useEffect(() => {
    if (!user) return;

    const wordsRef = collection(db, "users", user.uid, "words");
    const q = query(wordsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wordsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Word[];
      
      setWords(wordsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching words:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Extract unique tags for filtering
  const allTags = ["All", ...Array.from(new Set(words.flatMap(w => w.tags)))];

  const filteredWords = words.filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          word.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === "All" || word.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const totalPages = Math.max(1, Math.ceil(filteredWords.length / itemsPerPage));
  const paginatedWords = filteredWords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vocabulary Library</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {words.length} words in your collection
          </p>
        </div>
        <Link 
          href="/dashboard/add"
          className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-primary hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          + Add New Word
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700 mb-8 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search words or meanings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
        <div className="md:w-64">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-colors appearance-none"
          >
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <span className="text-6xl mb-4 block">📭</span>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">No words found</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {searchQuery || selectedTag !== "All" 
              ? "Try adjusting your search or filters."
              : "Your library is empty. Start adding some words!"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedWords.map((word) => (
              <Link 
                href={`/dashboard/library/${word.id}`}
                key={word.id} 
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all p-4 flex flex-col gap-3 group"
              >
                
                <div className="flex-1 min-w-0">
                  {/* Top Row: Word, Level, Bangla */}
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize shrink-0">{word.word}</h3>
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
                      Lvl {word.srs?.masteryLevel ?? 0}
                    </div>
                    {word.banglaMeaning && (
                      <span className="text-[15px] font-bold text-[#0F766E] dark:text-teal-400 font-bangla truncate">
                        {word.banglaMeaning}
                      </span>
                    )}
                  </div>
                  
                  {/* Second Row: English Meaning */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {word.meaning}
                  </p>
                  
                  {/* Third Row: Tags & Synonyms */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {word.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {word.synonyms && word.synonyms.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Syn:</span>
                        {word.synonyms.map((syn, idx) => (
                          <span key={`${syn}-${idx}`} className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                            {syn}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
