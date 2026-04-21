import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Locale, UiKey, localeOptions, t as translate } from '../lib/i18n';

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: UiKey) => string;
  localeOptions: typeof localeOptions;
};

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  const t = useCallback((key: UiKey) => translate(locale, key), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t, localeOptions }),
    [locale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
