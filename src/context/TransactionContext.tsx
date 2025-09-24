import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthProvider, useAuth } from '.';

type Transaction = {
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
};

type TransactionFilter = {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type TransactionsContextType = {
  transactions: Transaction[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (filters?: TransactionFilter) => Promise<void>;
  createTransaction: (data: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<boolean>;
  clearError: () => void;
};

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const TransactionsContext = createContext<TransactionsContextType>({
  transactions: [],
  pagination: defaultPagination,
  isLoading: false,
  error: null,
  fetchTransactions: async () => {},
  createTransaction: async () => ({} as Transaction),
  updateTransaction: async () => ({} as Transaction),
  deleteTransaction: async () => false,
  clearError: () => {},
});

export const useTransactions = () => useContext(TransactionsContext);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(defaultPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();

  const fetchTransactions = async (filters?: TransactionFilter) => {
    if (!user || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(`/api/transactions?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
      setPagination(data.pagination || defaultPagination);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        // Mock data for development
        const mockTransactions: Transaction[] = [
          { 
            id: '1', 
            user_id: user?.id || '',
            type: 'expense', 
            amount: 78.52, 
            description: 'Grocery Shopping', 
            category_id: '1',
            category_name: 'Food', 
            date: '2023-09-23',
            created_at: '2023-09-23T10:20:30Z',
            updated_at: '2023-09-23T10:20:30Z'
          },
          { 
            id: '2', 
            user_id: user?.id || '',
            type: 'income', 
            amount: 2500, 
            description: 'Monthly Salary', 
            category_id: null,
            category_name: 'Income', 
            date: '2023-09-01',
            created_at: '2023-09-01T09:00:00Z',
            updated_at: '2023-09-01T09:00:00Z'
          },
          { 
            id: '3', 
            user_id: user?.id || '',
            type: 'expense', 
            amount: 65, 
            description: 'Internet Bill', 
            category_id: '5',
            category_name: 'Utilities', 
            date: '2023-09-05',
            created_at: '2023-09-05T14:30:00Z',
            updated_at: '2023-09-05T14:30:00Z'
          }
        ];
        
        setTransactions(mockTransactions);
        setPagination({
          page: 1,
          limit: 10,
          total: mockTransactions.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createTransaction = async (data: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Transaction> => {
    if (!user || !token) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create transaction');
      }

      const newTransaction = await response.json();
      
      // Update the local state with the new transaction
      setTransactions(prev => [newTransaction, ...prev]);
      
      return newTransaction;
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
    if (!user || !token) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update transaction');
      }

      const updatedTransaction = await response.json();
      
      // Update the transaction in the local state
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? updatedTransaction : transaction
        )
      );
      
      return updatedTransaction;
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    if (!user || !token) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete transaction');
      }

      // Remove the transaction from the local state
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        pagination,
        isLoading,
        error,
        fetchTransactions,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        clearError
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};