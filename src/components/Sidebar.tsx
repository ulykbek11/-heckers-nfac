"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { Grid, Home, Trophy, BarChart2, History, ShoppingBag, User, Flame, LogOut, Coins, Globe, Bot, Palette, Crown } from "lucide-react";
import { useUser } from "@/hooks/useUser";

const NAV_ITEMS = [
  { id: "home", icon: Home, href: "/", locked: false },
  { id: "leaderboard", icon: Trophy, href: "/leaderboard", locked: false },
  { id: "stats", icon: BarChart2, href: "/statistics", locked: true },
  { id: "history", icon: History, href: "/history", locked: true },
  { id: "shop", icon: ShoppingBag, href: "/shop", locked: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, openAuthModal } = useAppStore();
  const t = translations[lang].sidebar;
  const { user, profile, loading, signOut } = useUser();

  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) openAuthModal();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const renderLink = (item: { id: string; icon: React.ElementType; href: string; locked: boolean }) => {
    const isActive = pathname === item.href;
    const label = (t as any)[item.id];
    const isLocked = item.locked && !user;

    return (
      <Link
        key={item.id}
        href={isLocked ? "#" : item.href}
        onClick={isLocked ? handleLockedClick : undefined}
        className={`flex items-center justify-between px-3 py-2 rounded-[8px] text-[13px] transition-colors duration-150 ease-in-out ${
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
    <aside className="w-[240px] flex-shrink-0 bg-white border-r border-[#EBEBEA] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2 mb-2">
        <div className="bg-[#6366F1] text-white p-1 rounded-[6px]">
          <Crown size={20} />
        </div>
        <span className="font-semibold text-[15px] tracking-tight uppercase">Damka</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(renderLink)}
      </nav>

      {/* Language Toggle */}
      <div className="px-4 py-2">
        <button
          onClick={() => setLang(lang === "RU" ? "EN" : "RU")}
          className="w-full py-1.5 px-3 rounded-[8px] border border-[#EBEBEA] text-[11px] font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-1"
        >
          <span className={lang === "RU" ? "text-black" : ""}>RU</span>
          <span className="text-gray-300">/</span>
          <span className={lang === "EN" ? "text-black" : ""}>EN</span>
        </button>
      </div>

      {/* Bottom Section - Profile */}
      <div className="bg-white border-t border-[#e5e2dc] p-4 flex flex-col gap-4">
        {loading ? (
          <div className="h-[120px] bg-gray-50 animate-pulse rounded-lg" />
        ) : user ? (
          <>
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-[18px] font-bold overflow-hidden border border-gray-100 shadow-sm">
                {profile?.avatar_url || user.user_metadata.avatar_url ? (
                  <img src={profile?.avatar_url || user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  (profile?.username || user.email || 'P')[0].toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-[#1a1a1a] truncate">
                  {profile?.username || user.user_metadata.full_name || user.email?.split('@')[0]}
                </div>
                <div className="text-[11px] text-[#aaa]">@{user.email?.split('@')[0]}</div>
              </div>
            </div>

            <div className="h-px bg-[#f0ede8]" />

            {/* ELO & Rank */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-[#d4a017]" />
                <span className="text-[13px] font-semibold text-[#1a1a1a]">{profile?.elo ?? 1200} {translations[lang].topbar.elo}</span>
              </div>
            </div>

            <div className="h-px bg-[#f0ede8]" />

            {/* Streak Progress */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#1a1a1a]">
                  <Flame size={14} color="#e05c00" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#aaa]">{t.streak}</span>
                </div>
                <span className="text-[11px] font-bold text-[#1a1a1a]">{profile?.current_streak ?? 0} {t.days}</span>
              </div>
              <div className="w-full h-1 bg-[#f0ede8] rounded-[2px] overflow-hidden">
                <div 
                  className="h-full bg-[#e05c00] transition-all duration-500" 
                  style={{ width: `${Math.min(((profile?.current_streak ?? 0) % 3) / 3 * 100, 100)}%` }}
                />
              </div>
              <div className="text-[11px] text-[#aaa] text-right">
                {(profile?.current_streak ?? 0) % 3}/3 {t.progressToReward}
              </div>
            </div>

            <div className="h-px bg-[#f0ede8]" />

            {/* Coins */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins size={14} color="#d4a017" />
                <span className="text-[13px] font-semibold text-[#1a1a1a]">{profile?.coins ?? 0} {translations[lang].topbar.coins}</span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-[#aaa] hover:text-red-500 transition-colors text-[11px] font-medium mt-1"
            >
              <LogOut size={13} />
              {t.logout}
            </button>
          </>
        ) : (
          /* Guest block redesigned */
          <div 
            className="flex flex-col gap-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={openAuthModal}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <User size={24} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-[#1a1a1a]">{t.guest}</div>
                <div className="text-[11px] text-[#aaa]">{t.noAccount}</div>
              </div>
            </div>
            <button className="w-full py-2 bg-black text-white text-[12px] font-bold rounded-lg uppercase tracking-wider">
              {t.login}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

