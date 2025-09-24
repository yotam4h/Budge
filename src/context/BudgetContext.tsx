import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

import type { Budget as ApiBudget, Category as ApiCategory } from '../types';

// Types
type Category = ApiCategory & {
  color?: string;
  period?: string;
};

type Budget = {
  id: string;
  user_id: string;
  name: string; // Added name field
  total_amount: number; // This maps to 'amount' in the API
  period_start: string; // This maps to 'start_date' in the API
  period_end: string; // This maps to 'end_date' in the API
  created_at: string;
  updated_at: string;
  categories?: Category[];
};

type CategorySpending = {
  id: string;
  name: string;
  amount: number;
  limit: number;
  percentage: number;
};

type BudgetContextType = {
  budget: Budget | null;
  categories: Category[];
  categorySpending: CategorySpending[];
  isLoading: boolean;
  error: string | null;
  fetchBudget: () => Promise<void>;
  createOrUpdateBudget: (data: { total_amount: number, categories: Omit<Category, 'id' | 'budget_id' | 'created_at' | 'updated_at'>[] }) => Promise<Budget>;
  createCategory: (data: Omit<Category, 'id' | 'budget_id' | 'created_at' | 'updated_at'>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Omit<Category, 'id' | 'budget_id' | 'created_at' | 'updated_at'>>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<boolean>;
  fetchCategorySpending: (startDate?: string, endDate?: string) => Promise<void>;
  clearError: () => void;
};

const BudgetContext = createContext<BudgetContextType>({
  budget: null,
  categories: [],
  categorySpending: [],
  isLoading: false,
  error: null,
  fetchBudget: async () => {},
  createOrUpdateBudget: async () => ({} as Budget),
  createCategory: async () => ({} as Category),
  updateCategory: async () => ({} as Category),
  deleteCategory: async () => false,
  fetchCategorySpending: async () => {},
  clearError: () => {},
});

export const useBudget = () => useContext(BudgetContext);

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();

  const fetchBudget = async () => {
    if (!user || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/budget', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // User doesn't have a budget yet, this is not an error
          setBudget(null);
          setCategories([]);
          return;
        }
        throw new Error('Failed to fetch budget');
      }

      const data = await response.json();
      setBudget(data);
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching budget:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        const mockBudget: Budget = {
          id: 'mock-budget-id',
          user_id: user.id,
          name: 'Monthly Budget',
          total_amount: 5000,
          period_start: '2023-09-01',
          period_end: '2023-09-30',
          created_at: '2023-08-28T10:00:00Z',
          updated_at: '2023-08-28T10:00:00Z'
        };
        
        const mockCategories: Category[] = [
          {
            id: '1',
            budget_id: mockBudget.id,
            name: 'Housing',
            amount: 1500,
            color: '#FF5733',
            period: 'monthly',
            created_at: '2023-08-28T10:00:00Z',
            updated_at: '2023-08-28T10:00:00Z'
          },
          {
            id: '2',
            budget_id: mockBudget.id,
            name: 'Food',
            amount: 600,
            color: '#33FF57',
            period: 'monthly',
            created_at: '2023-08-28T10:00:00Z',
            updated_at: '2023-08-28T10:00:00Z'
          },
          {
            id: '3',
            budget_id: mockBudget.id,
            name: 'Entertainment',
            amount: 300,
            color: '#3357FF',
            period: 'monthly',
            created_at: '2023-08-28T10:00:00Z',
            updated_at: '2023-08-28T10:00:00Z'
          },
          {
            id: '4',
            budget_id: mockBudget.id,
            name: 'Transportation',
            amount: 200,
            color: '#F3FF33',
            period: 'monthly',
            created_at: '2023-08-28T10:00:00Z',
            updated_at: '2023-08-28T10:00:00Z'
          }
        ];
        
        mockBudget.categories = mockCategories;
        setBudget(mockBudget);
        setCategories(mockCategories);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createOrUpdateBudget = async (data: { total_amount: number, categories: Omit<Category, 'id' | 'budget_id' | 'created_at' | 'updated_at'>[] }): Promise<Budget> => {
    if (!user || !token) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create/update budget');
      }

      const newBudget = await response.json();
      
      // Update the local state
      setBudget(newBudget);
      setCategories(newBudget.categories || []);
      
      return newBudget;
    } catch (err) {
      console.error('Error creating/updating budget:', err);
      setError(err instanceof Error ? err.message : 'Failed to create/update budget');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createCategory = async (data: Omit<Category, 'id' | 'budget_id' | 'created_at' | 'updated_at'>): Promise<Category> => {
    if (!user || !token) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/budget/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create category');
      }

      const newCategory = await response.json();
      
      // Update the local state
      setCategories(prev => [...prev, newCategory]);
      
      return newCategory;
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to create category');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (id: string, data: Partial<Omit<Category, 'id' | 'budget_id' | 'created_at' | 'updated_at'>>): Promise<Category> => {
    if (!user || !token) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/budget/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update category');
      }

      const updatedCategory = await response.json();
      
      // Update the category in the local state
      setCategories(prev => 
        prev.map(category => 
          category.id === id ? updatedCategory : category
        )
      );
      
      return updatedCategory;
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to update category');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    if (!user || !token) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/budget/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }

      // Remove the category from the local state
      setCategories(prev => prev.filter(category => category.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategorySpending = async (startDate?: string, endDate?: string) => {
    if (!user || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      // Build query string from date range
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await fetch(`/api/transactions/spending?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch category spending');
      }

      const data = await response.json();
      setCategorySpending(data);
    } catch (err) {
      console.error('Error fetching category spending:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      // In development, use mock data
      if (process.env.NODE_ENV === 'development' && categories.length > 0) {
        const mockSpending: CategorySpending[] = categories.map(category => ({
          id: category.id,
          name: category.name,
          amount: Math.random() * category.amount,
          limit: category.amount,
          percentage: Math.random() * 100
        }));
        
        setCategorySpending(mockSpending);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Fetch budget when auth state changes
  useEffect(() => {
    if (user && token) {
      fetchBudget();
    }
  }, [user, token]);

  return (
    <BudgetContext.Provider
      value={{
        budget,
        categories,
        categorySpending,
        isLoading,
        error,
        fetchBudget,
        createOrUpdateBudget,
        createCategory,
        updateCategory,
        deleteCategory,
        fetchCategorySpending,
        clearError
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};