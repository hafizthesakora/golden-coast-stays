"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Currency = "GHS" | "USD" | "GBP";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convert: (ghs: number) => number;
  symbol: string;
  format: (ghs: number) => string;
}

// Approximate rates relative to GHS (update as needed)
const RATES: Record<Currency, number> = {
  GHS: 1,
  USD: 1 / 15.5,  // ~15.5 GHS per USD
  GBP: 1 / 19.5,  // ~19.5 GHS per GBP
};

const SYMBOLS: Record<Currency, string> = {
  GHS: "GH₵",
  USD: "$",
  GBP: "£",
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "GHS",
  setCurrency: () => {},
  convert: (v) => v,
  symbol: "GH₵",
  format: (v) => `GH₵${v.toLocaleString()}`,
});

function detectCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.startsWith("Africa")) return "GHS";
    const locale = navigator.language || "";
    if (locale.startsWith("en-GB") || locale.startsWith("en-IE")) return "GBP";
    return "USD";
  } catch {
    return "GHS";
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(detectCurrency);

  const convert = (ghs: number) => {
    const rate = RATES[currency];
    return Math.round(ghs * rate * 100) / 100;
  };

  const symbol = SYMBOLS[currency];

  const format = (ghs: number): string => {
    const amount = convert(ghs);
    if (currency === "GHS") {
      return `GH₵${amount.toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, symbol, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
