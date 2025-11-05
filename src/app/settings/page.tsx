"use client"

import { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  FileJson,
  Info,
  DollarSign,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'US Dollar ($)', symbol: '$', regions: ['US', 'United States'] },
  { value: 'EUR', label: 'Euro (€)', symbol: '€', regions: ['Europe', 'EU'] },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£', regions: ['UK', 'United Kingdom', 'GB'] },
  { value: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$', regions: ['Canada', 'CA'] },
  { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$', regions: ['Australia', 'AU'] },
  { value: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥', regions: ['Japan', 'JP'] },
  { value: 'CNY', label: 'Chinese Yuan (¥)', symbol: '¥', regions: ['China', 'CN'] },
  { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹', regions: ['India', 'IN'] },
  { value: 'NGN', label: 'Nigerian Naira (₦)', symbol: '₦', regions: ['Nigeria', 'NG'] },
  { value: 'CHF', label: 'Swiss Franc (CHF)', symbol: 'CHF', regions: ['Switzerland', 'CH'] },
  { value: 'NZD', label: 'New Zealand Dollar (NZ$)', symbol: 'NZ$', regions: ['New Zealand', 'NZ'] },
  { value: 'SGD', label: 'Singapore Dollar (S$)', symbol: 'S$', regions: ['Singapore', 'SG'] },
  { value: 'HKD', label: 'Hong Kong Dollar (HK$)', symbol: 'HK$', regions: ['Hong Kong', 'HK'] },
  { value: 'SEK', label: 'Swedish Krona (kr)', symbol: 'kr', regions: ['Sweden', 'SE'] },
  { value: 'NOK', label: 'Norwegian Krone (kr)', symbol: 'kr', regions: ['Norway', 'NO'] },
  { value: 'DKK', label: 'Danish Krone (kr)', symbol: 'kr', regions: ['Denmark', 'DK'] },
  { value: 'MXN', label: 'Mexican Peso (MX$)', symbol: 'MX$', regions: ['Mexico', 'MX'] },
  { value: 'BRL', label: 'Brazilian Real (R$)', symbol: 'R$', regions: ['Brazil', 'BR'] },
  { value: 'ZAR', label: 'South African Rand (R)', symbol: 'R', regions: ['South Africa', 'ZA'] },
  { value: 'RUB', label: 'Russian Ruble (₽)', symbol: '₽', regions: ['Russia', 'RU'] },
  { value: 'KRW', label: 'South Korean Won (₩)', symbol: '₩', regions: ['South Korea', 'KR'] },
];

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { 
    exportData, 
    importData, 
    clearAllData,
    transactions,
    budgets,
    savingsGoals,
    reminders,
    currency,
    updateCurrency,
    isLoading
  } = useFinance();

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionPending && !session?.user) {
      router.push("/login");
    }
  }, [session, sessionPending, router]);

  // Update selected currency when context currency changes
  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  const handleExport = () => {
    try {
      exportData();
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const success = importData(jsonString);
        
        if (success) {
          toast.success('Data imported successfully');
          setIsImportDialogOpen(false);
        } else {
          toast.error('Invalid data format');
        }
      } catch (error) {
        toast.error('Failed to import data');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    clearAllData();
    toast.success('All data cleared');
    setIsClearDialogOpen(false);
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    if (newCurrency === currency) return;

    setIsUpdatingCurrency(true);
    try {
      await updateCurrency(newCurrency);
      setSelectedCurrency(newCurrency);
      toast.success(`Currency updated to ${CURRENCY_OPTIONS.find(c => c.value === newCurrency)?.label}`);
    } catch (error) {
      toast.error('Failed to update currency');
      setSelectedCurrency(currency);
    } finally {
      setIsUpdatingCurrency(false);
    }
  };

  const totalItems = transactions.length + budgets.length + savingsGoals.length + reminders.length;

  // Show loading while checking auth
  if (sessionPending || !session?.user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Navigation />
        <main className="container mx-auto px-4 pt-20 md:pt-24 pb-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your app preferences and data
          </p>
        </div>

        <div className="space-y-6">
          {/* App Info */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold text-xl">BB</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">Budget Buddy</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Personal Finance Tracker for University Students
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">{transactions.length}</p>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{budgets.length}</p>
                    <p className="text-xs text-muted-foreground">Budgets</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{savingsGoals.length}</p>
                    <p className="text-xs text-muted-foreground">Savings Goals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{reminders.length}</p>
                    <p className="text-xs text-muted-foreground">Reminders</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Currency Preferences */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Currency Preferences
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="currency">Preferred Currency</Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={handleCurrencyChange}
                  disabled={isUpdatingCurrency}
                >
                  <SelectTrigger id="currency" className="mt-2">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  This will be used to display all monetary values throughout the app
                </p>
              </div>
            </div>
          </Card>

          {/* Data Management */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Data Management</h2>
            
            <div className="space-y-4">
              {/* Export Data */}
              <div className="flex items-start justify-between p-4 rounded-lg border">
                <div className="flex items-start gap-3 flex-1">
                  <Download className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Export Data</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Download all your data as a JSON file for backup
                    </p>
                  </div>
                </div>
                <Button onClick={handleExport} variant="outline" className="ml-4">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Import Data */}
              <div className="flex items-start justify-between p-4 rounded-lg border">
                <div className="flex items-start gap-3 flex-1">
                  <Upload className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Import Data</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Restore data from a previously exported JSON file
                    </p>
                  </div>
                </div>
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="ml-4">
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Import Data</DialogTitle>
                      <DialogDescription>
                        Select a JSON file to import. This will replace all existing data.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                        <div className="flex gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                          <p className="text-sm text-amber-900 dark:text-amber-100">
                            Warning: Importing data will replace all your current data. Make sure to export your current data first if you want to keep it.
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="import-file">Select JSON File</Label>
                        <Input
                          id="import-file"
                          type="file"
                          accept=".json"
                          onChange={handleImport}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Clear All Data */}
              <div className="flex items-start justify-between p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
                <div className="flex items-start gap-3 flex-1">
                  <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-900 dark:text-red-100">Clear All Data</h3>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                      Permanently delete all transactions, budgets, goals, and reminders
                    </p>
                  </div>
                </div>
                <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="ml-4">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Clear All Data?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. All your data will be permanently deleted.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                        <div className="flex gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                          <div className="text-sm text-red-900 dark:text-red-100">
                            <p className="font-medium">You are about to delete:</p>
                            <ul className="mt-2 space-y-1">
                              <li>• {transactions.length} transactions</li>
                              <li>• {budgets.length} budgets</li>
                              <li>• {savingsGoals.length} savings goals</li>
                              <li>• {reminders.length} reminders</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="destructive" 
                          onClick={handleClearAll}
                          className="flex-1"
                        >
                          Yes, Delete Everything
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsClearDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>

          {/* Storage Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Storage & Privacy</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-2">Secure Cloud Storage</p>
                  <p className="text-muted-foreground">
                    Your data is securely stored in the cloud and synced across devices. 
                    All data is encrypted and only accessible by you with your account credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <FileJson className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-2">Data Privacy</p>
                  <p className="text-muted-foreground">
                    Your financial data is private and never shared with third parties. 
                    You have full control over your data and can export or delete it at any time.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* About */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">About Budget Buddy</h2>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Budget Buddy is a personal finance tracker designed specifically for university students. 
                Track your income and expenses, set budgets, create savings goals, and never miss a payment with smart reminders.
              </p>
              <p className="pt-2 border-t">
                <strong>Features:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Student-focused expense categories</li>
                <li>Income and expense tracking</li>
                <li>Visual spending insights</li>
                <li>Budget planning with alerts</li>
                <li>Savings goal tracker</li>
                <li>Smart reminders</li>
                <li>Multi-currency support</li>
                <li>Secure cloud storage</li>
                <li>Dark/Light mode</li>
              </ul>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}