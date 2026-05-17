import { motion, AnimatePresence } from "framer-motion";
import { Flame, Coins, CheckCircle2, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { useUser } from "@/hooks/useUser";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";

export function StreakModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { lang } = useAppStore();
  const { profile } = useUser();
  const t = translations[lang].shop; // fallback to some existing translation or hardcode

  if (!mounted || !isOpen) return null;

  const currentStreak = profile?.streak_current || 0;
  const progressToNext = currentStreak % 3;
  const daysRemaining = 3 - progressToNext;

  const rewards = [
    { days: 3, reward: "0", desc: lang === "RU" ? "Открытие сундука" : "Unlock Chest" },
    { days: 7, reward: "200", desc: lang === "RU" ? "Монет" : "Coins" },
    { days: 14, reward: "500", desc: lang === "RU" ? "Монет" : "Coins" },
    { days: 30, reward: "1000", desc: lang === "RU" ? "Монет" : "Coins" },
  ];

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 text-center border-b border-gray-100 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flame size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {lang === "RU" ? "Ваш стрик" : "Your Streak"}
            </h2>
            <p className="text-gray-500 font-medium text-sm">
              {currentStreak} {lang === "RU" ? "дней подряд" : "days in a row"}
            </p>
          </div>

          <div className="p-6 bg-gray-50/50">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {lang === "RU" ? "До следующей награды:" : "Next reward in:"}
                </span>
                <span className="text-sm font-bold text-orange-500">
                  {daysRemaining} {lang === "RU" ? "дн." : "days"}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(progressToNext / 3) * 100}%` }}
                  className="h-full bg-orange-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              {rewards.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    currentStreak >= r.days
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {currentStreak >= r.days ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-400">
                        {r.days}
                      </div>
                    )}
                    <span
                      className={`font-semibold text-sm ${
                        currentStreak >= r.days ? "text-green-700" : "text-gray-700"
                      }`}
                    >
                      {r.days} {lang === "RU" ? "Дней" : "Days"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold">
                    {r.reward === "0" ? (
                      <span className="text-indigo-500 text-xs uppercase tracking-wider">{r.desc}</span>
                    ) : (
                      <>
                        <Coins size={14} className="text-amber-500" />
                        <span className="text-amber-600">{r.reward}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
