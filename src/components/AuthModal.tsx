"use client";

import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { X, Lock, Check } from "lucide-react";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, lang } = useAppStore();
  const t = translations[lang].authModal;

  if (!isAuthModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={closeAuthModal}
    >
      <div 
        className="bg-white rounded-[16px] p-8 w-full max-w-[420px] relative flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-[#6366F1] mb-6">
          <Lock size={28} />
        </div>

        <h2 className="text-[18px] font-semibold mb-2">{t.title}</h2>
        <p className="text-[14px] text-gray-500 mb-6">
          {t.subtitle}
        </p>

        <ul className="space-y-3 mb-8 w-full text-left">
          {[t.f1, t.f2, t.f3, t.f4, t.f5].map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-[14px] text-gray-700">
              <div className="text-[#6366F1] flex-shrink-0">
                <Check size={16} strokeWidth={3} />
              </div>
              {feature}
            </li>
          ))}
        </ul>

        <div className="w-full space-y-3">
          <button className="w-full bg-black text-white rounded-[8px] py-2.5 text-[14px] font-semibold hover:bg-gray-800 transition-colors">
            {t.register}
          </button>
          <button className="w-full bg-white text-black border border-[#EBEBEA] rounded-[8px] py-2.5 text-[14px] font-semibold hover:bg-gray-50 transition-colors">
            {t.login}
          </button>
        </div>
      </div>
    </div>
  );
}
