import { localizeDigits, type NumeralScript } from '@/math/numerals';
import { en, type StringKey } from './en';
import { ne } from './ne';

export type Language = 'en' | 'ne';
export type { StringKey };

const TABLES: Record<Language, Record<StringKey, string>> = { en, ne };

export type TranslateParams = Record<string, string | number>;

export function translate(lang: Language, key: StringKey, params?: TranslateParams): string {
  const template = TABLES[lang][key] ?? en[key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export interface Translator {
  lang: Language;
  numerals: NumeralScript;
  t: (key: StringKey, params?: TranslateParams) => string;
  /** Localise digits in already-formatted text. */
  n: (text: string) => string;
}

export function createTranslator(lang: Language, numerals: NumeralScript): Translator {
  return {
    lang,
    numerals,
    t: (key, params) => translate(lang, key, params),
    n: (text) => localizeDigits(text, numerals),
  };
}
