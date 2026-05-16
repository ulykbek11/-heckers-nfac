import React from 'react';
import Link from 'next/link';
import { Grid2X2, Brain, Trophy, Shirt } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  // Generate 8x8 checkerboard
  const squares = Array.from({ length: 64 }, (_, i) => {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const isDark = (row + col) % 2 === 1;
    
    // Add some random pieces
    let piece = null;
    if (i === 18 || i === 41) piece = 'dark';
    if (i === 27 || i === 44) piece = 'light';
    if (i === 36) piece = 'dark-king';

    return (
      <div 
        key={i} 
        className={`w-full aspect-square relative ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#F7F6F3]'}`}
      >
        {piece && (
          <div className="absolute inset-0 flex items-center justify-center p-1.5">
            <div className={`w-full h-full rounded-full border-[3px] shadow-sm ${
              piece.startsWith('dark') 
                ? 'bg-[#2a2a2a] border-[#111]' 
                : 'bg-white border-[#EBEBEA]'
            } flex items-center justify-center`}>
              {piece.includes('king') && (
                <div className="w-1/2 h-1/2 rounded-full border-2 border-opacity-30 border-white" />
              )}
            </div>
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="min-h-screen flex w-full">
      {/* LEFT COLUMN */}
      <div className="w-full lg:w-[40%] bg-white flex flex-col relative z-10">
        <div className="p-8">
          <Link href="/" className="inline-flex items-center gap-2 text-black hover:opacity-80 transition-opacity">
            <Grid2X2 className="w-6 h-6 text-[#6366F1]" />
            <span className="font-bold text-xl tracking-tight">Damka</span>
          </Link>
        </div>
        
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 w-full max-w-[500px] mx-auto">
          {children}
        </div>

        <div className="p-8 text-center sm:text-left">
          <p className="text-sm text-gray-400 font-medium">© 2025 Damka</p>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="hidden lg:flex w-[60%] bg-[#F7F6F3] flex-col p-12 relative overflow-hidden">
        {/* Abstract shapes/blur */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#6366F1] rounded-full mix-blend-multiply filter blur-[120px] opacity-10" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-10" />
        
        <div className="flex-1 flex items-center justify-center z-10">
          {/* Decorative board container */}
          <div className="w-full max-w-[480px]">
            <div className="bg-white p-6 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-[#EBEBEA] rotate-[-2deg] hover:rotate-0 transition-transform duration-500 ease-out">
              <div className="grid grid-cols-8 grid-rows-8 border-4 border-[#1a1a1a] rounded-sm overflow-hidden bg-[#F7F6F3]">
                {squares}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="z-10 mt-auto pt-12">
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#EBEBEA] flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-[#6366F1]" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-1">ИИ-анализ партий</h3>
                <p className="text-[12px] text-gray-500 leading-tight">Учитесь на своих ошибках с детальным разбором</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#EBEBEA] flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-[#6366F1]" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-1">Рейтинг Эло</h3>
                <p className="text-[12px] text-gray-500 leading-tight">Соревнуйтесь с равными по силе игроками</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#EBEBEA] flex items-center justify-center shrink-0">
                <Shirt className="w-5 h-5 text-[#6366F1]" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-1">Магазин скинов</h3>
                <p className="text-[12px] text-gray-500 leading-tight">Кастомизируйте доску и шашки за монеты</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
