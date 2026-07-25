"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getWord, deleteWord, Word } from "@/lib/firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function WordDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const { user } = useAuth();
  const router = useRouter();
  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchWord = async () => {
      try {
        const data = await getWord(user.uid, id);
        if (data) {
          setWord(data);
        } else {
          // Word not found, redirect to library
          router.push("/dashboard/library");
        }
      } catch (err) {
        console.error("Error fetching word:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWord();
  }, [user, id, router]);

  const handleDelete = async () => {
    if (!user || !word) return;
    
    if (window.confirm(`Are you sure you want to delete "${word.word}"? This cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await deleteWord(user.uid, word.id!);
        router.push("/dashboard/library");
      } catch (err) {
        console.error("Error deleting word:", err);
        alert("Failed to delete word.");
        setIsDeleting(false);
      }
    }
  };

  const playAudio = () => {
    if (word?.audio_url) {
      const audio = new Audio(word.audio_url);
      audio.play().catch(e => console.error("Error playing audio", e));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!word) return null; // Will redirect in useEffect

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header / Nav */}
      <div className="flex justify-between items-center mb-8">
        <Link href="/dashboard/library" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Library
        </Link>
        <div className="flex items-center gap-3">
          <Link 
            href={`/dashboard/edit/${word.id}`}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Edit Word
          </Link>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 border border-red-200 dark:border-red-900/50 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Top Hero Section */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white capitalize tracking-tight">
                {word.word}
              </h1>
              {word.audio_url && (
                <button 
                  onClick={playAudio}
                  className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full shadow-sm flex items-center justify-center text-primary hover:scale-110 transition-transform"
                  title="Play Pronunciation"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white dark:bg-gray-700 text-primary text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-indigo-100 dark:border-gray-600">
                Mastery Lvl {word.srs?.masteryLevel ?? 0}
              </div>
              {word.tags.map(tag => (
                <span key={tag} className="px-2 py-1 text-xs font-medium bg-gray-200/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left Column: Meanings */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">English Definition</h3>
                <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                  {word.meaning}
                </p>
              </div>

              {word.banglaMeaning && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bangla Meaning</h3>
                  <p className="text-2xl font-bold text-[#0F766E] dark:text-teal-400 font-bangla">
                    {word.banglaMeaning}
                  </p>
                </div>
              )}

              {word.example && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Example Sentence</h3>
                  <div className="bg-gray-50 dark:bg-gray-900/50 border-l-4 border-primary p-4 rounded-r-xl">
                    <p className="text-gray-700 dark:text-gray-300 italic text-[15px]">
                      "{word.example}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Extras & Stats */}
            <div className="space-y-8">
              {word.image_url && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Visual Cue</h3>
                  <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 h-48 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={word.image_url} alt={word.word} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {word.synonyms && word.synonyms.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Synonyms</h3>
                  <div className="flex flex-wrap gap-2">
                    {word.synonyms.map(syn => (
                      <span key={syn} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-100 dark:border-indigo-800">
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Stats */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Learning Stats</h3>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Added On</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {word.createdAt?.toDate() ? word.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Next Review</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {word.srs?.nextReview?.toDate() ? word.srs.nextReview.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Times Missed</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{word.srs?.timesMissed ?? 0}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
