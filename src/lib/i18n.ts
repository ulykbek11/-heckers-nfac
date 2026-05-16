import ru from './locales/ru.json';
import en from './locales/en.json';

export const translations = {
  RU: ru,
  EN: en
} as const;

export type TranslationType = typeof ru;
export type LangType = 'RU' | 'EN';

