"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useUser } from "@/hooks/useUser";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { motion } from "framer-motion";
import { BarChart2, Trophy, Target, TrendingUp, Coins, Hash, Flame } from "lucide-react";

export default function StatisticsPage() {
  const { user, profile } = useUser();
  const { lang } = useAppStore();
  const t = translations[lang].stats;
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        
        const { data: games, error } = await supabase
          .from("games")
          .select("*")
          .eq("player_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const total = games.length;
        const wins = games.filter(g => g.winner === "player").length;
        const losses = games.filter(g => g.winner === "opponent").length;
        const draws = games.filter(g => g.winner === "draw").length;
        const coins = games.reduce((acc, g) => acc + (g.coins_earned || 0), 0);
        
        // Avg moves
        const avgMoves = total > 0 ? Math.round(games.reduce((acc, g) => acc + (g.moves?.length || 0), 0) / total) : 0;

        // Weekly progress (dummy for now or calculate from games)
        const weekly = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
        const now = new Date();
        games.forEach(g => {
          const d = new Date(g.created_at);
          const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
          if (diff < 7 && g.winner === 'player') {
            const day = (d.getDay() + 6) % 7; // 0 is Mon
            weekly[day]++;
          }
        });

        setStats({
          total, wins, losses, draws, coins, avgMoves, weekly
        });
      } catch (err: any) {
        console.error('Failed to fetch stats:', err.message || err, err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const winRate = stats?.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;

  return (
    <>
      <TopBar />
      <motion.main 
        className="flex-1 p-8 overflow-y-auto bg-[#F7F6F3]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-20 md:pb-0 px-2 md:px-0">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <BarChart2 className="text-indigo-600" /> {t.title}
          </h1>

          {/* Top Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: t.played, value: stats?.total, icon: Hash, color: "text-blue-600" },
              { label: t.wins, value: stats?.wins, icon: Trophy, color: "text-green-600" },
              { label: t.losses, value: stats?.losses, icon: Target, color: "text-red-600" },
              { label: t.winRate, value: `${winRate}%`, icon: TrendingUp, color: "text-indigo-600" },
            ].map((card, i) => (
              <div key={i} className="bg-white p-4 md:p-6 rounded-2xl border border-[#EBEBEA] shadow-sm">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <card.icon size={16} className={card.color} />
                </div>
                <div className="text-lg md:text-2xl font-bold">{card.value}</div>
                <div className="text-[10px] md:text-[12px] text-gray-500 uppercase tracking-wider font-medium">{card.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl border border-[#EBEBEA] shadow-sm overflow-hidden">
              <h3 className="text-[14px] font-bold mb-6 flex items-center gap-2">
                <TrendingUp size={16} /> {t.weeklyProgress}
              </h3>
              <div className="flex items-end justify-between h-[160px] md:h-[200px] px-2 md:px-4">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, i) => {
                  const val = stats?.weekly[i] || 0;
                  const max = Math.max(...(stats?.weekly || []), 1);
                  const height = (val / max) * 100;
                  return (
                    <div key={day} className="flex flex-col items-center gap-2 w-full">
                      <div className="w-6 md:w-8 bg-indigo-500 rounded-t-lg transition-all duration-500" style={{ height: `${height}%`, minHeight: val > 0 ? '4px' : '0' }}></div>
                      <span className="text-[10px] md:text-[11px] text-gray-400 font-medium">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Other Stats */}
            <div className="space-y-4">
              <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#EBEBEA] shadow-sm">
                <div className="flex items-center gap-3 mb-1">
                   <Flame size={18} className="text-orange-500" />
                   <div className="text-xl md:text-2xl font-bold">{profile?.longest_streak ?? 0}</div>
                </div>
                <div className="text-[10px] md:text-[12px] text-gray-500 uppercase tracking-wider font-medium">{t.bestStreak}</div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#EBEBEA] shadow-sm">
                <div className="flex items-center gap-3 mb-1">
                   <Coins size={18} className="text-amber-500" />
                   <div className="text-xl md:text-2xl font-bold">{stats?.coins}</div>
                </div>
                <div className="text-[10px] md:text-[12px] text-gray-500 uppercase tracking-wider font-medium">{t.coinsEarned}</div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#EBEBEA] shadow-sm">
                 <div className="text-[16px] md:text-[14px] font-bold mb-1">{stats?.avgMoves}</div>
                 <div className="text-[10px] md:text-[12px] text-gray-500 uppercase tracking-wider font-medium">{t.avgMoves}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.main>
    </>
  );
}
