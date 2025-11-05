"use client"

import { useState, useEffect } from 'react';

export type Currency = {
  code: string;
  symbol: string;
  name: string;
};

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
];

// Location-based currency defaults
const LOCATION_CURRENCY_MAP: Record<string, string> = {
  'US': 'USD',
  'GB': 'GBP',
  'EU': 'EUR',
  'JP': 'JPY',
  'CA': 'CAD',
  'AU': 'AUD',
  'CH': 'CHF',
  'CN': 'CNY',
  'IN': 'INR',
  'NG': 'NGN',
  'MX': 'MXN',
  'BR': 'BRL',
  'ZA': 'ZAR',
  'SG': 'SGD',
  'NZ': 'NZD',
  'KR': 'KRW',
};

export function useCurrency() {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get saved currency from localStorage
    const saved = localStorage.getItem('budget-buddy-currency');
    
    if (saved) {
      const savedCurrency = CURRENCIES.find(c => c.code === saved);
      if (savedCurrency) {
        setCurrencyState(savedCurrency);
        setIsLoading(false);
        return;
      }
    }

    // Try to detect location and set default currency
    detectLocationCurrency();
  }, []);

  const detectLocationCurrency = async () => {
    try {
      // Try to get timezone-based location
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Map common timezones to countries
      const timezoneMap: Record<string, string> = {
        'America/New_York': 'US',
        'America/Los_Angeles': 'US',
        'America/Chicago': 'US',
        'Europe/London': 'GB',
        'Europe/Paris': 'EU',
        'Europe/Berlin': 'EU',
        'Asia/Tokyo': 'JP',
        'America/Toronto': 'CA',
        'Australia/Sydney': 'AU',
        'Europe/Zurich': 'CH',
        'Asia/Shanghai': 'CN',
        'Asia/Kolkata': 'IN',
        'Africa/Lagos': 'NG',
        'America/Mexico_City': 'MX',
        'America/Sao_Paulo': 'BR',
        'Africa/Johannesburg': 'ZA',
        'Asia/Singapore': 'SG',
        'Pacific/Auckland': 'NZ',
        'Asia/Seoul': 'KR',
      };

      const countryCode = timezoneMap[timezone];
      const currencyCode = countryCode ? LOCATION_CURRENCY_MAP[countryCode] : 'USD';
      const detectedCurrency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
      
      setCurrencyState(detectedCurrency);
    } catch (error) {
      // Fallback to USD if detection fails
      setCurrencyState(CURRENCIES[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrency = (currencyCode: string) => {
    const newCurrency = CURRENCIES.find(c => c.code === currencyCode);
    if (newCurrency) {
      setCurrencyState(newCurrency);
      localStorage.setItem('budget-buddy-currency', currencyCode);
    }
  };

  const formatAmount = (amount: number) => {
    return `${currency.symbol}${amount.toFixed(2)}`;
  };

  return {
    currency,
    setCurrency,
    formatAmount,
    isLoading,
    availableCurrencies: CURRENCIES,
  };
}