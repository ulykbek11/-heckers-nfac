"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useUser } from "@/hooks/useUser";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { motion } from "framer-motion";
import { History, Bot, User, ChevronRight, Coins, Trophy } from "lucide-react";

export default function HistoryPage() {
  const { user } = useUser();
  const { lang } = useAppStore();
  const t = translations[lang].history;
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data, error } = await supabase
          .from("games")
          .select("*")
          .eq("player_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        setGames(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <>
      <TopBar />
      <motion.main 
        className="flex-1 p-8 overflow-y-auto bg-[#F7F6F3]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="text-indigo-600" /> {t.title}
          </h1>

          {games.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
               {t.empty}
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((game) => {
                const isVictory = game.winner === 'player';
                const isDraw = game.winner === 'draw';
                
                return (
                  <div key={game.id} className="bg-white rounded-xl border border-[#EBEBEA] p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                    {/* Status Indicator */}
                    <div className={`w-1.5 h-12 rounded-full ${isVictory ? 'bg-green-500' : (isDraw ? 'bg-gray-300' : 'bg-red-500')}`} />
                    
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                      {game.mode === 'ai' ? <Bot size={20} /> : <User size={20} />}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="font-semibold text-[15px]">
                        {game.mode === 'ai' ? `${t.vsAi} (${game.difficulty})` : t.vsPlayer}
                      </div>
                      <div className="text-[13px] text-gray-500">
                        <span className={isVictory ? 'text-green-600 font-medium' : (isDraw ? 'text-gray-500' : 'text-red-600 font-medium')}>
                          {isVictory ? t.victory : (isDraw ? t.draw : t.defeat)}
                        </span>
                        {" · "}{game.moves?.length || 0} {t.moves} {" · "}{new Date(game.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Rewards */}
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-[13px] font-bold text-amber-600">
                        <Coins size={14} /> +{game.coins_earned || 0}
                      </div>
                      <div className={`flex items-center gap-1 text-[11px] font-bold ${game.elo_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <Trophy size={12} /> {game.elo_change >= 0 ? '+' : ''}{game.elo_change}
                      </div>
                    </div>

                    <ChevronRight size={18} className="text-gray-300" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.main>
    </>
  );
}
