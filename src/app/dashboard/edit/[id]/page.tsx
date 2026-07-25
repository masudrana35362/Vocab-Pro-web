"use client";

import { use, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchWordDefinition, fetchBanglaTranslation, fetchSynonyms } from "@/lib/dictionary";
import { updateWord, getWord, Word } from "@/lib/firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EditWordPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const { user } = useAuth();
  const router = useRouter();
  
  const [isInitializing, setIsInitializing] = useState(true);

  const [word, setWord] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("Noun");
  const [banglaMeaning, setBanglaMeaning] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [synonymInput, setSynonymInput] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchExistingData = async () => {
      try {
        const data = await getWord(user.uid, id);
        if (data) {
          setWord(data.word || "");
          
          if (data.tags && data.tags.length > 0) {
            const pos = data.tags[0].charAt(0).toUpperCase() + data.tags[0].slice(1);
            if (["Noun", "Verb", "Adjective", "Adverb"].includes(pos)) {
              setPartOfSpeech(pos);
            }
          }
          
          setBanglaMeaning(data.banglaMeaning || "");
          setMeaning(data.meaning || "");
          setExample(data.example || "");
          setSynonyms(data.synonyms || []);
        } else {
          router.push("/dashboard/library");
        }
      } catch (err) {
        console.error("Failed to load word:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    fetchExistingData();
  }, [user, id, router]);

  const handleMagicFill = async () => {
    if (!word.trim()) return;
    setIsMagicFilling(true);
    
    try {
      const data = await fetchWordDefinition(word.trim());
      if (data && data.meanings && data.meanings.length > 0) {
        const firstMeaning = data.meanings[0];
        const firstDef = firstMeaning.definitions[0];
        
        setMeaning(firstDef.definition || "");
        
        let foundExample = "";
        let collectedSynonyms: string[] = [];

        for (const m of data.meanings) {
          if (m.synonyms && m.synonyms.length > 0) {
            collectedSynonyms.push(...m.synonyms);
          }
          for (const d of m.definitions) {
            if (d.synonyms && d.synonyms.length > 0) {
              collectedSynonyms.push(...d.synonyms);
            }
            if (!foundExample && d.example) {
              foundExample = d.example;
            }
          }
        }

        if (foundExample) {
          setExample(foundExample);
        }
        
        const posStr = firstMeaning.partOfSpeech.charAt(0).toUpperCase() + firstMeaning.partOfSpeech.slice(1);
        if (["Noun", "Verb", "Adjective", "Adverb"].includes(posStr)) {
          setPartOfSpeech(posStr);
        }
      }

      const fetchedSynonyms = await fetchSynonyms(word.trim());
      if (fetchedSynonyms && fetchedSynonyms.length > 0) {
        setSynonyms(fetchedSynonyms);
      }

      const bangla = await fetchBanglaTranslation(word.trim());
      if (bangla) {
        setBanglaMeaning(bangla);
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsMagicFilling(false);
    }
  };

  const handleAiContext = async () => {
    if (!word.trim()) return;
    setIsAiGenerating(true);
    
    try {
      const data = await fetchWordDefinition(word.trim());
      if (data && data.meanings) {
        for (const m of data.meanings) {
          for (const d of m.definitions) {
            if (d.example) {
              setExample(d.example);
              setIsAiGenerating(false);
              return;
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const addSynonym = () => {
    const val = synonymInput.trim();
    if (val && !synonyms.includes(val)) {
      setSynonyms([...synonyms, val]);
    }
    setSynonymInput("");
  };

  const removeSynonym = (syn: string) => {
    setSynonyms(synonyms.filter(s => s !== syn));
  };

  const handleSynonymKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSynonym();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !word.trim() || !meaning.trim()) {
      setError("Word and English Meaning are required.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      await updateWord(user.uid, id, {
        word: word.trim(),
        meaning: meaning.trim(),
        banglaMeaning: banglaMeaning.trim(),
        example: example.trim(),
        tags: [partOfSpeech.toLowerCase()],
        synonyms: synonyms,
      });
      
      router.push(`/dashboard/library/${id}`);
    } catch (err: any) {
      setError(err.message || "Failed to update word.");
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <Link href={`/dashboard/library/${id}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-3 transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Details
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Word</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Word <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  required
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="e.g. Ephemeral"
                  className="flex-1 block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={handleMagicFill}
                  disabled={isMagicFilling || !word}
                  className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-primary border border-indigo-200 dark:border-indigo-800 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0"
                  title="Auto-fill definition and details"
                >
                  {isMagicFilling ? "✨ Looking up..." : "✨ Auto-Fill Details"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Part of Speech
              </label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-colors appearance-none"
              >
                <option value="Noun">Noun</option>
                <option value="Verb">Verb</option>
                <option value="Adjective">Adjective</option>
                <option value="Adverb">Adverb</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-700" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                English Definition <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                rows={3}
                placeholder="Enter the exact definition..."
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-colors resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bangla Meaning
              </label>
              <textarea
                value={banglaMeaning}
                onChange={(e) => setBanglaMeaning(e.target.value)}
                rows={3}
                placeholder="Enter the Bengali meaning..."
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-700" />

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Example Sentence
                </label>
                <button
                  type="button"
                  onClick={handleAiContext}
                  disabled={isAiGenerating || !word}
                  className="text-sm font-medium text-primary hover:text-indigo-700 transition-colors flex items-center disabled:opacity-50"
                >
                  {isAiGenerating ? "Fetching..." : "✨ Fetch Example"}
                </button>
              </div>
              <textarea
                value={example}
                onChange={(e) => setExample(e.target.value)}
                rows={2}
                placeholder="A sentence using the word..."
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Synonyms
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                {synonyms.map(syn => (
                  <span key={syn} className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                    {syn}
                    <button
                      type="button"
                      onClick={() => removeSynonym(syn)}
                      className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={synonymInput}
                  onChange={(e) => setSynonymInput(e.target.value)}
                  onKeyDown={handleSynonymKeyDown}
                  placeholder={synonyms.length === 0 ? "Type a synonym and press Enter..." : ""}
                  className="flex-1 min-w-[200px] outline-none bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
