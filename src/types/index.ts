export type TransactionType = 'income' | 'expense';

export type Category = 
  | 'food'
  | 'transport'
  | 'academic'
  | 'entertainment'
  | 'shopping'
  | 'utilities'
  | 'health'
  | 'housing'
  | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO string
  createdAt: string;
}

export type BudgetPeriod = 'weekly' | 'monthly';

export interface Budget {
  id: string;
  period: BudgetPeriod;
  amount: number;
  startDate: string;
  categoryLimits?: Partial<Record<Category, number>>;
  alertThreshold: number; // percentage (e.g., 80 for 80%)
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  description?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  category?: Category;
}

export interface FinanceData {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  reminders: Reminder[];
}
