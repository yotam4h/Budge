// Define Database interface to use across controllers
export interface Database {
  prepare: (query: string) => {
    bind: (...params: any[]) => {
      first: <T = any>() => Promise<T | null>;
      all: <T = any>() => Promise<{ results: T[] }>;
      run: () => Promise<any>;
    };
  };
}

// User interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

// Auth interfaces
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}

// Budget interfaces
export interface BudgetData {
  total_amount: number;
  period_start: string;
  period_end: string;
  categories: CategoryData[];
}

export interface Budget {
  id: string;
  user_id: string;
  total_amount: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
  categories?: Category[];
}

// Category interfaces
export interface CategoryData {
  id?: string;
  name: string;
  amount: number;
  color?: string;
}

export interface Category {
  id: string;
  budget_id: string;
  name: string;
  amount: number;
  color?: string;
  period?: string;
  created_at: string;
  updated_at: string;
}

// Transaction interfaces
export interface TransactionData {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string;
  date: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category_id: string | null;
  category_name?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionFilterOptions {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: PaginationResult;
}

export interface SpendingByCategory {
  id: string;
  name: string;
  amount: number;
  limit: number;
  percentage: number;
}