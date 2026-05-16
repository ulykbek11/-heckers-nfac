"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";

export default function GamePage() {
  const router = useRouter();

  return (
    <>
      <TopBar title="Партия против ИИ" />
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <button 
          onClick={() => router.push("/")}
          className="mb-8 px-4 py-2 bg-white border border-[#EBEBEA] rounded-[8px] text-[13px] font-semibold hover:bg-gray-50 transition-colors"
        >
          ← Вернуться назад
        </button>
        
        {/* Placeholder Board Outline */}
        <div className="w-[400px] h-[400px] bg-white border border-[#EBEBEA] rounded-[10px] grid grid-cols-8 grid-rows-8 overflow-hidden shadow-sm">
          {Array.from({ length: 64 }).map((_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const isDark = (row + col) % 2 === 1;
            return (
              <div 
                key={i} 
                className={isDark ? "bg-[#F7F6F3]" : "bg-white"}
              />
            );
          })}
        </div>
      </main>
    </>
  );
}
