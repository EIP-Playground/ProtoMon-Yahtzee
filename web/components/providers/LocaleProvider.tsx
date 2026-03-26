"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  MESSAGES,
  resolveLocale,
  type AppMessages,
  type Locale,
} from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: Locale;
  messages: AppMessages;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  messages: MESSAGES[DEFAULT_LOCALE],
  setLocale: () => {},
});

type LocaleProviderProps = {
  children: ReactNode;
};

function getBrowserPreferredLocale() {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const stored = resolveLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));

  if (stored) {
    return stored;
  }

  const candidates = [window.navigator.language, ...window.navigator.languages];

  for (const candidate of candidates) {
    const resolved = resolveLocale(candidate);

    if (resolved) {
      return resolved;
    }
  }

  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const preferredLocale = getBrowserPreferredLocale();

    if (preferredLocale === DEFAULT_LOCALE) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setLocale(preferredLocale);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      messages: MESSAGES[locale],
      setLocale,
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
