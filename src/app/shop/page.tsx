"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useUser } from "@/hooks/useUser";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Coins, Check, Lock } from "lucide-react";

const CATEGORIES = ['pieces', 'boards', 'effects'];

export default function ShopPage() {
  const { user, profile, refreshProfile } = useUser();
  const { lang, openAuthModal } = useAppStore();
  const t = translations[lang].shop;
  const [activeTab, setActiveTab] = useState('pieces');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function fetchItems() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data, error } = await supabase
          .from("shop_items")
          .select("*")
          .order("price", { ascending: true });

        if (error) throw error;
        setItems(data || []);
      } catch (err: any) {
        console.error('Failed to fetch items:', err.message || err, err);
        showToast(lang === 'RU' ? "Ошибка загрузки товаров" : "Error loading items", 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, []);

  const handleBuy = async (item: any) => {
    if (!user) return openAuthModal();
    if (!profile) return;
    
    if (profile.coins < item.price) {
      showToast(lang === 'RU' ? "Недостаточно монет" : "Not enough coins", 'error');
      return;
    }

    setBuyingId(item.id);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const newUnlocked = [...(profile.unlocked_skins || []), item.skin_key];
      const newCoins = profile.coins - item.price;

      const { error } = await supabase
        .from("profiles")
        .update({ 
          coins: newCoins,
          unlocked_skins: newUnlocked 
        })
        .eq("id", user.id);

      if (error) throw error;
      await refreshProfile?.();
      showToast(lang === 'RU' ? "Скин куплен!" : "Skin purchased!", 'success');
    } catch (err) {
      console.error(err);
      showToast("Error buying item", 'error');
    } finally {
      setBuyingId(null);
    }
  };

  const isUnlocked = (item: any) => {
    if (item.price === 0) return true;
    return profile?.unlocked_skins?.includes(item.skin_key) || 
           item.skin_key === 'default' || 
           item.skin_key === 'board_default' || 
           item.skin_key === 'effect_none';
  };
  const isActive = (skinKey: string) => profile?.active_skin === skinKey || (!profile?.active_skin && (skinKey === 'default' || skinKey === 'board_default' || skinKey === 'effect_none'));

  const handleEquip = async (skinKey: string) => {
    if (!user) return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ active_skin: skinKey })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <TopBar />
      <motion.main 
        className="flex-1 p-8 overflow-y-auto bg-[#F7F6F3] relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 20, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className={`fixed top-0 left-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-bold text-white ${
                toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-20 md:pb-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="text-indigo-600" /> {t.title}
            </h1>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#EBEBEA] shadow-sm font-bold text-amber-600">
               <Coins size={18} /> {profile?.coins ?? 0}
            </div>
          </div>

          {/* Categories */}
          <div className="flex overflow-x-auto gap-2 p-1 bg-gray-100 rounded-xl w-full md:w-fit no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-[12px] md:text-[13px] font-bold transition-all whitespace-nowrap ${
                  activeTab === cat ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
                }`}
              >
                {(t as any)[cat]}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-[200px] md:h-[240px] bg-gray-200 animate-pulse rounded-[14px]" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 mx-2">
              <p className="text-gray-500 font-medium px-4">
                {lang === 'RU' ? "Магазин пока пуст. Пожалуйста, выполните SQL-скрипт." : "Shop is empty. Please run the SQL script."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mx-2 md:mx-0">
              {items.filter(i => i.category === activeTab).map(item => {
                const unlocked = isUnlocked(item);
                const active = isActive(item.skin_key);
                const previewColors = item.preview_colors || ["#ffffff", "#1a1a1a"];
                const c1 = previewColors[0];
                const c2 = previewColors[1] || c1;

                return (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-[14px] border border-[#e5e2dc] p-4 flex flex-col gap-2 transition-all ${
                      active ? "ring-2 ring-[#3a8c5c] border-transparent" : ""
                    }`}
                  >
                    {/* Preview */}
                    <div 
                      className="h-[80px] rounded-[10px] flex items-center justify-center relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                    >
                      <div className="flex items-center">
                        <div className="w-[28px] h-[28px] rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c1 }} />
                        <div className="w-[28px] h-[28px] rounded-full border-2 border-white shadow-sm -ml-2" style={{ backgroundColor: c2 }} />
                      </div>
                    </div>

                    {/* Name & Desc */}
                    <div className="flex flex-col">
                      <span className="text-[14px] font-medium text-[#1a1a1a]">{item.name}</span>
                      <span className="text-[12px] text-[#aaa] line-clamp-1">{item.description}</span>
                    </div>
                    
                    {/* Price & Action */}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center gap-1 text-[13px] font-medium text-[#d4a017]">
                        {item.price > 0 ? (
                          <>
                            <Coins size={14} />
                            {item.price}
                          </>
                        ) : (
                          <span className="text-gray-400">Бесплатно</span>
                        )}
                      </div>

                      {unlocked ? (
                        <button
                          onClick={() => !active && handleEquip(item.skin_key)}
                          className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                            active 
                              ? "bg-[#f0ede8] text-[#3a8c5c] cursor-default" 
                              : "bg-[#f0ede8] text-[#1a1a1a] hover:bg-[#e5e2dc]"
                          }`}
                        >
                          {active ? "Надет ✓" : "Надеть"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={buyingId === item.id}
                          className="px-4 py-1.5 bg-[#1a1a1a] text-white rounded-lg text-[12px] font-bold hover:bg-gray-800 transition-all"
                        >
                          {buyingId === item.id ? "..." : "Купить"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.main>
    </>
  );
}
