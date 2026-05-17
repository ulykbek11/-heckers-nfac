"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { Play, Lock, Bot, Users, Globe, Loader2, User } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import Image from "next/image";

function MatchmakingBlock({ timer }: { timer: string }) {
  const { user } = useUser();
  const { lang } = useAppStore();
  const t = translations[lang].game;
  const { isSearching, searchTime, opponentFound, opponentData, currentEloRange, startSearch, cancelSearch } = useMatchmaking();

  const handleStartSearch = () => {
    if (!user) return;
    const timerSeconds = parseInt(timer.split(" ")[0]) * 60;
    // user.elo might not be immediately available from auth, prefer profile.elo if we had it, or pass what we have
    startSearch(user.id, (user as any).elo || 1200, timerSeconds);
  };

  if (opponentFound && opponentData) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 w-full py-8">
        <h3 className="text-xl font-bold text-green-600">{t.youWon.replace("!", "")} {/* Placeholder for "Match Found!" if we add to dict */} Соперник найден!</h3>
        
        <div className="flex items-center justify-center gap-8 w-full max-w-md">
          {/* You */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-indigo-500">
              {user?.user_metadata?.avatar_url ? (
                <Image src={user.user_metadata.avatar_url} alt="You" width={64} height={64} className="object-cover" />
              ) : (
                <User className="text-indigo-500 w-8 h-8" />
              )}
            </div>
            <span className="font-semibold text-sm">{user?.user_metadata?.username || "Вы"}</span>
            <span className="text-xs text-gray-500">ELO: {user?.elo || 1200}</span>
          </div>

          <div className="text-2xl font-bold text-gray-300">VS</div>

          {/* Opponent */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center overflow-hidden border-2 border-red-500">
              {opponentData.avatar_url ? (
                <Image src={opponentData.avatar_url} alt="Opponent" width={64} height={64} className="object-cover" />
              ) : (
                <User className="text-red-500 w-8 h-8" />
              )}
            </div>
            <span className="font-semibold text-sm">{opponentData.username}</span>
            <span className="text-xs text-gray-500">ELO: {opponentData.elo}</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 animate-pulse">{t.gameStartsIn} 3...</p>
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 w-full py-6">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-lg font-semibold">{t.searchingOpponent}</p>
        <p className="text-2xl font-mono tracking-widest font-bold">
          {Math.floor(searchTime / 60)}:{(searchTime % 60).toString().padStart(2, '0')}
        </p>
        <button 
          onClick={cancelSearch}
          className="mt-4 px-6 py-2 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          {t.cancelSearch}
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleStartSearch}
      className="w-full max-w-sm py-3 bg-indigo-600 text-white rounded-[12px] font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
    >
      <Globe size={20} />
      {translations[lang].landing.matchmaking}
    </button>
  );
}

