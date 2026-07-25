"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Word } from "@/lib/firebase/firestore";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleExport = async () => {
    if (!user) return;
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const wordsRef = collection(db, "users", user.uid, "words");
      const snapshot = await getDocs(wordsRef);
      const wordsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to dates for JSON
        return {
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          srs: {
            ...data.srs,
            nextReview: data.srs?.nextReview?.toDate?.() || new Date()
          }
        };
      });

      const dataStr = JSON.stringify(wordsData, null, 2);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `vocabmaster_backup_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
      
      setMessage({ text: "Export successful!", type: "success" });
    } catch (error) {
      console.error(error);
      setMessage({ text: "Export failed.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    setMessage({ text: "", type: "" });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          let count = 0;
          for (const item of json) {
            if (item.word && item.meaning) {
              const newWordRef = doc(collection(db, "users", user.uid, "words"));
              await setDoc(newWordRef, {
                ...item,
                // Assuming timestamps need to be reconstructed or handled by Firebase on upload
                createdAt: new Date(),
              });
              count++;
            }
          }
          setMessage({ text: `Successfully imported ${count} words!`, type: "success" });
        } else {
          setMessage({ text: "Invalid backup file format.", type: "error" });
        }
      } catch (error) {
        console.error(error);
        setMessage({ text: "Import failed. Invalid JSON.", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="py-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Account Section */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Account</h2>
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-lg">{user?.displayName || "Scholar"}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="px-6 py-2 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Data Backup Section */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Data Backup</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Export your vocabulary to a JSON file or import a previous backup.</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleExport}
              disabled={loading}
              className="px-6 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex-1"
            >
              Export JSON Backup
            </button>
            
            <div className="relative flex-1">
              <input 
                type="file" 
                accept=".json"
                onChange={handleImport}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default" 
              />
              <button 
                disabled={loading}
                className="w-full px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Import JSON Backup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
