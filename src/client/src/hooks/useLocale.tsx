import { createContext, useContext, useState, type ReactNode } from "react";
import { zhCN, en, type Locale } from "../lib/locales";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

function lookup(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let value: unknown = obj;
  for (const part of parts) {
    if (value && typeof value === "object" && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof value === "string" ? value : undefined;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh-CN");

  const t = (key: string): string => {
    const dict = locale === "en" ? en : zhCN;
    return lookup(dict, key) ?? key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
