"use client";

import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";

export function TopBar({ titleKey }: { titleKey: "chooseMode" | "gameVsAi" }) {
  const { lang, openAuthModal } = useAppStore();
  const t = translations[lang].topbar;

  return (
    <header className="h-[60px] bg-white border-b border-[#EBEBEA] flex items-center justify-between px-6 sticky top-0 z-10 flex-shrink-0">
      <h1 className="text-[15px] font-semibold">{t[titleKey]}</h1>
      
      <div className="flex items-center gap-3">
        <button onClick={openAuthModal} className="px-4 py-1.5 rounded-[8px] border border-[#EBEBEA] text-[13px] font-semibold hover:bg-gray-50 transition-colors">
          {t.login}
        </button>
        <button onClick={openAuthModal} className="px-4 py-1.5 rounded-[8px] bg-black text-white text-[13px] font-semibold hover:bg-gray-800 transition-colors">
          {t.register}
        </button>
      </div>
    </header>
  );
}
