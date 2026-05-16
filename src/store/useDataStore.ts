import { create } from 'zustand';

interface DataState {
  stats: any | null;
  history: any[] | null;
  shopItems: any[] | null;
  lastFetched: {
    stats: number;
    history: number;
    shopItems: number;
  };
  setStats: (stats: any) => void;
  setHistory: (history: any[]) => void;
  setShopItems: (items: any[]) => void;
  clearCache: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  stats: null,
  history: null,
  shopItems: null,
  lastFetched: {
    stats: 0,
    history: 0,
    shopItems: 0,
  },
  setStats: (stats) => set((state) => ({ 
    stats, 
    lastFetched: { ...state.lastFetched, stats: Date.now() } 
  })),
  setHistory: (history) => set((state) => ({ 
    history, 
    lastFetched: { ...state.lastFetched, history: Date.now() } 
  })),
  setShopItems: (shopItems) => set((state) => ({ 
    shopItems, 
    lastFetched: { ...state.lastFetched, shopItems: Date.now() } 
  })),
  clearCache: () => set({ 
    stats: null, 
    history: null, 
    shopItems: null, 
    lastFetched: { stats: 0, history: 0, shopItems: 0 } 
  }),
}));
