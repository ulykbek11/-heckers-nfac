"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { showToast } from "./ToastContainer";

const GridIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

const TrophyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);

const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
);

const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
);

const PaletteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
);

const CoinsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const FlameIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
);

const NAV_ITEMS = [
  { label: "Home", icon: HomeIcon, href: "/", locked: false },
  { label: "Leaderboard", icon: TrophyIcon, href: "#", locked: true },
  { label: "Stats", icon: ChartIcon, href: "#", locked: true },
  { label: "History", icon: HistoryIcon, href: "#", locked: true },
];

const SHOP_ITEMS = [
  { label: "Skins", icon: PaletteIcon, href: "#", locked: true },
  { label: "Coins", icon: CoinsIcon, href: "#", locked: true },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast("Войдите, чтобы использовать эту функцию");
  };

  const renderLink = (item: any) => {
    const isActive = pathname === item.href && !item.locked;
    return (
      <Link
        key={item.label}
        href={item.locked ? "#" : item.href}
        onClick={item.locked ? handleLockedClick : undefined}
        className={`flex items-center justify-between px-3 py-2 rounded-[8px] text-[13px] transition-colors ${
          isActive ? "bg-gray-100 font-semibold text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <item.icon />
          <span>{item.label}</span>
        </div>
        {item.locked && (
          <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">
            sign in
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="w-[200px] flex-shrink-0 bg-white border-r border-[#EBEBEA] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2 mb-2">
        <div className="bg-[#6366F1] text-white p-1 rounded-[6px]">
          <GridIcon />
        </div>
        <span className="font-semibold text-[15px] tracking-tight">Damka</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          {NAV_ITEMS.map(renderLink)}
        </div>

        <div>
          <div className="px-3 mb-2 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
            Shop
          </div>
          <div className="space-y-1">
            {SHOP_ITEMS.map(renderLink)}
          </div>
        </div>
      </nav>

      {/* Bottom Profile Block */}
      <div className="p-3">
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[10px] p-3 flex flex-col gap-3 cursor-pointer" onClick={handleLockedClick}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
              <UserIcon />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#92400E]">Гость</div>
              <div className="text-[11px] text-[#B45309]">Без аккаунта</div>
            </div>
          </div>
          
          <div className="h-px bg-[#FDE68A] w-full" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#D97706]">
              <FlameIcon />
              <span className="text-[13px] font-semibold">Стрик</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider bg-[#FDE68A] text-[#92400E] px-2 py-0.5 rounded-full font-semibold">
              войти
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
