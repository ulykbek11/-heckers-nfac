"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { Play, Lock, Trophy } from "lucide-react";

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

  return (
    <>
      <TopBar titleKey="chooseMode" />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[800px] mx-auto space-y-10">

          {/* Welcome Banner */}
          <div className="bg-[#1a1a1a] rounded-[12px] p-[24px_28px] flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-semibold text-white mb-1">{t.bannerTitle}</h2>
              <p className="text-[13px] text-white/50">{t.bannerSub}</p>
            </div>
            <div className="flex flex-col gap-2 text-right">
              <div className="flex items-center justify-end gap-2 text-white text-[13px]">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                1 200 {t.online}
              </div>
              <div className="flex items-center justify-end gap-2 text-white/70 text-[13px]">
                <Trophy size={14} className="text-yellow-500" />
                {t.topPlayer} Алматы
              </div>
            </div>
          </div>
          
          {/* Section 1 - Mode selector */}
          <section>
            <div className="grid grid-cols-3 gap-4">
              
              {/* Card 1 - AI */}
              <button 
                className={`relative p-6 bg-white rounded-[10px] text-left transition-all min-h-[160px] flex flex-col ${
                  mode === "ai" ? "border-[1.5px] border-[#6366F1]" : "border border-[#EBEBEA]"
                }`}
                onClick={() => setMode("ai")}
              >
                <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full">
                  {t.free}
                </div>
                <div className="w-14 h-14 rounded-[8px] bg-indigo-50 text-[#6366F1] flex items-center justify-center mb-4">
                  <RobotIcon />
                </div>
                <h3 className="text-[16px] font-semibold mb-1 mt-auto">{t.vsAi}</h3>
                <p className="text-[14px] text-gray-500 leading-snug">
                  {t.vsAiDesc}
                </p>
              </button>

              {/* Card 2 - With Friend (Locked) */}
              <button 
                className="relative p-6 bg-white rounded-[10px] border border-[#EBEBEA] text-left opacity-60 hover:opacity-80 transition-opacity min-h-[160px] flex flex-col"
                onClick={openAuthModal}
              >
                <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock size={12} /> {translations[lang].sidebar.login}
                </div>
                <div className="w-14 h-14 rounded-[8px] bg-gray-100 text-gray-500 flex items-center justify-center mb-4">
                  <UsersIcon />
                </div>
                <h3 className="text-[16px] font-semibold mb-1 text-gray-600 mt-auto">{t.withFriend}</h3>
                <p className="text-[14px] text-gray-400 leading-snug">
                  {t.withFriendDesc}
                </p>
              </button>

              {/* Card 3 - Multiplayer (Locked) */}
              <button 
                className="relative p-6 bg-white rounded-[10px] border border-[#EBEBEA] text-left opacity-60 hover:opacity-80 transition-opacity min-h-[160px] flex flex-col"
                onClick={openAuthModal}
              >
                <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock size={12} /> {translations[lang].sidebar.login}
                </div>
                <div className="w-14 h-14 rounded-[8px] bg-gray-100 text-gray-500 flex items-center justify-center mb-4">
                  <GlobeIcon />
                </div>
                <h3 className="text-[16px] font-semibold mb-1 text-gray-600 mt-auto">{t.multiplayer}</h3>
                <p className="text-[14px] text-gray-400 leading-snug">
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
                    className={`h-[40px] px-5 rounded-[8px] text-[14px] font-semibold transition-colors border ${
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
            <div>
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
                      className={`h-[40px] px-5 rounded-[8px] text-[14px] font-semibold transition-colors border ${
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
                  {timer} · {getDifficultyLabel()} · {t.russianCheckers}
                </div>
              </div>
              <button 
                onClick={() => router.push(`/game?difficulty=${encodeURIComponent(difficulty)}`)}
                className="bg-white text-black px-6 py-2.5 rounded-[8px] text-[14px] font-semibold flex items-center gap-2 hover:bg-gray-100 transition-colors"
              >
                <Play size={18} fill="currentColor" />
                {t.play}
              </button>
            </div>
          </section>

          {/* Section 4 - Dashboard */}
          <section>
            <h2 className="text-[15px] font-semibold mb-4">{t.dashboardTitle}</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white border border-[#EBEBEA] rounded-[10px] p-5">
                <div className="text-[13px] text-gray-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {t.playersOnline}
                </div>
                <div className="text-[24px] font-semibold">1 204</div>
              </div>
              <div className="bg-white border border-[#EBEBEA] rounded-[10px] p-5">
                <div className="text-[13px] text-gray-500 font-semibold uppercase tracking-wider mb-2">
                  {t.gamesToday}
                </div>
                <div className="text-[24px] font-semibold">3 871</div>
              </div>
              <div className="bg-white border border-[#EBEBEA] rounded-[10px] p-5">
                <div className="text-[13px] text-gray-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Trophy size={14} className="text-yellow-500" />
                  {t.topPlayerDay}
                </div>
                <div className="text-[20px] font-semibold">Arman K.</div>
                <div className="text-[13px] text-gray-400 mt-1">Алматы · 1842 Эло</div>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white border border-[#EBEBEA] rounded-[10px] overflow-hidden relative">
              <div className="p-4 border-b border-[#EBEBEA]">
                <h3 className="text-[15px] font-semibold">{t.top5}</h3>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr_100px_100px] text-[13px] font-semibold text-gray-500 p-4 border-b border-[#EBEBEA]">
                <div>{t.tableRank}</div>
                <div>{t.tablePlayer}</div>
                <div>{t.tableCity}</div>
                <div>{t.tableElo}</div>
                <div>{t.tableGames}</div>
              </div>
              
              <div className="divide-y divide-[#EBEBEA]">
                {[
                  { rank: 1, name: "Arman K.", city: "Алматы", elo: 1842, games: 342 },
                  { rank: 2, name: "Darkhan B.", city: "Астана", elo: 1810, games: 289 },
                  { rank: 3, name: "Serik M.", city: "Шымкент", elo: 1795, games: 410, blurred: true },
                  { rank: 4, name: "Ruslan A.", city: "Караганда", elo: 1780, games: 156, blurred: true },
                  { rank: 5, name: "Timur S.", city: "Актобе", elo: 1765, games: 201, blurred: true },
                ].map((row, i) => (
                  <div key={i} className={`grid grid-cols-[80px_1fr_1fr_100px_100px] text-[14px] p-4 ${row.blurred ? 'blur-[3px] select-none opacity-60' : ''}`}>
                    <div className="font-semibold">{row.rank}</div>
                    <div className="font-semibold">{row.name}</div>
                    <div className="text-gray-500">{row.city}</div>
                    <div className="font-semibold text-[#6366F1]">{row.elo}</div>
                    <div className="text-gray-500">{row.games}</div>
                  </div>
                ))}
              </div>

              {/* Login Overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-[180px] bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-8 pointer-events-auto">
                <button 
                  onClick={openAuthModal}
                  className="bg-white border border-[#EBEBEA] shadow-sm px-6 py-2 rounded-full text-[13px] font-semibold text-gray-700 hover:text-black hover:border-gray-300 transition-all flex items-center gap-2"
                >
                  <Lock size={14} />
                  {t.loginToSeeAll}
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
