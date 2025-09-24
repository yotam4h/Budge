import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('budge_user');
    const storedToken = localStorage.getItem('budge_token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (err) {
        console.error('Failed to parse stored user data', err);
        localStorage.removeItem('budge_user');
        localStorage.removeItem('budge_token');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store user info and token in state and localStorage
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('budge_user', JSON.stringify(data.user));
      localStorage.setItem('budge_token', data.token);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login');
      
      // For development purposes, create a mock user when in dev mode
      if (process.env.NODE_ENV === 'development') {
        const mockUser = {
          id: 'mock-user-id',
          name: 'Test User',
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const mockToken = 'mock-jwt-token';
        
        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem('budge_user', JSON.stringify(mockUser));
        localStorage.setItem('budge_token', mockToken);
      } else {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      
      // Store user info and token in state and localStorage
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('budge_user', JSON.stringify(data.user));
      localStorage.setItem('budge_token', data.token);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register');
      
      // For development purposes, create a mock user when in dev mode
      if (process.env.NODE_ENV === 'development') {
        const mockUser = {
          id: 'mock-user-id',
          name: name,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const mockToken = 'mock-jwt-token';
        
        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem('budge_user', JSON.stringify(mockUser));
        localStorage.setItem('budge_token', mockToken);
      } else {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear user state and localStorage
    setUser(null);
    setToken(null);
    localStorage.removeItem('budge_user');
    localStorage.removeItem('budge_token');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};