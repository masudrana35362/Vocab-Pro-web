import Link from "next/link";

export default function PracticeHubPage() {
  const modes = [
    {
      id: "flashcards",
      title: "SRS Flashcards",
      description: "Minimalist, gesture-based review using the SM-2 algorithm.",
      icon: "🗂️",
      href: "/dashboard/practice/flashcards",
      color: "bg-blue-500",
    },
    {
      id: "quiz",
      title: "Multiple Choice Quiz",
      description: "Test your memory with dynamic options from your library.",
      icon: "📝",
      href: "/dashboard/practice/quiz",
      color: "bg-purple-500",
    },
    {
      id: "spelling",
      title: "Spelling Bee",
      description: "Listen to the word and type it correctly.",
      icon: "🐝",
      href: "/dashboard/practice/spelling",
      color: "bg-amber-500",
    },
    {
      id: "fill-in-blanks",
      title: "Fill in the Blanks",
      description: "Understand contextual usage in sentences.",
      icon: "✍️",
      href: "/dashboard/practice/fill-in-blanks",
      color: "bg-teal-500",
    },
    {
      id: "pomodoro",
      title: "Focus Session",
      description: "25-minute deep learning with Pomodoro timer.",
      icon: "⏱️",
      href: "/dashboard/practice/pomodoro",
      color: "bg-red-500",
    },
    {
      id: "pronunciation",
      title: "Pronunciation Coach",
      description: "Speak and receive instant feedback.",
      icon: "🎙️",
      href: "/dashboard/practice/pronunciation",
      color: "bg-pink-500",
    },
    {
      id: "sentence",
      title: "Sentence Builder",
      description: "Drag and drop words to form sentences.",
      icon: "🧩",
      href: "/dashboard/practice/sentence",
      color: "bg-orange-500",
    },
    {
      id: "listening",
      title: "Listening Comprehension",
      description: "Listen to sentences and transcribe them.",
      icon: "🎧",
      href: "/dashboard/practice/listening",
      color: "bg-indigo-500",
    }
  ];

  return (
    <div className="py-6 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
          Practice Hub
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choose a mode to strengthen your memory. Words due for review will automatically be prioritized.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {modes.map((mode) => (
          <Link 
            key={mode.id} 
            href={mode.href}
            className="group relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${mode.color} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
            
            <div className="text-5xl mb-6">{mode.icon}</div>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {mode.title}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400">
              {mode.description}
            </p>
            
            <div className="mt-8 flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform">
              Start Session 
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
