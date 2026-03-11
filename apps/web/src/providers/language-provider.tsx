"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries, t, type MessageKey } from "@turno/i18n";
import type { Language } from "@turno/types";

const STORAGE_KEY = "turno-language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (value: Language) => void;
  translate: (key: MessageKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("zh-CN");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && saved in dictionaries) {
      setLanguageState(saved);
      return;
    }
    const browserLanguage = navigator.language === "en-US" ? "en-US" : "zh-CN";
    setLanguageState(browserLanguage);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: Language) => {
        setLanguageState(nextLanguage);
        window.localStorage.setItem(STORAGE_KEY, nextLanguage);
      },
      translate: (key: MessageKey) => t(language, key),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
