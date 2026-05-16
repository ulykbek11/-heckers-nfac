"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { showToast } from "@/components/ToastContainer";

const RobotIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const GlobeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
);

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

export default function Home() {
  const router = useRouter();
  
  const [mode, setMode] = useState("ai");
  const [timer, setTimer] = useState("5 мин");
  const [difficulty, setDifficulty] = useState("Легко");

  const handleLockedMode = () => {
    showToast("Войдите, чтобы играть в этот режим");
  };

  const difficultyColors: Record<string, string> = {
    "Легко": "bg-green-100 text-green-800 border-green-200",
    "Средне": "bg-amber-100 text-amber-800 border-amber-200",
    "Сложно": "bg-red-100 text-red-800 border-red-200",
  };

  const getDifficultyLabel = () => {
    if (difficulty === "Легко") return "Легкий ИИ";
    if (difficulty === "Средне") return "Средний ИИ";
    return "Сложный ИИ";
  };

  return (
    <>
      <TopBar title="Выбери режим игры" />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[800px] mx-auto space-y-10">
          
          {/* Section 1 - Mode selector */}
          <section>
            <div className="grid grid-cols-3 gap-4">
              
              {/* Card 1 - AI */}
              <button 
                className={`relative p-5 bg-white rounded-[10px] text-left transition-all ${
                  mode === "ai" ? "border-[1.5px] border-[#6366F1]" : "border border-[#EBEBEA]"
                }`}
                onClick={() => setMode("ai")}
              >
                <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full">
                  Бесплатно
                </div>
                <div className="w-12 h-12 rounded-[8px] bg-indigo-50 text-[#6366F1] flex items-center justify-center mb-4">
                  <RobotIcon />
                </div>
                <h3 className="text-[15px] font-semibold mb-1">Против ИИ</h3>
                <p className="text-[13px] text-gray-500 leading-snug">
                  3 уровня. Без регистрации. Анализ после входа.
                </p>
              </button>

              {/* Card 2 - With Friend (Locked) */}
              <button 
                className="relative p-5 bg-white rounded-[10px] border border-[#EBEBEA] text-left opacity-60 hover:opacity-80 transition-opacity"
                onClick={handleLockedMode}
              >
                <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <LockIcon /> Войти
                </div>
                <div className="w-12 h-12 rounded-[8px] bg-gray-100 text-gray-500 flex items-center justify-center mb-4">
                  <UsersIcon />
                </div>
                <h3 className="text-[15px] font-semibold mb-1 text-gray-600">С другом</h3>
                <p className="text-[13px] text-gray-400 leading-snug">
                  Играйте на одном устройстве или по ссылке.
                </p>
              </button>

              {/* Card 3 - Multiplayer (Locked) */}
              <button 
                className="relative p-5 bg-white rounded-[10px] border border-[#EBEBEA] text-left opacity-60 hover:opacity-80 transition-opacity"
                onClick={handleLockedMode}
              >
                <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <LockIcon /> Войти
                </div>
                <div className="w-12 h-12 rounded-[8px] bg-gray-100 text-gray-500 flex items-center justify-center mb-4">
                  <GlobeIcon />
                </div>
                <h3 className="text-[15px] font-semibold mb-1 text-gray-600">Мультиплеер</h3>
                <p className="text-[13px] text-gray-400 leading-snug">
                  Рейтинг Эло. Матчмейкинг.
                </p>
              </button>

            </div>
          </section>

          {/* Section 2 - Game settings */}
          <section className="grid grid-cols-2 gap-8">
            
            {/* Block 1 - Timer */}
            <div>
              <h2 className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-3">
                Таймер
              </h2>
              <div className="flex flex-wrap gap-2">
                {["3 мин", "5 мин", "10 мин", "∞"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimer(t)}
                    className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors border ${
                      timer === t 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-gray-700 border-[#EBEBEA] hover:bg-gray-50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Block 2 - Difficulty */}
            <div>
              <h2 className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-3">
                Сложность
              </h2>
              <div className="flex flex-wrap gap-2">
                {["Легко", "Средне", "Сложно"].map((d) => {
                  const isSelected = difficulty === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition-colors border ${
                        isSelected 
                          ? difficultyColors[d]
                          : "bg-white text-gray-700 border-[#EBEBEA] hover:bg-gray-50"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

          </section>

          {/* Section 3 - Play CTA */}
          <section>
            <div className="bg-black text-white rounded-[12px] p-4 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold mb-0.5">Начать партию</h2>
                <div className="text-[13px] text-gray-400">
                  {timer} · {getDifficultyLabel()} · Русские шашки
                </div>
              </div>
              <button 
                onClick={() => router.push("/game")}
                className="bg-white text-black px-6 py-2.5 rounded-[8px] text-[13px] font-semibold flex items-center gap-2 hover:bg-gray-100 transition-colors"
              >
                <PlayIcon />
                Играть
              </button>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
