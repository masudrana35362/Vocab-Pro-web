import { Word } from "@/types";

export interface ChartData {
  day: string;
  count: number;
}

export const getLast7DaysData = (allWords: Word[]): ChartData[] => {
  const data: ChartData[] = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    
    const startOfDay = new Date(d);
    startOfDay.setHours(0, 0, 0, 0);
    
    const count = allWords.filter(w => {
      if (!w.createdAt) return false;
      // Handle Firestore Timestamp or Date object
      const createdAtDate = typeof (w.createdAt as any).toDate === 'function' 
        ? (w.createdAt as any).toDate() 
        : new Date(w.createdAt as any);
        
      return createdAtDate >= startOfDay && createdAtDate <= d;
    }).length;

    data.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      count
    });
  }
  return data;
};
