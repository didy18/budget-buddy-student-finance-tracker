"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, Budget, SavingsGoal, Reminder, FinanceData, Category, BudgetPeriod } from '@/types';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  reminders: Reminder[];
  isLoading: boolean;
  currency: string;
  
  // Transaction methods
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Budget methods
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getCurrentBudget: () => Budget | null;
  
  // Savings goal methods
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => Promise<void>;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  
  // Reminder methods
  addReminder: (reminder: Omit<Reminder, 'id'>) => Promise<void>;
  updateReminder: (id: string, reminder: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  
  // Utility methods
  getTotalIncome: (startDate?: Date, endDate?: Date) => number;
  getTotalExpenses: (startDate?: Date, endDate?: Date) => number;
  getExpensesByCategory: (startDate?: Date, endDate?: Date) => Record<Category, number>;
  exportData: () => void;
  importData: (jsonString: string) => boolean;
  clearAllData: () => void;
  refetch: () => Promise<void>;
  updateCurrency: (currency: string) => Promise<void>;
  checkBudgetAlerts: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const [data, setData] = useState<FinanceData>({
    transactions: [],
    budgets: [],
    savingsGoals: [],
    reminders: [],
  });
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }, []);

  // Check budget alerts
  const checkBudgetAlerts = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const currentBudget = getCurrentBudget();
      if (!currentBudget) return;

      // Send alert notification
      await fetch('/api/notifications/budget-alert', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: session.user.id,
          budgetId: currentBudget.id,
        }),
      });
    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  }, [session, getAuthHeaders]);

  // Fetch user preferences and all data from API
  const fetchAllData = useCallback(async () => {
    if (sessionPending || !session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userId = session.user.id;

      // Fetch user preferences first
      const prefsRes = await fetch(`/api/user-preferences?userId=${userId}`, {
        headers: getAuthHeaders()
      });
      
      if (prefsRes.ok) {
        const prefs = await prefsRes.json();
        setCurrency(prefs.currency || 'USD');
      } else {
        // Create default preferences if they don't exist
        await fetch('/api/user-preferences', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ userId, currency: 'USD' })
        });
        setCurrency('USD');
      }

      // Fetch all finance data
      const [transactionsRes, budgetsRes, goalsRes, remindersRes] = await Promise.all([
        fetch(`/api/transactions?userId=${userId}&limit=1000`, { headers: getAuthHeaders() }),
        fetch(`/api/budgets?userId=${userId}&limit=100`, { headers: getAuthHeaders() }),
        fetch(`/api/savings-goals?userId=${userId}&limit=100`, { headers: getAuthHeaders() }),
        fetch(`/api/reminders?userId=${userId}&limit=1000`, { headers: getAuthHeaders() })
      ]);

      const [transactions, budgets, savingsGoals, reminders] = await Promise.all([
        transactionsRes.json(),
        budgetsRes.json(),
        goalsRes.json(),
        remindersRes.json()
      ]);

      setData({
        transactions: transactions.map((t: any) => ({
          id: t.id.toString(),
          type: t.type,
          amount: t.amount,
          category: t.category,
          description: t.description,
          date: t.date,
          createdAt: t.createdAt
        })),
        budgets: budgets.map((b: any) => ({
          id: b.id.toString(),
          period: b.period,
          amount: b.amount,
          startDate: b.startDate,
          categoryLimits: b.categoryLimits,
          alertThreshold: b.alertThreshold
        })),
        savingsGoals: savingsGoals.map((g: any) => ({
          id: g.id.toString(),
          name: g.name,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          deadline: g.deadline,
          description: g.description,
          createdAt: g.createdAt
        })),
        reminders: reminders.map((r: any) => ({
          id: r.id.toString(),
          title: r.title,
          description: r.description,
          dueDate: r.dueDate,
          isCompleted: r.isCompleted,
          category: r.category
        }))
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session, sessionPending, getAuthHeaders]);

  // Load data on mount and when session changes
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const updateCurrency = useCallback(async (newCurrency: string) => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          userId: session.user.id, 
          currency: newCurrency 
        })
      });

      if (res.ok) {
        setCurrency(newCurrency);
      }
    } catch (error) {
      console.error('Error updating currency:', error);
      throw error;
    }
  }, [session, getAuthHeaders]);

  // Transaction methods
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...transaction, userId: session.user.id })
      });

      if (!res.ok) throw new Error('Failed to add transaction');

      const newTransaction = await res.json();
      setData(prev => ({
        ...prev,
        transactions: [...prev.transactions, {
          id: newTransaction.id.toString(),
          type: newTransaction.type,
          amount: newTransaction.amount,
          category: newTransaction.category,
          description: newTransaction.description,
          date: newTransaction.date,
          createdAt: newTransaction.createdAt
        }]
      }));

      // Check budget alerts after adding expense
      if (transaction.type === 'expense') {
        await checkBudgetAlerts();
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }, [session, getAuthHeaders, checkBudgetAlerts]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const res = await fetch(`/api/transactions?id=${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...updates, userId: session.user.id })
      });

      if (!res.ok) throw new Error('Failed to update transaction');

      const updated = await res.json();
      setData(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => 
          t.id === id ? {
            id: updated.id.toString(),
            type: updated.type,
            amount: updated.amount,
            category: updated.category,
            description: updated.description,
            date: updated.date,
            createdAt: updated.createdAt
          } : t
        )
      }));

      // Check budget alerts after updating expense
      if (updated.type === 'expense') {
        await checkBudgetAlerts();
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }, [session, getAuthHeaders, checkBudgetAlerts]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const res = await fetch(`/api/transactions?id=${id}&userId=${session.user.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error('Failed to delete transaction');

      setData(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }, [session, getAuthHeaders]);

  // Budget methods
  const addBudget = useCallback(async (budget: Omit<Budget, 'id'>) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...budget, userId: session.user.id })
      });

      if (!res.ok) throw new Error('Failed to add budget');

      const newBudget = await res.json();
      setData(prev => ({
        ...prev,
        budgets: [...prev.budgets, {
          id: newBudget.id.toString(),
          period: newBudget.period,
          amount: newBudget.amount,
          startDate: newBudget.startDate,
          categoryLimits: newBudget.categoryLimits,
          alertThreshold: newBudget.alertThreshold
        }]
      }));
    } catch (error) {
      console.error('Error adding budget:', error);
      throw error;
    }
  }, [session, getAuthHeaders]);

  const updateBudget = useCallback(async (id: string, updates: Partial<Budget>) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const res = await fetch(`/api/budgets?id=${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...updates, userId: session.user.id })
      });

      if (!res.ok) throw new Error('Failed to update budget');

      const updated = await res.json();
      setData(prev => ({
        ...prev,
        budgets: prev.budgets.map(b => 
          b.id === id ? {
            id: updated.id.toString(),
            period: updated.period,
            amount: updated.amount,
            startDate: updated.startDate,
            categoryLimits: updated.categoryLimits,
            alertThreshold: updated.alertThreshold
          } : b
        )
      }));
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }, [session, getAuthHeaders]);

  const deleteBudget = useCallback(async (id: string) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const res = await fetch(`/api/budgets?id=${id}&userId=${session.user.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error('Failed to delete budget');

      setData(prev => ({
        ...prev,
        budgets: prev.budgets.filter(b => b.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }, [session, getAuthHeaders]);

  const getCurrentBudget = useCallback((): Budget | null => {
    const now = new Date();
    
    const activeBudget = data.budgets
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .find(budget => {
        const startDate = new Date(budget.startDate);
        const endDate = new Date(startDate);
        
        if (budget.period === 'weekly') {
          endDate.setDate(endDate.getDate() + 7);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }
        
        return now >= startDate && now <= endDate;
      });
    
    return activeBudget || null;
  }, [data.budgets]);

  // Savings goal methods
  const addSavingsGoal = useCallback(async (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const res = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...goal, userId: session.user.id })
      });

      if (!res.ok) throw new Error('Failed to add savings goal');

      const newGoal = await res.json();
      setData(prev => ({
        ...prev,
        savingsGoals: [...prev.savingsGoals, {
          id: newGoal.id.toString(),
          name: newGoal.name,
          targetAmount: newGoal.targetAmount,
          currentAmount: newGoal.currentAmount,
          deadline: newGoal.deadline,
          description: newGoal.description,
          createdAt: newGoal.createdAt
        }]
      }));
    } catch (error) {
      console.error('Error adding savings goal:', error);
      throw error;
    }
  }, [session, getAuthHeaders]);

  const updateSavingsGoal = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const res = await fetch(`/api/savings-goals?id=${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...updates, userId: session.user.id })
      });

      if (!res.ok) throw new Error('Failed to update savings goal');

      const updated = await res.json();
      setData(prev => ({
        ...prev,
        savingsGoals: prev.savingsGoals.map(g => 
          g.id === id ? {
            id: updated.id.toString(),
            name: updated.name,
            targetAmount: updated.targetAmount,
            currentAmount: updated.currentAmount,
            deadline: updated.deadline,
            description: updated.description,
            createdAt: updated.createdAt
          } : g
        )
      }));
    } catch (error) {
      console.error('Error updating savings goal:', error);
      throw error;
    }
  }, [session, getAuthHeaders]);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const res = await fetch(`/api/savings-goals?id=${id}&userId=${session.user.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error('Failed to delete savings goal');

      setData(prev => ({
        ...prev,
        savingsGoals: prev.savingsGoals.filter(g => g.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting savings goal:', error);
      throw error;
    }
  }, [session, getAuthHeaders]);

  // Reminder methods
  const addReminder = useCallback(async (reminder: Omit<Reminder, 'id'>) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...reminder, userId: session.user.id })
      });

      if (!res.ok) throw new Error('Failed to add reminder');

      const newReminder = await res.json();
      setData(prev => ({
        ...prev,
        reminders: [...prev.reminders, {
          id: newReminder.id.toString(),
          title: newReminder.title,
          description: newReminder.description,
          dueDate: newReminder.dueDate,
          isCompleted: newReminder.isCompleted,
          category: newReminder.category
        }]
      }));
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }, [session, getAuthHeaders]);

  const updateReminder = useCallback(async (id: string, updates: Partial<Reminder>) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const res = await fetch(`/api/reminders?id=${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...updates, userId: session.user.id })
      });

      if (!res.ok) throw new Error('Failed to update reminder');

      const updated = await res.json();
      setData(prev => ({
        ...prev,
        reminders: prev.reminders.map(r => 
          r.id === id ? {
            id: updated.id.toString(),
            title: updated.title,
            description: updated.description,
            dueDate: updated.dueDate,
            isCompleted: updated.isCompleted,
            category: updated.category
          } : r
        )
      }));
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }, [session, getAuthHeaders]);

  const deleteReminder = useCallback(async (id: string) => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    try {
      const res = await fetch(`/api/reminders?id=${id}&userId=${session.user.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error('Failed to delete reminder');

      setData(prev => ({
        ...prev,
        reminders: prev.reminders.filter(r => r.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }, [session, getAuthHeaders]);

  // Utility methods
  const getTotalIncome = useCallback((startDate?: Date, endDate?: Date): number => {
    return data.transactions
      .filter(t => {
        if (t.type !== 'income') return false;
        const tDate = new Date(t.date);
        if (startDate && tDate < startDate) return false;
        if (endDate && tDate > endDate) return false;
        return true;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [data.transactions]);

  const getTotalExpenses = useCallback((startDate?: Date, endDate?: Date): number => {
    return data.transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const tDate = new Date(t.date);
        if (startDate && tDate < startDate) return false;
        if (endDate && tDate > endDate) return false;
        return true;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [data.transactions]);

  const getExpensesByCategory = useCallback((startDate?: Date, endDate?: Date): Record<Category, number> => {
    const expenses: Partial<Record<Category, number>> = {};
    
    data.transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const tDate = new Date(t.date);
        if (startDate && tDate < startDate) return false;
        if (endDate && tDate > endDate) return false;
        return true;
      })
      .forEach(t => {
        expenses[t.category] = (expenses[t.category] || 0) + t.amount;
      });
    
    return expenses as Record<Category, number>;
  }, [data.transactions]);

  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-buddy-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importData = useCallback((jsonString: string): boolean => {
    try {
      const imported = JSON.parse(jsonString);
      console.warn('Import functionality requires backend implementation');
      return false;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }, []);

  const clearAllData = useCallback(() => {
    console.warn('Clear all data functionality requires backend implementation');
  }, []);

  const value: FinanceContextType = {
    transactions: data.transactions,
    budgets: data.budgets,
    savingsGoals: data.savingsGoals,
    reminders: data.reminders,
    isLoading,
    currency,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    getCurrentBudget,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addReminder,
    updateReminder,
    deleteReminder,
    getTotalIncome,
    getTotalExpenses,
    getExpensesByCategory,
    exportData,
    importData,
    clearAllData,
    refetch: fetchAllData,
    updateCurrency,
    checkBudgetAlerts,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
};