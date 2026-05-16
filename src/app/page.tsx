"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { Play, Lock } from "lucide-react";
import { useUser } from "@/hooks/useUser";

const RobotIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const GlobeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
);

export default function Home() {
  const router = useRouter();
  const { lang, openAuthModal } = useAppStore();
  const { user } = useUser();
  const t = translations[lang].landing;
  
  const [mode, setMode] = useState("ai");
  const [timer, setTimer] = useState("5 мин");
  const [difficulty, setDifficulty] = useState("Легко");

  const difficultyColors: Record<string, string> = {
    "Легко": "bg-green-100 text-green-800 border-green-200",
    "Средне": "bg-amber-100 text-amber-800 border-amber-200",
    "Сложно": "bg-red-100 text-red-800 border-red-200",
  };

  const getDifficultyLabel = () => {
    if (difficulty === "Легко") return t.easyAi;
    if (difficulty === "Средне") return t.mediumAi;
    return t.hardAi;
  };

  const handleModeSelect = (newMode: string) => {
    if (newMode === "ai" || user) {
      setMode(newMode);
    } else {
      openAuthModal();
    }
  };

  return (
    <>
      <TopBar titleKey="chooseMode" />
      
      <motion.main 
        className="flex-1 overflow-y-auto p-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="max-w-[800px] mx-auto space-y-10">
          
          {/* Section 1 - Mode selector */}
          <section>
            <div className="grid grid-cols-3 gap-4">
              
              {/* Card 1 - AI */}
              <button 
                className={`relative p-6 bg-white rounded-[10px] text-left min-h-[160px] flex flex-col hover:-translate-y-[2px] transition-all duration-200 ${
                  mode === "ai" ? "border-[1.5px] border-[#6366F1] bg-indigo-50/10" : "border border-[#EBEBEA] hover:border-gray-300"
                }`}
                onClick={() => handleModeSelect("ai")}
              >
                <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full">
                  {t.free}
                </div>
                <div className={`w-14 h-14 rounded-[8px] flex items-center justify-center mb-4 ${mode === "ai" ? "bg-[#6366F1] text-white" : "bg-indigo-50 text-[#6366F1]"}`}>
                  <RobotIcon />
                </div>
                <h3 className="text-[16px] font-semibold mb-1 mt-auto">{t.vsAi}</h3>
                <p className="text-[14px] text-gray-500 leading-snug">
                  {t.vsAiDesc}
                </p>
              </button>

              {/* Card 2 - With Friend */}
              <button 
                className={`relative p-6 bg-white rounded-[10px] text-left min-h-[160px] flex flex-col hover:-translate-y-[2px] transition-all duration-200 ${
                  mode === "friend" ? "border-[1.5px] border-[#6366F1] bg-indigo-50/10" : "border border-[#EBEBEA] hover:border-gray-300"
                } ${!user ? "opacity-60" : ""}`}
                onClick={() => handleModeSelect("friend")}
              >
                {!user && (
                  <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={12} /> {translations[lang].sidebar.login}
                  </div>
                )}
                <div className={`w-14 h-14 rounded-[8px] flex items-center justify-center mb-4 ${mode === "friend" ? "bg-[#6366F1] text-white" : "bg-gray-100 text-gray-500"}`}>
                  <UsersIcon />
                </div>
                <h3 className={`text-[16px] font-semibold mb-1 mt-auto ${!user ? "text-gray-600" : ""}`}>{t.withFriend}</h3>
                <p className={`text-[14px] leading-snug ${!user ? "text-gray-400" : "text-gray-500"}`}>
                  {t.withFriendDesc}
                </p>
              </button>

              {/* Card 3 - Multiplayer */}
              <button 
                className={`relative p-6 bg-white rounded-[10px] text-left min-h-[160px] flex flex-col hover:-translate-y-[2px] transition-all duration-200 ${
                  mode === "multiplayer" ? "border-[1.5px] border-[#6366F1] bg-indigo-50/10" : "border border-[#EBEBEA] hover:border-gray-300"
                } ${!user ? "opacity-60" : ""}`}
                onClick={() => handleModeSelect("multiplayer")}
              >
                {!user && (
                  <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={12} /> {translations[lang].sidebar.login}
                  </div>
                )}
                <div className={`w-14 h-14 rounded-[8px] flex items-center justify-center mb-4 ${mode === "multiplayer" ? "bg-[#6366F1] text-white" : "bg-gray-100 text-gray-500"}`}>
                  <GlobeIcon />
                </div>
                <h3 className={`text-[16px] font-semibold mb-1 mt-auto ${!user ? "text-gray-600" : ""}`}>{t.multiplayer}</h3>
                <p className={`text-[14px] leading-snug ${!user ? "text-gray-400" : "text-gray-500"}`}>
                  {t.multiplayerDesc}
                </p>
              </button>

            </div>
          </section>

          {/* Section 2 - Game settings */}
          <section className="grid grid-cols-2 gap-8">
            
            {/* Block 1 - Timer */}
            <div>
              <h2 className="text-[13px] uppercase tracking-wider text-gray-400 font-semibold mb-3">
                {t.timer}
              </h2>
              <div className="flex flex-wrap gap-2">
                {["3", "5", "10", "∞"].map((tValue) => (
                  <button
                    key={tValue}
                    onClick={() => setTimer(tValue === "∞" ? tValue : `${tValue} ${t.min}`)}
                    className={`h-[40px] px-5 rounded-[8px] text-[14px] font-semibold active:scale-95 transition-all duration-100 border ${
                      timer === (tValue === "∞" ? tValue : `${tValue} ${t.min}`) 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-gray-700 border-[#EBEBEA] hover:bg-gray-50"
                    }`}
                  >
                    {tValue === "∞" ? tValue : `${tValue} ${t.min}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Block 2 - Difficulty */}
            <div className={mode !== "ai" ? "opacity-40 pointer-events-none" : ""}>
              <h2 className="text-[13px] uppercase tracking-wider text-gray-400 font-semibold mb-3">
                {t.difficulty}
              </h2>
              <div className="flex flex-wrap gap-2">
                {["Легко", "Средне", "Сложно"].map((d) => {
                  const isSelected = difficulty === d;
                  const label = d === "Легко" ? t.easy : d === "Средне" ? t.medium : t.hard;
                  return (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`h-[40px] px-5 rounded-[8px] text-[14px] font-semibold active:scale-95 transition-all duration-100 border ${
                        isSelected 
                          ? difficultyColors[d]
                          : "bg-white text-gray-700 border-[#EBEBEA] hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

          </section>

          {/* Section 3 - Play CTA */}
          <section>
            <div className="bg-black text-white rounded-[12px] p-[20px_28px] flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold mb-0.5">{t.startGame}</h2>
                <div className="text-[14px] text-gray-400">
                  {timer} · {mode === "ai" ? getDifficultyLabel() : (mode === "friend" ? t.withFriend : t.multiplayer)} · {t.russianCheckers}
                </div>
              </div>
              <button 
                onClick={() => {
                  if (mode === "ai") {
                    router.push(`/game?difficulty=${encodeURIComponent(difficulty)}`);
                  } else {
                    // Logic for other modes
                    alert("Этот режим скоро будет доступен!");
                  }
                }}
                className="bg-white text-black px-6 py-2.5 rounded-[8px] text-[14px] font-semibold flex items-center gap-2 hover:brightness-110 hover:scale-[1.02] transition-all duration-150"
              >
                <Play size={18} fill="currentColor" />
                {t.play}
              </button>
            </div>
          </section>

        </div>
      </motion.main>
    </>
  );
}
