import { FinanceData } from '@/types';

const STORAGE_KEY = 'budget_buddy_data';

const defaultData: FinanceData = {
  transactions: [],
  budgets: [],
  savingsGoals: [],
  reminders: [],
};

export const storage = {
  // Load all data from localStorage
  loadData: (): FinanceData => {
    if (typeof window === 'undefined') return defaultData;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return defaultData;
      
      const data = JSON.parse(stored);
      return {
        transactions: data.transactions || [],
        budgets: data.budgets || [],
        savingsGoals: data.savingsGoals || [],
        reminders: data.reminders || [],
      };
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      return defaultData;
    }
  },

  // Save all data to localStorage
  saveData: (data: FinanceData): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  },

  // Export data as JSON
  exportData: (): string => {
    const data = storage.loadData();
    return JSON.stringify(data, null, 2);
  },

  // Import data from JSON string
  importData: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      
      // Validate data structure
      if (!data.transactions || !Array.isArray(data.transactions)) {
        throw new Error('Invalid data format');
      }
      
      storage.saveData(data);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },

  // Clear all data
  clearData: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },
};
