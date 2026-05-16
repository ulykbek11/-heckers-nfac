"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { Grid, Home, Trophy, BarChart2, History, ShoppingBag, User, Flame } from "lucide-react";

const NAV_ITEMS = [
  { id: "home", icon: Home, href: "/", locked: false },
  { id: "leaderboard", icon: Trophy, href: "#", locked: true },
  { id: "stats", icon: BarChart2, href: "#", locked: true },
  { id: "history", icon: History, href: "#", locked: true },
  { id: "shop", icon: ShoppingBag, href: "#", locked: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { lang, setLang, openAuthModal } = useAppStore();
  const t = translations[lang].sidebar;

  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openAuthModal();
  };

  const renderLink = (item: { id: string; icon: React.ElementType; href: string; locked: boolean }) => {
    const isActive = pathname === item.href && !item.locked;
    const label = t[item.id as keyof typeof t];
    
    return (
      <Link
        key={item.id}
        href={item.locked ? "#" : item.href}
        onClick={item.locked ? handleLockedClick : undefined}
        className={`flex items-center justify-between px-3 py-2 rounded-[8px] text-[13px] transition-colors ${
          isActive ? "bg-gray-100 font-semibold text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <item.icon size={18} />
          <span>{label}</span>
        </div>
      </Link>
    );
  };

  return (
    <aside className="w-[200px] flex-shrink-0 bg-white border-r border-[#EBEBEA] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2 mb-2">
        <div className="bg-[#6366F1] text-white p-1 rounded-[6px]">
          <Grid size={20} />
        </div>
        <span className="font-semibold text-[15px] tracking-tight">Damka</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          {NAV_ITEMS.map(renderLink)}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 flex flex-col gap-2">
        {/* Language Toggle */}
        <button 
          onClick={() => setLang(lang === 'RU' ? 'EN' : 'RU')}
          className="w-full py-1.5 px-3 rounded-[8px] border border-[#EBEBEA] text-[11px] font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-1"
        >
          <span className={lang === 'RU' ? 'text-black' : ''}>RU</span>
          <span className="text-gray-300">/</span>
          <span className={lang === 'EN' ? 'text-black' : ''}>EN</span>
        </button>

        {/* Profile Block */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[10px] p-3 flex flex-col gap-3 cursor-pointer" onClick={handleLockedClick}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
              <User size={20} />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#92400E]">{t.guest}</div>
              <div className="text-[11px] text-[#B45309]">{t.noAccount}</div>
            </div>
          </div>
          
          <div className="h-px bg-[#FDE68A] w-full" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#D97706]">
              <Flame size={16} />
              <span className="text-[13px] font-semibold">{t.streak}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider bg-[#FDE68A] text-[#92400E] px-2 py-0.5 rounded-full font-semibold">
              {t.login}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
