import { useState, useEffect } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category_id: string | null;
  category_name?: string;
  date: string;
}

export default function TransactionList() {
  const { transactions, isLoading, error, fetchTransactions, pagination } = useTransactions();
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  
  useEffect(() => {
    // Fetch transactions when component mounts
    fetchTransactions({ page: currentPage });
  }, [fetchTransactions, currentPage]);
  
  useEffect(() => {
    if (transactions) {
      setDisplayedTransactions(transactions);
    }
  }, [transactions]);
  
  const formatAmount = (type: 'income' | 'expense', amount: number) => {
    return type === 'income' ? `+${formatCurrency(amount)}` : `-${formatCurrency(amount)}`;
  };
  
  const handleLoadMore = () => {
    if (pagination && pagination.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pagination && pagination.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (isLoading && !transactions.length) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }
  
  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }
  
  if (displayedTransactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions found. Add your first transaction.
      </div>
    );
  }
  
  return (
    <div>
      <div className="overflow-hidden rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{transaction.category_name || 'None'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDate(transaction.date)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(transaction.type, transaction.amount)}
                  </div>
                </td>
              </tr>
            ))}
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading more transactions...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <div className="mt-4 flex justify-between items-center">
          <button 
            className={`px-4 py-2 text-sm rounded-md ${pagination.hasPrevPage ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            disabled={!pagination.hasPrevPage}
            onClick={handlePreviousPage}
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button 
            className={`px-4 py-2 text-sm rounded-md ${pagination.hasNextPage ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            disabled={!pagination.hasNextPage}
            onClick={handleLoadMore}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}