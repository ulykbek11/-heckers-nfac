"use client";

import { useAppStore } from "@/store/useAppStore";
import { translations, TranslationType } from "@/lib/i18n";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Coins, Trophy } from "lucide-react";
import { useDataStore } from "@/store/useDataStore";

export function TopBar({ titleKey }: { titleKey?: keyof TranslationType['topbar'] }) {
  const { lang, topBarTitle } = useAppStore();
  const t = translations[lang].topbar;
  const { user, profile, loading, signOut } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    useDataStore.getState().clearCache();
    router.push("/");
    router.refresh();
  };

  const displayTitle = titleKey ? (t as any)[titleKey] : topBarTitle;

  return (
    <header className="h-[60px] bg-white border-b border-[#EBEBEA] flex items-center justify-between px-6 sticky top-0 z-10 flex-shrink-0">
      <h1 className="text-[15px] font-semibold">
        {displayTitle}
      </h1>

      <div className="flex items-center gap-4">
        {loading ? (
          <div className="w-24 h-8 bg-gray-100 rounded-lg animate-pulse" />
        ) : user ? (
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[13px] text-gray-900 font-semibold leading-none">
                    {profile?.username || user.user_metadata.full_name || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[11px] text-indigo-500 font-medium">
                    {profile?.elo ?? 1200} {t.elo}
                  </span>
                </div>
                <div className="hidden md:block h-8 w-px bg-gray-100" />
                <div className="flex items-center gap-1.5 px-2 py-1 md:px-2.5 bg-amber-50 rounded-full border border-amber-100">
                  <Coins size={14} className="md:w-[16px] md:h-[16px]" color="#d4a017" />
                  <span className="text-[12px] md:text-[13px] font-bold text-amber-700">
                    {profile?.coins ?? 0}
                  </span>
                </div>
              </div>
            
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Выйти"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-[8px] text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {t.login}
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-[8px] bg-black text-white text-[13px] font-semibold hover:bg-gray-800 transition-colors"
            >
              {t.register}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
