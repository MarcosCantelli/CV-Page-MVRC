import { getRelativeLocaleUrl } from 'astro:i18n';
import type { Locale } from '../content/types';
import { cv as cvPt } from '../content/cv.pt';
import { cv as cvEn } from '../content/cv.en';
import { ui } from '../content/ui';

export const locales: Locale[] = ['pt', 'en'];
export const htmlLang: Record<Locale, string> = { pt: 'pt-BR', en: 'en-US' };
export const ogLocale: Record<Locale, string> = { pt: 'pt_BR', en: 'en_US' };

const cvs = { pt: cvPt, en: cvEn };

export function getLocale(current: string | undefined): Locale {
  return current === 'en' ? 'en' : 'pt';
}

export function getContent(locale: Locale) {
  return { cv: cvs[locale], t: ui[locale] };
}

export function localeHome(locale: Locale): string {
  return getRelativeLocaleUrl(locale, '');
}

/** Prefix a path inside public/ with the configured base path. */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

export const cvPdf: Record<Locale, string> = {
  pt: 'cv/Marcos_Cantelli_CV_PT.pdf',
  en: 'cv/Marcos_Cantelli_CV_EN.pdf',
};
