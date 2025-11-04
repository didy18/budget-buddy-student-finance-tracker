import { Category } from '@/types';
import { 
  Utensils, 
  Bus, 
  GraduationCap, 
  Gamepad2, 
  ShoppingBag, 
  Lightbulb, 
  Heart, 
  Home,
  MoreHorizontal 
} from 'lucide-react';

export const categoryConfig: Record<Category, { label: string; icon: any; color: string }> = {
  food: {
    label: 'Food & Dining',
    icon: Utensils,
    color: 'text-orange-500',
  },
  transport: {
    label: 'Transport',
    icon: Bus,
    color: 'text-blue-500',
  },
  academic: {
    label: 'Academic',
    icon: GraduationCap,
    color: 'text-purple-500',
  },
  entertainment: {
    label: 'Entertainment',
    icon: Gamepad2,
    color: 'text-pink-500',
  },
  shopping: {
    label: 'Shopping',
    icon: ShoppingBag,
    color: 'text-green-500',
  },
  utilities: {
    label: 'Utilities',
    icon: Lightbulb,
    color: 'text-yellow-500',
  },
  health: {
    label: 'Health',
    icon: Heart,
    color: 'text-red-500',
  },
  housing: {
    label: 'Housing',
    icon: Home,
    color: 'text-indigo-500',
  },
  other: {
    label: 'Other',
    icon: MoreHorizontal,
    color: 'text-gray-500',
  },
};
