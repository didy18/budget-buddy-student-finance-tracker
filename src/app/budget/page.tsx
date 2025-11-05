"use client"

import { useState, useMemo, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Circle,
  Loader2
} from 'lucide-react';
import { categoryConfig } from '@/lib/categoryConfig';
import { Budget, SavingsGoal, BudgetPeriod, Category } from '@/types';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencyUtils';

export default function BudgetPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  
  const {
    budgets,
    savingsGoals,
    addBudget,
    updateBudget,
    deleteBudget,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    getCurrentBudget,
    getTotalExpenses,
    getExpensesByCategory,
    isLoading,
    currency
  } = useFinance();

  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Budget form state
  const [budgetForm, setBudgetForm] = useState({
    period: 'monthly' as BudgetPeriod,
    amount: '',
    startDate: new Date().toISOString().split('T')[0],
    alertThreshold: '80',
  });

  // Goal form state
  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    description: '',
  });

  const resetBudgetForm = () => {
    setBudgetForm({
      period: 'monthly',
      amount: '',
      startDate: new Date().toISOString().split('T')[0],
      alertThreshold: '80',
    });
    setEditingBudget(null);
  };

  const resetGoalForm = () => {
    setGoalForm({
      name: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      description: '',
    });
    setEditingGoal(null);
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!budgetForm.amount) {
      toast.error('Please enter a budget amount');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          period: budgetForm.period,
          amount: parseFloat(budgetForm.amount),
          startDate: budgetForm.startDate,
          alertThreshold: parseFloat(budgetForm.alertThreshold),
        });
        toast.success('Budget updated successfully');
      } else {
        await addBudget({
          period: budgetForm.period,
          amount: parseFloat(budgetForm.amount),
          startDate: budgetForm.startDate,
          alertThreshold: parseFloat(budgetForm.alertThreshold),
        });
        toast.success('Budget created successfully');
      }

      resetBudgetForm();
      setIsBudgetDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!goalForm.name || !goalForm.targetAmount) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingGoal) {
        await updateSavingsGoal(editingGoal.id, {
          name: goalForm.name,
          targetAmount: parseFloat(goalForm.targetAmount),
          currentAmount: parseFloat(goalForm.currentAmount || '0'),
          deadline: goalForm.deadline || undefined,
          description: goalForm.description || undefined,
        });
        toast.success('Savings goal updated');
      } else {
        await addSavingsGoal({
          name: goalForm.name,
          targetAmount: parseFloat(goalForm.targetAmount),
          currentAmount: parseFloat(goalForm.currentAmount || '0'),
          deadline: goalForm.deadline || undefined,
          description: goalForm.description || undefined,
        });
        toast.success('Savings goal created');
      }

      resetGoalForm();
      setIsGoalDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save savings goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setBudgetForm({
      period: budget.period,
      amount: budget.amount.toString(),
      startDate: budget.startDate,
      alertThreshold: budget.alertThreshold.toString(),
    });
    setIsBudgetDialogOpen(true);
  };

  const handleDeleteBudget = async (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(id);
        toast.success('Budget deleted');
      } catch (error) {
        toast.error('Failed to delete budget');
      }
    }
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalForm({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline || '',
      description: goal.description || '',
    });
    setIsGoalDialogOpen(true);
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Are you sure you want to delete this savings goal?')) {
      try {
        await deleteSavingsGoal(id);
        toast.success('Savings goal deleted');
      } catch (error) {
        toast.error('Failed to delete savings goal');
      }
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, amount: number) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (goal) {
      try {
        await updateSavingsGoal(goalId, {
          currentAmount: goal.currentAmount + amount,
        });
        toast.success(`Added $${amount.toFixed(2)} to ${goal.name}`);
      } catch (error) {
        toast.error('Failed to update goal progress');
      }
    }
  };

  // Current budget stats
  const currentBudget = getCurrentBudget();
  const currentExpenses = useMemo(() => {
    if (!currentBudget) return 0;
    
    const startDate = new Date(currentBudget.startDate);
    const endDate = new Date(startDate);
    
    if (currentBudget.period === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    return getTotalExpenses(startDate, endDate);
  }, [currentBudget, getTotalExpenses]);

  const budgetProgress = currentBudget 
    ? (currentExpenses / currentBudget.amount) * 100 
    : 0;

  const formatCurrency = (amount: number) => formatCurrencyUtil(amount, currency);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Navigation />
        <main className="container mx-auto px-4 pt-20 md:pt-24 pb-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading budget data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Budget & Goals</h1>
            <p className="text-muted-foreground mt-1">
              Plan your spending and track your savings
            </p>
          </div>
        </div>

        <Tabs defaultValue="budget" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="budget">Budget Planning</TabsTrigger>
            <TabsTrigger value="goals">Savings Goals</TabsTrigger>
          </TabsList>

          {/* Budget Planning Tab */}
          <TabsContent value="budget" className="space-y-6">
            {/* Current Budget Overview */}
            {currentBudget && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Current Budget</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditBudget(currentBudget)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {currentBudget.period.charAt(0).toUpperCase() + currentBudget.period.slice(1)} Budget
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(currentExpenses)} / {formatCurrency(currentBudget.amount)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(budgetProgress, 100)} 
                      className="h-4"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {budgetProgress.toFixed(0)}% used
                      </span>
                      {budgetProgress >= currentBudget.alertThreshold && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <AlertCircle className="h-3 w-3" />
                          Alert threshold reached
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {formatCurrency(Math.max(0, currentBudget.amount - currentExpenses))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Alert at</p>
                      <p className="text-2xl font-bold mt-1">
                        {currentBudget.alertThreshold}%
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Create/Manage Budget */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Manage Budget</h2>
                <Dialog open={isBudgetDialogOpen} onOpenChange={(open) => {
                  setIsBudgetDialogOpen(open);
                  if (!open) resetBudgetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      {currentBudget ? 'New Budget' : 'Create Budget'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingBudget ? 'Edit Budget' : 'Create New Budget'}
                      </DialogTitle>
                      <DialogDescription>
                        Set your spending limit and alert threshold
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleBudgetSubmit} className="space-y-4">
                      <div>
                        <Label>Budget Period</Label>
                        <Tabs 
                          value={budgetForm.period} 
                          onValueChange={(value) => setBudgetForm({ ...budgetForm, period: value as BudgetPeriod })}
                          className="mt-2"
                        >
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="weekly">Weekly</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      <div>
                        <Label htmlFor="amount">Budget Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={budgetForm.amount}
                          onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                          className="mt-2"
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={budgetForm.startDate}
                          onChange={(e) => setBudgetForm({ ...budgetForm, startDate: e.target.value })}
                          className="mt-2"
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
                        <Input
                          id="alertThreshold"
                          type="number"
                          min="0"
                          max="100"
                          value={budgetForm.alertThreshold}
                          onChange={(e) => setBudgetForm({ ...budgetForm, alertThreshold: e.target.value })}
                          className="mt-2"
                          required
                          disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          You'll be notified when you reach this percentage
                        </p>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                          {editingBudget ? 'Update' : 'Create'} Budget
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            resetBudgetForm();
                            setIsBudgetDialogOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Budget History */}
              {budgets.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Budget History</h3>
                  {budgets
                    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                    .map((budget) => {
                      const isCurrent = currentBudget?.id === budget.id;
                      
                      return (
                        <div 
                          key={budget.id}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            isCurrent ? 'border-primary bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {formatCurrency(budget.amount)} {budget.period}
                              </p>
                              {isCurrent && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Started {new Date(budget.startDate).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditBudget(budget)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBudget(budget.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                !currentBudget && (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No budget set. Create one to start tracking!
                    </p>
                  </div>
                )
              )}
            </Card>
          </TabsContent>

          {/* Savings Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={isGoalDialogOpen} onOpenChange={(open) => {
                setIsGoalDialogOpen(open);
                if (!open) resetGoalForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Savings Goal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
                    </DialogTitle>
                    <DialogDescription>
                      Set a target amount and track your progress
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleGoalSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="goalName">Goal Name</Label>
                      <Input
                        id="goalName"
                        placeholder="e.g., New Laptop"
                        value={goalForm.name}
                        onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                        className="mt-2"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="targetAmount">Target Amount</Label>
                        <Input
                          id="targetAmount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={goalForm.targetAmount}
                          onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                          className="mt-2"
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <Label htmlFor="currentAmount">Current Amount</Label>
                        <Input
                          id="currentAmount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={goalForm.currentAmount}
                          onChange={(e) => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
                          className="mt-2"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="deadline">Deadline (Optional)</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={goalForm.deadline}
                        onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                        className="mt-2"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        placeholder="e.g., For school projects"
                        value={goalForm.description}
                        onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                        className="mt-2"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1" disabled={isSubmitting}>
                        {editingGoal ? 'Update' : 'Create'} Goal
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          resetGoalForm();
                          setIsGoalDialogOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Savings Goals List */}
            {savingsGoals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savingsGoals.map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  const isCompleted = progress >= 100;
                  const daysUntilDeadline = goal.deadline 
                    ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <Card key={goal.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{goal.name}</h3>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {goal.description}
                            </p>
                          )}
                        </div>
                        {isCompleted && (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="text-sm font-medium">
                              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                            </span>
                          </div>
                          <Progress value={Math.min(progress, 100)} className="h-3" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {progress.toFixed(0)}% complete • {formatCurrency(goal.targetAmount - goal.currentAmount)} remaining
                          </p>
                        </div>

                        {goal.deadline && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Deadline:</span>
                            <span className={daysUntilDeadline && daysUntilDeadline < 30 ? 'text-orange-600 font-medium' : ''}>
                              {new Date(goal.deadline).toLocaleDateString()}
                              {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({daysUntilDeadline} days)
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex-1" disabled={isSubmitting}>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Add Funds
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle>Add to {goal.name}</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                const amount = parseFloat((e.target as any).amount.value);
                                if (amount > 0) {
                                  handleUpdateGoalProgress(goal.id, amount);
                                  (e.target as any).reset();
                                }
                              }} className="space-y-4">
                                <div>
                                  <Label htmlFor={`add-amount-${goal.id}`}>Amount to Add</Label>
                                  <Input
                                    id={`add-amount-${goal.id}`}
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="mt-2"
                                    required
                                    disabled={isSubmitting}
                                  />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                  Add Funds
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGoal(goal)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center">
                  <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Savings Goals Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start setting savings goals to track your financial progress
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}