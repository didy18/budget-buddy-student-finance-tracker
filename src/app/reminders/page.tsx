"use client"

import { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Plus,
  Bell,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Calendar as CalendarIcon,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Reminder, Category } from '@/types';
import { categoryConfig } from '@/lib/categoryConfig';
import { toast } from 'sonner';

export default function RemindersPage() {
  const {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    isLoading
  } = useFinance();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    category: undefined as Category | undefined,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      category: undefined,
    });
    setEditingReminder(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error('Please enter a reminder title');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingReminder) {
        await updateReminder(editingReminder.id, {
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          category: formData.category,
        });
        toast.success('Reminder updated');
      } else {
        await addReminder({
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          isCompleted: false,
          category: formData.category,
        });
        toast.success('Reminder created');
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      dueDate: reminder.dueDate,
      category: reminder.category,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      try {
        await deleteReminder(id);
        toast.success('Reminder deleted');
      } catch (error) {
        toast.error('Failed to delete reminder');
      }
    }
  };

  const handleToggleComplete = async (reminder: Reminder) => {
    try {
      await updateReminder(reminder.id, {
        isCompleted: !reminder.isCompleted,
      });
      toast.success(reminder.isCompleted ? 'Marked as incomplete' : 'Marked as complete');
    } catch (error) {
      toast.error('Failed to update reminder');
    }
  };

  // Filter and categorize reminders
  const categorizedReminders = useMemo(() => {
    let filtered = reminders;

    if (filterStatus === 'active') {
      filtered = reminders.filter(r => !r.isCompleted);
    } else if (filterStatus === 'completed') {
      filtered = reminders.filter(r => r.isCompleted);
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdue: Reminder[] = [];
    const today: Reminder[] = [];
    const upcoming: Reminder[] = [];
    const completed: Reminder[] = [];

    filtered.forEach(reminder => {
      const dueDate = new Date(reminder.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (reminder.isCompleted) {
        completed.push(reminder);
      } else if (dueDate < now) {
        overdue.push(reminder);
      } else if (dueDate.getTime() === now.getTime()) {
        today.push(reminder);
      } else {
        upcoming.push(reminder);
      }
    });

    return { overdue, today, upcoming, completed };
  }, [reminders, filterStatus]);

  const ReminderCard = ({ reminder }: { reminder: Reminder }) => {
    const categoryData = reminder.category ? categoryConfig[reminder.category] : null;
    const Icon = categoryData?.icon;
    const dueDate = new Date(reminder.dueDate);
    const isOverdue = dueDate < new Date() && !reminder.isCompleted;

    return (
      <div 
        className={`flex items-start gap-4 p-4 rounded-lg border ${
          reminder.isCompleted ? 'bg-muted/50 opacity-60' : ''
        } ${isOverdue ? 'border-red-300 dark:border-red-900' : ''}`}
      >
        <button
          onClick={() => handleToggleComplete(reminder)}
          className="mt-1 flex-shrink-0"
        >
          {reminder.isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className={`font-medium ${reminder.isCompleted ? 'line-through' : ''}`}>
                {reminder.title}
              </h3>
              {reminder.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {reminder.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className={`flex items-center gap-1 text-xs ${
                  isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                }`}>
                  <CalendarIcon className="h-3 w-3" />
                  {dueDate.toLocaleDateString()}
                  {isOverdue && <span className="ml-1">(Overdue)</span>}
                </div>
                {categoryData && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon className={`h-3 w-3 ${categoryData.color}`} />
                    {categoryData.label}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(reminder)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(reminder.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Navigation />
        <main className="container mx-auto px-4 pt-20 md:pt-24 pb-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading reminders...</p>
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
            <h1 className="text-3xl font-bold">Reminders</h1>
            <p className="text-muted-foreground mt-1">
              Never miss a payment or important financial task
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
                </DialogTitle>
                <DialogDescription>
                  Set a reminder for bills, payments, or financial tasks
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Pay rent"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-2"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Additional details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-2"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-2"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Select 
                    value={formData.category || 'none'} 
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      category: value === 'none' ? undefined : value as Category 
                    })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {Object.entries(categoryConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${config.color}`} />
                              {config.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {editingReminder ? 'Update' : 'Create'} Reminder
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <Label>Filter:</Label>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reminders</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Reminders List */}
        <div className="space-y-6">
          {/* Overdue */}
          {categorizedReminders.overdue.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-semibold text-red-600">
                  Overdue ({categorizedReminders.overdue.length})
                </h2>
              </div>
              <div className="space-y-2">
                {categorizedReminders.overdue.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            </Card>
          )}

          {/* Today */}
          {categorizedReminders.today.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  Due Today ({categorizedReminders.today.length})
                </h2>
              </div>
              <div className="space-y-2">
                {categorizedReminders.today.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            </Card>
          )}

          {/* Upcoming */}
          {categorizedReminders.upcoming.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">
                  Upcoming ({categorizedReminders.upcoming.length})
                </h2>
              </div>
              <div className="space-y-2">
                {categorizedReminders.upcoming
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map(reminder => (
                    <ReminderCard key={reminder.id} reminder={reminder} />
                  ))}
              </div>
            </Card>
          )}

          {/* Completed */}
          {categorizedReminders.completed.length > 0 && filterStatus !== 'active' && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold">
                  Completed ({categorizedReminders.completed.length})
                </h2>
              </div>
              <div className="space-y-2">
                {categorizedReminders.completed.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            </Card>
          )}

          {/* Empty State */}
          {reminders.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reminders Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create reminders for bills, payments, and financial tasks
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Reminder
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}