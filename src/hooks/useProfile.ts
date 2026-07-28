import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/lib/firebase/firestore";
import { UserProfile } from "@/types";

export const useProfile = (uid: string | undefined) => {
  return useQuery<UserProfile | null, Error>({
    queryKey: ["profile", uid],
    queryFn: async () => {
      if (!uid) return null;
      return await getUserProfile(uid);
    },
    enabled: !!uid, // Only fetch when uid is available
  });
};
