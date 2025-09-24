// Global type declarations for Budge application

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Auth types
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Budget types
export interface Category {
  id?: string;
  name: string;
  amount: number;
  budget_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  start_date: string;
  end_date: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  categories?: Category[];
}

// Transaction types
export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  category_id: string;
  budget_id: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  category_name?: string;
}

// Dashboard types
export interface SpendingSummary {
  totalBudget: number;
  totalSpent: number;
  percentUsed: number;
  daysRemaining: number;
  dailyBudget: number;
  projectedOverspend: number;
  isOverBudget: boolean;
}