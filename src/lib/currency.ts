/**
 * Currency Utilities — Multi-currency display and conversion for expenses.
 * Uses static rates with support for future API integration.
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$',  name: 'US Dollar',        flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€',  name: 'Euro',             flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£',  name: 'British Pound',    flag: '🇬🇧' },
  JPY: { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',     flag: '🇯🇵' },
  ARS: { code: 'ARS', symbol: '$',  name: 'Argentine Peso',   flag: '🇦🇷' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real',   flag: '🇧🇷' },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc',      flag: '🇨🇭' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar',  flag: '🇨🇦' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  MXN: { code: 'MXN', symbol: '$',  name: 'Mexican Peso',     flag: '🇲🇽' },
  CLP: { code: 'CLP', symbol: '$',  name: 'Chilean Peso',     flag: '🇨🇱' },
  COP: { code: 'COP', symbol: '$',  name: 'Colombian Peso',   flag: '🇨🇴' },
};

// Static exchange rates to USD (for offline/demo mode)
// In production, replace with real-time API integration
const RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0067,
  ARS: 0.0010,
  BRL: 0.20,
  CHF: 1.12,
  CAD: 0.74,
  AUD: 0.65,
  MXN: 0.059,
  CLP: 0.0011,
  COP: 0.00025,
};

/**
 * Convert an amount from one currency to another.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  customRate?: number
): number {
  if (fromCurrency === toCurrency) return amount;
  
  if (customRate) {
    return amount * customRate;
  }

  const fromRate = RATES_TO_USD[fromCurrency] ?? 1;
  const toRate = RATES_TO_USD[toCurrency] ?? 1;
  
  // Convert to USD first, then to target
  const usdAmount = amount * fromRate;
  return usdAmount / toRate;
}

/**
 * Format a monetary amount with proper currency display.
 */
export function formatMoney(
  amount: number,
  currencyCode: string,
  options?: { compact?: boolean; showCode?: boolean }
): string {
  const info = CURRENCIES[currencyCode];
  const symbol = info?.symbol ?? currencyCode;
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currencyCode === 'JPY' || currencyCode === 'CLP' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'JPY' || currencyCode === 'CLP' ? 0 : 2,
    ...(options?.compact ? { notation: 'compact' } : {}),
  }).format(amount);

  if (options?.showCode) {
    return `${symbol}${formatted} ${currencyCode}`;
  }
  return `${symbol}${formatted}`;
}

/**
 * Calculate each participant's share for a split expense.
 */
export function calculateSplit(
  totalAmount: number,
  participantCount: number
): number {
  if (participantCount <= 0) return totalAmount;
  return Math.round((totalAmount / participantCount) * 100) / 100;
}

/**
 * Get all supported currency codes.
 */
export function getCurrencyList(): CurrencyInfo[] {
  return Object.values(CURRENCIES);
}
