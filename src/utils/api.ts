/**
 * API utility functions for interacting with the backend
 */

// Base URL for API requests
const API_BASE_URL = '/api';

// Helper function for handling API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API request failed');
  }
  return response.json();
};

// Helper for making authenticated requests
const authFetch = async (url: string, options: RequestInit = {}) => {
  // Get the JWT token from local storage
  const token = localStorage.getItem('budge_token');
  
  // Set up headers with authentication token if available
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // If we get a 401, the token is likely expired
  if (response.status === 401) {
    localStorage.removeItem('budge_token');
    // Redirect to login page
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  
  return response;
};

// Auth-related API calls
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await handleResponse(response);
    if (data.token) {
      localStorage.setItem('budge_token', data.token);
    }
    return data;
  },
  
  register: async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    const data = await handleResponse(response);
    if (data.token) {
      localStorage.setItem('budge_token', data.token);
    }
    return data;
  },
  
  logout: () => {
    localStorage.removeItem('budge_token');
    window.location.href = '/login';
  },
  
  getCurrentUser: async () => {
    const response = await authFetch(`${API_BASE_URL}/auth/me`);
    return handleResponse(response);
  },
};

// Budget-related API calls
export const budgetApi = {
  createBudget: async (budgetData: any) => {
    const response = await authFetch(`${API_BASE_URL}/budgets`, {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
    return handleResponse(response);
  },
  
  getBudget: async () => {
    const response = await authFetch(`${API_BASE_URL}/budgets`);
    return handleResponse(response);
  },
  
  getCategories: async () => {
    const response = await authFetch(`${API_BASE_URL}/budgets/categories`);
    return handleResponse(response);
  },
  
  getBudgetSummary: async () => {
    const response = await authFetch(`${API_BASE_URL}/budgets/summary`);
    return handleResponse(response);
  },
  
  updateCategory: async (categoryId: string, categoryData: any) => {
    const response = await authFetch(`${API_BASE_URL}/budgets/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
    return handleResponse(response);
  },
  
  deleteCategory: async (categoryId: string) => {
    const response = await authFetch(`${API_BASE_URL}/budgets/categories/${categoryId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Transaction-related API calls
export const transactionApi = {
  getTransactions: async (params?: { 
    page?: number; 
    limit?: number;
    type?: 'income' | 'expense';
    category?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await authFetch(`${API_BASE_URL}/transactions${query}`);
    return handleResponse(response);
  },
  
  createTransaction: async (transactionData: {
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category: string;
    date: string;
  }) => {
    const response = await authFetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
    return handleResponse(response);
  },
  
  getTransactionById: async (id: string) => {
    const response = await authFetch(`${API_BASE_URL}/transactions/${id}`);
    return handleResponse(response);
  },
  
  updateTransaction: async (id: string, transactionData: any) => {
    const response = await authFetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
    return handleResponse(response);
  },
  
  deleteTransaction: async (id: string) => {
    const response = await authFetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
  
  getSpendingByCategory: async () => {
    const response = await authFetch(`${API_BASE_URL}/transactions/spending-by-category`);
    return handleResponse(response);
  },
};

export default {
  auth: authApi,
  budget: budgetApi,
  transaction: transactionApi,
};