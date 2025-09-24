import { ReactNode } from 'react';
import { AuthProvider, BudgetProvider, TransactionProvider } from '../context';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <BudgetProvider>
        <TransactionProvider>
          {children}
        </TransactionProvider>
      </BudgetProvider>
    </AuthProvider>
  );
}