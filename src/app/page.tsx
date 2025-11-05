"use client"

import { useMemo, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Calendar,
  AlertCircle,
  ArrowRight,
  Plus,
  Loader2
} from 'lucide-react';
import { categoryConfig } from '@/lib/categoryConfig';
import { Category } from '@/types';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencyUtils';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  
  const {
    transactions,
    budgets,
    savingsGoals,
    reminders,
    getTotalIncome,
    getTotalExpenses,
    getExpensesByCategory,
    getCurrentBudget,
    isLoading,
    currency
  } = useFinance();

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionPending && !session?.user) {
      router.push("/login");
    }
  }, [session, sessionPending, router]);

  // Calculate current month stats
  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const income = getTotalIncome(startOfMonth, endOfMonth);
    const expenses = getTotalExpenses(startOfMonth, endOfMonth);
    const balance = income - expenses;
    
    return { income, expenses, balance };
  }, [transactions, getTotalIncome, getTotalExpenses]);

  // Get expenses by category
  const expensesByCategory = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return getExpensesByCategory(startOfMonth, endOfMonth);
  }, [transactions, getExpensesByCategory]);

  // Get current budget info
  const currentBudget = getCurrentBudget();
  const budgetProgress = currentBudget 
    ? (currentMonthStats.expenses / currentBudget.amount) * 100 
    : 0;
  const isOverBudget = budgetProgress > 100;
  const isNearLimit = budgetProgress >= (currentBudget?.alertThreshold || 80);

  // Get recent transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Get upcoming reminders
  const upcomingReminders = useMemo(() => {
    return reminders
      .filter(r => !r.isCompleted)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
  }, [reminders]);

  // Get top spending categories
  const topCategories = useMemo(() => {
    return Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [expensesByCategory]);

  // Show loading while checking auth or fetching data
  if (sessionPending || isLoading || !session?.user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Navigation />
        <main className="container mx-auto px-4 pt-20 md:pt-24 pb-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formatCurrency = (amount: number) => formatCurrencyUtil(amount, currency);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your spending and stay on budget
            </p>
          </div>
          <Link href="/transactions">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Transaction</span>
            </Button>
          </Link>
        </div>

        {/* Budget Alert */}
        {currentBudget && isNearLimit && (
          <Card className="p-4 mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  {isOverBudget ? 'Budget Exceeded!' : 'Approaching Budget Limit'}
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                  You've spent {formatCurrency(currentMonthStats.expenses)} of your {formatCurrency(currentBudget.amount)} {currentBudget.period} budget 
                  ({budgetProgress.toFixed(0)}%)
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(currentMonthStats.balance)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">This month</p>
                <p className={`text-sm font-semibold ${currentMonthStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {currentMonthStats.balance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(currentMonthStats.balance))}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(currentMonthStats.income)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">This month</p>
                <p className="text-sm font-semibold text-green-600">
                  +{formatCurrency(currentMonthStats.income)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(currentMonthStats.expenses)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">This month</p>
                <p className="text-sm font-semibold text-red-600">
                  -{formatCurrency(currentMonthStats.expenses)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Budget Progress */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Budget Overview</h2>
              <Link href="/budget">
                <Button variant="ghost" size="sm">View Details</Button>
              </Link>
            </div>
            
            {currentBudget ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {currentBudget.period.charAt(0).toUpperCase() + currentBudget.period.slice(1)} Budget
                    </span>
                    <span className="text-sm font-medium">
                      {formatCurrency(currentMonthStats.expenses)} / {formatCurrency(currentBudget.amount)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(budgetProgress, 100)} 
                    className="h-3"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {budgetProgress.toFixed(0)}% of budget used
                  </p>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Remaining</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(Math.max(0, currentBudget.amount - currentMonthStats.expenses))}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No budget set</p>
                <Link href="/budget">
                  <Button>Create Budget</Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Top Spending Categories */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Top Spending Categories</h2>
            
            {topCategories.length > 0 ? (
              <div className="space-y-4">
                {topCategories.map(({ category, amount }) => {
                  const config = categoryConfig[category as keyof typeof categoryConfig];
                  const Icon = config.icon;
                  const percentage = currentMonthStats.expenses > 0 
                    ? (amount / currentMonthStats.expenses) * 100 
                    : 0;
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(amount)}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No expenses yet</p>
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
              <Link href="/transactions">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => {
                  const config = categoryConfig[transaction.category];
                  const Icon = config.icon;
                  
                  return (
                    <div key={transaction.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No transactions yet</p>
              </div>
            )}
          </Card>

          {/* Savings Goals & Reminders */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Overview</h2>
            
            <div className="space-y-6">
              {/* Savings Goals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Savings Goals</h3>
                  <Link href="/budget">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">Manage</Button>
                  </Link>
                </div>
                
                {savingsGoals.length > 0 ? (
                  <div className="space-y-3">
                    {savingsGoals.slice(0, 2).map((goal) => {
                      const progress = (goal.currentAmount / goal.targetAmount) * 100;
                      
                      return (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{goal.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No savings goals yet</p>
                )}
              </div>

              {/* Upcoming Reminders */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Upcoming Reminders</h3>
                  <Link href="/reminders">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">View All</Button>
                  </Link>
                </div>
                
                {upcomingReminders.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingReminders.map((reminder) => (
                      <div key={reminder.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                        <Calendar className="h-4 w-4 text-primary mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{reminder.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(reminder.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming reminders</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}