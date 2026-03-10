// contexts/LanguageContext.tsx - Global Language Provider
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { LanguageCode, TranslationObject } from '../i18n';
import {
    DEFAULT_LANGUAGE,
    getStoredLanguage,
    setStoredLanguage,
    getTranslations,
    SUPPORTED_LANGUAGES,
} from '../i18n';
import en from '../i18n/en.json';

// Type for the translation object
type Translations = TranslationObject;

// Context interface
interface LanguageContextType {
    lang: LanguageCode;
    t: Translations;
    setLanguage: (code: LanguageCode) => void;
    isLanguageSelected: boolean;
    supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
    lang: DEFAULT_LANGUAGE,
    t: en,
    setLanguage: () => { },
    isLanguageSelected: false,
    supportedLanguages: SUPPORTED_LANGUAGES,
});

// Provider props
interface LanguageProviderProps {
    children: ReactNode;
}

/**
 * LanguageProvider - Wraps the app and provides global language state
 * 
 * Features:
 * - Persists language choice in localStorage
 * - Auto-loads saved language on app start
 * - Provides translations for the selected language
 * - Tracks if user has selected a language (for initial selection screen)
 */
export function LanguageProvider({ children }: LanguageProviderProps) {
    // Initialize from localStorage or use default
    const [lang, setLang] = useState<LanguageCode>(() => {
        const stored = getStoredLanguage();
        return stored || DEFAULT_LANGUAGE;
    });

    // Track if user has explicitly selected a language
    const [isLanguageSelected, setIsLanguageSelected] = useState<boolean>(() => {
        return getStoredLanguage() !== null;
    });

    // Get translations for current language
    const t = getTranslations(lang);

    // Handle language change
    const setLanguage = useCallback((code: LanguageCode) => {
        setLang(code);
        setStoredLanguage(code);
        setIsLanguageSelected(true);

        // Update document lang attribute for accessibility
        document.documentElement.lang = code;

        console.log(`🌐 Language changed to: ${code}`);
    }, []);

    // On mount, check for stored language and set document lang
    useEffect(() => {
        document.documentElement.lang = lang;

        // Check if we have a stored language
        const stored = getStoredLanguage();
        if (stored) {
            setIsLanguageSelected(true);
        }
    }, [lang]);

    const value: LanguageContextType = {
        lang,
        t,
        setLanguage,
        isLanguageSelected,
        supportedLanguages: SUPPORTED_LANGUAGES,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

/**
 * Hook to use language context
 */
export function useLanguage(): LanguageContextType {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

/**
 * Hook to get just the translation function
 */
export function useTranslation(): Translations {
    const { t } = useLanguage();
    return t;
}

export default LanguageContext;
