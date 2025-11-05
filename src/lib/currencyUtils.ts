export const CURRENCY_MAP: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  NGN: '₦',
  CHF: 'CHF',
  NZD: 'NZ$',
  SGD: 'S$',
  HKD: 'HK$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  MXN: 'MX$',
  BRL: 'R$',
  ZAR: 'R',
  RUB: '₽',
  KRW: '₩',
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_MAP[currencyCode] || currencyCode;
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toFixed(2)}`;
};
