/**
 * Account-wide currency helpers.
 *
 * The chosen currency code is stored on the user profile (see UserProfile.currency)
 * and surfaced through AuthContext as `user.currency`. Amounts are formatted with a
 * leading symbol for consistency across the app.
 */

export interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "KES", label: "Kenyan Shilling", symbol: "KSh" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "NGN", label: "Nigerian Naira", symbol: "₦" },
  { code: "ZAR", label: "South African Rand", symbol: "R" },
  { code: "TZS", label: "Tanzanian Shilling", symbol: "TSh" },
  { code: "UGX", label: "Ugandan Shilling", symbol: "USh" },
  { code: "GHS", label: "Ghanaian Cedi", symbol: "₵" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "AED", label: "UAE Dirham", symbol: "AED" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
];

export const DEFAULT_CURRENCY = "KES";

const SYMBOL_BY_CODE: Record<string, string> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c.symbol])
);

/** Return the display symbol for a currency code (falls back to the code itself). */
export function currencySymbol(code?: string | null): string {
  if (!code) return SYMBOL_BY_CODE[DEFAULT_CURRENCY];
  return SYMBOL_BY_CODE[code] ?? code;
}

/**
 * Format an amount with the account's currency symbol, e.g. `formatCurrency(1200, "USD")`
 * → "$1,200". Whole numbers only (matches the app's existing formatting).
 */
export function formatCurrency(amount: number, code?: string | null): string {
  const symbol = currencySymbol(code);
  const value = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(isFinite(amount) ? amount : 0);
  // Symbols that are short alphabetic codes read better with a trailing space.
  const sep = /[A-Za-z]$/.test(symbol) ? " " : "";
  return `${symbol}${sep}${value}`;
}
