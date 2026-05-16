import { create } from 'zustand';

type Lang = 'RU' | 'EN';

interface AppState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  topBarTitle: string;
  setTopBarTitle: (title: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  lang: 'RU',
  setLang: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang);
    }
    set({ lang });
  },
  isAuthModalOpen: false,
  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  topBarTitle: '',
  setTopBarTitle: (topBarTitle) => set({ topBarTitle }),
}));
