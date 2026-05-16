"use client";

import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function TopBar({ titleKey }: { titleKey?: "chooseMode" | "gameVsAi" }) {
  const { lang } = useAppStore();
  const t = translations[lang].topbar;
  const { user, profile, loading, signOut } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="h-[60px] bg-white border-b border-[#EBEBEA] flex items-center justify-between px-6 sticky top-0 z-10 flex-shrink-0">
      <h1 className="text-[15px] font-semibold">
        {titleKey ? t[titleKey] : ""}
      </h1>

      <div className="flex items-center gap-3">
        {loading ? (
          <div className="w-24 h-8 bg-gray-100 rounded-lg animate-pulse" />
        ) : user && profile ? (
          <>
            <span className="text-[13px] text-gray-600 font-medium">
              {profile.username}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] border border-[#EBEBEA] text-[13px] font-semibold hover:bg-gray-50 transition-colors text-gray-600 hover:text-red-500"
            >
              <LogOut size={14} />
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-[8px] border border-[#EBEBEA] text-[13px] font-semibold hover:bg-gray-50 transition-colors"
            >
              {t.login}
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 rounded-[8px] bg-black text-white text-[13px] font-semibold hover:bg-gray-800 transition-colors"
            >
              {t.register}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
