"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

export default function LeaderboardPage() {
  const router = useRouter();
  const { lang, openAuthModal } = useAppStore();
  const tSidebar = translations[lang].sidebar;
  const tLanding = translations[lang].landing;

  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, elo, games_count')
        .order('elo', { ascending: false })
        .limit(50);
        
      if (data) setPlayers(data);
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  return (
    <>
      <TopBar titleKey="" />
      
      <motion.main 
        className="flex-1 overflow-y-auto p-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="max-w-[800px] mx-auto space-y-6">
          <h1 className="text-[24px] font-bold">{tSidebar.leaderboard}</h1>

          {loading ? (
            <div className="text-gray-500 text-center py-10">Загрузка...</div>
          ) : players.length === 0 ? (
            <div className="bg-white border border-[#EBEBEA] rounded-[10px] p-10 flex flex-col items-center justify-center text-center">
              <h2 className="text-[18px] font-semibold mb-2">Пока никто не сыграл. Будь первым!</h2>
              <button 
                onClick={() => router.push("/")}
                className="mt-6 bg-black text-white px-6 py-2.5 rounded-[8px] text-[14px] font-semibold flex items-center gap-2 hover:brightness-110 hover:scale-[1.02] transition-all duration-150"
              >
                <Play size={18} fill="currentColor" />
                Играть
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#EBEBEA] rounded-[10px] overflow-hidden">
              <div className="grid grid-cols-[80px_1fr_100px_100px] text-[13px] font-semibold text-gray-500 p-4 border-b border-[#EBEBEA]">
                <div>{tLanding.tableRank}</div>
                <div>{tLanding.tablePlayer}</div>
                <div>{tLanding.tableElo}</div>
                <div>{tLanding.tableGames}</div>
              </div>
              
              <div className="divide-y divide-[#EBEBEA]">
                {players.map((row, i) => (
                    <div 
                    key={i} 
                    className="grid grid-cols-[80px_1fr_100px_100px] text-[14px] p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    title="Войдите чтобы видеть профиль"
                    onClick={openAuthModal}
                  >
                    <div className="font-semibold">{i + 1}</div>
                    <div className="font-semibold">{row.username}</div>
                    <div className="font-semibold text-[#6366F1]">{row.elo}</div>
                    <div className="text-gray-500">{row.games_count || 0}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.main>
    </>
  );
}
