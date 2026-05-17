import { create } from 'zustand';

type Lang = 'RU' | 'EN';

export interface ConfirmModalData {
  title: string;
  message: string;
  onConfirm: () => void;
}

interface AppState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  topBarTitle: string;
  setTopBarTitle: (title: string) => void;
  confirmModal: ConfirmModalData | null;
  showConfirmModal: (data: ConfirmModalData) => void;
  closeConfirmModal: () => void;
  activeGameResignFn: (() => Promise<void>) | null;
  setActiveGameResignFn: (fn: (() => Promise<void>) | null) => void;
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
  confirmModal: null,
  showConfirmModal: (data) => set({ confirmModal: data }),
  closeConfirmModal: () => set({ confirmModal: null }),
  activeGameResignFn: null,
  setActiveGameResignFn: (fn) => set({ activeGameResignFn: fn }),
}));
