// Helper for Free Dictionary API

export interface DictionaryEntry {
  word: string;
  phonetics: { text?: string; audio?: string }[];
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms?: string[];
    }[];
    synonyms: string[];
  }[];
}

export const fetchWordDefinition = async (word: string): Promise<DictionaryEntry | null> => {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data[0] as DictionaryEntry;
  } catch (error) {
    console.error("Error fetching dictionary API", error);
    return null;
  }
};

export const fetchBanglaTranslation = async (word: string): Promise<string | null> => {
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${word}&langpair=en|bn`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    return null;
  } catch (error) {
    console.error("Error fetching translation", error);
    return null;
  }
};

export const fetchSynonyms = async (word: string): Promise<string[]> => {
  try {
    const res = await fetch(`https://api.datamuse.com/words?rel_syn=${word}&max=5`);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((item: { word: string }) => item.word);
    }
    return [];
  } catch (error) {
    console.error("Error fetching synonyms from Datamuse", error);
    return [];
  }
};