export default function Home() {
  const router = useRouter();
  const { lang, openAuthModal, setTopBarTitle } = useAppStore();
  const { user } = useUser();
  const t = translations[lang].landing;
  const tTopbar = translations[lang].topbar;
  
  const [mode, setMode] = useState("ai");
  const [timer, setTimer] = useState("5 мин");
  const [difficulty, setDifficulty] = useState("Легко");
  const [roomCode, setRoomCode] = useState("");

  useEffect(() => {
    setTopBarTitle(tTopbar.chooseMode);
  }, [setTopBarTitle, tTopbar.chooseMode]);

  const difficultyColors: Record<string, string> = {
    "Легко": "bg-green-100 text-green-800 border-green-200",
    "Средне": "bg-amber-100 text-amber-800 border-amber-200",
    "Сложно": "bg-red-100 text-red-800 border-red-200",
  };

  const getDifficultyLabel = () => {
    if (difficulty === "Легко") return t.easy;
    if (difficulty === "Средне") return t.medium;
    return t.hard;
  };

  const handleModeSelect = (newMode: string) => {
    console.log('Mode selected:', newMode);
    if (newMode === "ai") {
      setMode(newMode);
    } else {
      if (user) {
        setMode(newMode);
      } else {
        console.log('User not logged in, opening auth modal');
        openAuthModal();
      }
    }
  };

  return (
    <>
      <motion.main 
        className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="max-w-[800px] mx-auto space-y-6 md:space-y-10">
          
          {/* Section 1 - Mode selector */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              
              {/* Card 1 - AI */}
              <button 
                className={`relative p-6 md:p-8 bg-white rounded-[16px] flex flex-col items-center justify-center gap-4 hover:-translate-y-[2px] transition-all duration-200 shadow-sm ${
                  mode === "ai" ? "border-2 border-[#6366F1] bg-indigo-50/10" : "border border-[#EBEBEA] hover:border-gray-300"
                }`}
                onClick={() => handleModeSelect("ai")}
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[12px] flex items-center justify-center ${mode === "ai" ? "bg-[#6366F1] text-white" : "bg-indigo-50 text-[#6366F1]"}`}>
                  <Bot size={24} className="md:w-[28px] md:h-[28px]" />
                </div>
                <h3 className="text-[16px] md:text-[18px] font-bold">{t.vsAi}</h3>
              </button>

              {/* Card 2 - With Friend (Multiplayer) */}
              <button 
                className={`relative p-6 md:p-8 bg-white rounded-[16px] flex flex-col items-center justify-center gap-4 hover:-translate-y-[2px] transition-all duration-200 shadow-sm ${
                  mode === "multiplayer" ? "border-2 border-[#6366F1] bg-indigo-50/10" : "border border-[#EBEBEA] hover:border-gray-300"
                } ${!user ? "opacity-60" : ""}`}
                onClick={() => handleModeSelect("multiplayer")}
              >
                {!user && (
                  <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={12} /> {translations[lang].sidebar.login}
                  </div>
                )}
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[12px] flex items-center justify-center ${mode === "multiplayer" ? "bg-[#6366F1] text-white" : "bg-indigo-50 text-[#6366F1]"}`}>
                  <Users size={24} className="md:w-[28px] md:h-[28px]" />
                </div>
                <h3 className="text-[16px] md:text-[18px] font-bold">{t.withFriend}</h3>
              </button>

              {/* Card 3 - Matchmaking */}
              <button 
                className={`relative p-6 md:p-8 bg-white rounded-[16px] flex flex-col items-center justify-center gap-4 hover:-translate-y-[2px] transition-all duration-200 shadow-sm ${
                  mode === "matchmaking" ? "border-2 border-[#6366F1] bg-indigo-50/10" : "border border-[#EBEBEA] hover:border-gray-300"
                } ${!user ? "opacity-60" : ""}`}
                onClick={() => handleModeSelect("matchmaking")}
              >
                {!user && (
                  <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={12} /> {translations[lang].sidebar.login}
                  </div>
                )}
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[12px] flex items-center justify-center ${mode === "matchmaking" ? "bg-[#6366F1] text-white" : "bg-indigo-50 text-[#6366F1]"}`}>
                  <Globe size={24} className="md:w-[28px] md:h-[28px]" />
                </div>
                <h3 className="text-[16px] md:text-[18px] font-bold">{t.matchmaking}</h3>
              </button>

            </div>
          </section>

          <AnimatePresence mode="wait">
            {mode === 'ai' && (
              <motion.div
                key="ai-settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 md:space-y-10"
              >
                {/* Section 2 - Game settings (AI) */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
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
                          className={`h-[36px] md:h-[40px] px-4 md:px-5 rounded-[8px] text-[13px] md:text-[14px] font-semibold active:scale-95 transition-all duration-100 border ${
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
                            className={`h-[36px] md:h-[40px] px-4 md:px-5 rounded-[8px] text-[13px] md:text-[14px] font-semibold active:scale-95 transition-all duration-100 border ${
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
                  <div className="bg-black text-white rounded-[16px] p-6 md:p-[24px_32px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-gray-200">
                    <div className="text-center md:text-left">
                      <h2 className="text-[18px] md:text-[20px] font-bold mb-0.5">{t.startGame}</h2>
                      <div className="text-[13px] md:text-[14px] text-gray-400">
                        {timer} · {getDifficultyLabel()} · {t.play}
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        console.log('Navigating to AI game...', { difficulty, timer });
                        const params = new URLSearchParams();
                        params.set('mode', 'ai');
                        params.set('difficulty', difficulty);
                        params.set('timer', timer);
                        router.push(`/game?${params.toString()}`);
                      }}
                      className="w-full md:w-auto bg-white text-black px-8 py-3 rounded-[12px] text-[15px] font-bold flex items-center justify-center gap-2 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 shadow-lg cursor-pointer"
                    >
                      <Play size={20} fill="currentColor" />
                      {t.play}
                    </button>
                  </div>
                </section>
              </motion.div>
            )}
            
            {mode === 'multiplayer' && (
              <motion.div
                key="multiplayer-settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 md:space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Create Room Block */}
                  <div className="bg-white p-6 md:p-8 rounded-[16px] border border-[#EBEBEA] space-y-6">
                    <h3 className="text-[16px] md:text-[18px] font-bold flex items-center gap-2">
                      <Play className="text-indigo-600" size={20} /> {translations[lang].game.createRoom}
                    </h3>
                    
                    <div>
                      <h2 className="text-[13px] uppercase tracking-wider text-gray-400 font-semibold mb-3">
                        {t.timer}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {["3", "5", "10", "∞"].map((tValue) => (
                          <button
                            key={tValue}
                            onClick={() => setTimer(tValue === "∞" ? tValue : `${tValue} ${t.min}`)}
                            className={`h-[36px] px-4 rounded-[8px] text-[13px] font-semibold transition-all border ${
                              timer === (tValue === "∞" ? tValue : `${tValue} ${t.min}`) 
                                ? "bg-black text-white border-black" 
                                : "bg-gray-50 text-gray-700 border-[#EBEBEA] hover:bg-gray-100"
                            }`}
                          >
                            {tValue === "∞" ? tValue : `${tValue} ${t.min}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        console.log('Creating room...', { timer });
                        const params = new URLSearchParams();
                        params.set('mode', 'multiplayer');
                        params.set('action', 'create');
                        params.set('timer', timer);
                        router.push(`/game?${params.toString()}`);
                      }}
                      className="w-full py-3 bg-indigo-600 text-white rounded-[12px] font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {translations[lang].game.createRoom}
                    </button>
                  </div>

                  {/* Join Room Block */}
                  <div className="bg-white p-6 md:p-8 rounded-[16px] border border-[#EBEBEA] space-y-6">
                    <h3 className="text-[16px] md:text-[18px] font-bold flex items-center gap-2">
                      <Globe className="text-indigo-600" size={20} /> {translations[lang].game.joinRoom}
                    </h3>
                    
                    <div className="space-y-3">
                      <h2 className="text-[13px] uppercase tracking-wider text-gray-400 font-semibold">
                        {translations[lang].game.enterCode}
                      </h2>
                      <input 
                        type="text" 
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        placeholder="ABCDEF"
                        className="w-full h-[48px] px-4 bg-gray-50 border border-[#EBEBEA] rounded-[10px] text-center font-mono text-[16px] md:text-[18px] tracking-[4px] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        maxLength={6}
                      />
                    </div>

                    <button 
                      onClick={() => {
                        if (roomCode.length === 6) {
                          router.push(`/game?mode=multiplayer&action=join&code=${roomCode}`);
                        }
                      }}
                      disabled={roomCode.length !== 6}
                      className="w-full py-3 bg-black text-white rounded-[12px] font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                    >
                      {translations[lang].game.joinRoom}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {mode === 'matchmaking' && user && (
              <motion.div
                key="matchmaking-settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 md:space-y-10"
              >
                {/* Matchmaking UI will be added here */}
                <div className="bg-white p-6 md:p-8 rounded-[16px] border border-[#EBEBEA] space-y-6 flex flex-col items-center">
                  <h3 className="text-[16px] md:text-[18px] font-bold">
                    {t.matchmaking}
                  </h3>
                  <div className="w-full max-w-sm">
                    <h2 className="text-[13px] uppercase tracking-wider text-gray-400 font-semibold mb-3">
                      {t.timer}
                    </h2>
                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                      {["3", "5", "10"].map((tValue) => (
                        <button
                          key={tValue}
                          onClick={() => setTimer(tValue === "∞" ? tValue : `${tValue} ${t.min}`)}
                          className={`h-[36px] px-4 rounded-[8px] text-[13px] font-semibold transition-all border ${
                            timer === (tValue === "∞" ? tValue : `${tValue} ${t.min}`) 
                              ? "bg-black text-white border-black" 
                              : "bg-gray-50 text-gray-700 border-[#EBEBEA] hover:bg-gray-100"
                          }`}
                        >
                          {tValue === "∞" ? tValue : `${tValue} ${t.min}`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <MatchmakingBlock timer={timer} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.main>
    </>
  );
}
