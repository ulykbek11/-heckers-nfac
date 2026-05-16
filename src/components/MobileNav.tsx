"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { Home, Trophy, BarChart2, History, ShoppingBag, User } from "lucide-react";
import { useUser } from "@/hooks/useUser";

const NAV_ITEMS = [
  { id: "home", icon: Home, href: "/" },
  { id: "leaderboard", icon: Trophy, href: "/leaderboard" },
  { id: "stats", icon: BarChart2, href: "/statistics", locked: true },
  { id: "shop", icon: ShoppingBag, href: "/shop", locked: true },
  { id: "history", icon: History, href: "/history", locked: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const { lang, openAuthModal } = useAppStore();
  const { user } = useUser();
  const t = translations[lang].sidebar;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#EBEBEA] px-2 py-1 z-50 flex items-center justify-around pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        const isLocked = item.locked && !user;

        return (
          <Link
            key={item.id}
            href={isLocked ? "#" : item.href}
            onClick={(e) => {
              if (isLocked) {
                e.preventDefault();
                openAuthModal();
              }
            }}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              isActive ? "text-[#6366F1]" : "text-gray-400"
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{(t as any)[item.id]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
