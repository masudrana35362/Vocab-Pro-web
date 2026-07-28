import { useQuery } from "@tanstack/react-query";
import { getAllWords, getDueWords } from "@/lib/firebase/firestore";
import { Word } from "@/types";

export const useAllWords = (uid: string | undefined) => {
  return useQuery<Word[], Error>({
    queryKey: ["words", "all", uid],
    queryFn: async () => {
      if (!uid) return [];
      return await getAllWords(uid);
    },
    enabled: !!uid,
  });
};

export const useDueWords = (uid: string | undefined) => {
  return useQuery<Word[], Error>({
    queryKey: ["words", "due", uid],
    queryFn: async () => {
      if (!uid) return [];
      return await getDueWords(uid);
    },
    enabled: !!uid,
  });
};
