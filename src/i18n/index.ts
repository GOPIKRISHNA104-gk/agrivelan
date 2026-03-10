// i18n/index.ts - Global Language System for AgriVelan
import en from './en.json';
import ta from './ta.json';
import te from './te.json';
import ml from './ml.json';
import kn from './kn.json';
import hi from './hi.json';

// Supported languages configuration
export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
] as const;

export type LanguageCode = 'en' | 'ta' | 'te' | 'ml' | 'kn' | 'hi';
export type TranslationKeys = keyof typeof en;
export type TranslationObject = typeof en;

// All translations mapped by language code
// Using TranslationObject type to allow for partial translations
export const translations: Record<LanguageCode, any> = {
    en,
    ta,
    te,
    ml,
    kn,
    hi,
};

// localStorage key for persistence
export const STORAGE_KEY = 'app_language';

// Default language
export const DEFAULT_LANGUAGE: LanguageCode = 'en';

/**
 * Get stored language from localStorage
 */
export function getStoredLanguage(): LanguageCode | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && isValidLanguage(stored)) {
            return stored as LanguageCode;
        }
    } catch {
        console.error('Failed to read language from localStorage');
    }
    return null;
}

/**
 * Store language in localStorage
 */
export function setStoredLanguage(lang: LanguageCode): void {
    try {
        localStorage.setItem(STORAGE_KEY, lang);
    } catch {
        console.error('Failed to save language to localStorage');
    }
}

/**
 * Check if a language code is valid
 */
export function isValidLanguage(code: string): code is LanguageCode {
    return SUPPORTED_LANGUAGES.some(l => l.code === code);
}

/**
 * Get translation for a key in the specified language
 */
export function getTranslation(lang: LanguageCode, key: TranslationKeys): string {
    const t = translations[lang];
    if (t && key in t) {
        return t[key] as string;
    }
    // Log error but do NOT fall back to English
    console.error(`Missing translation key "${key}" for language "${lang}"`);
    return `[${key}]`;
}

/**
 * Get all translations for a language
 */
export function getTranslations(lang: LanguageCode): TranslationObject {
    return translations[lang] || translations[DEFAULT_LANGUAGE];
}

export default translations;
