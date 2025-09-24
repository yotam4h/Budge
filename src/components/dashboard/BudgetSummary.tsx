import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useBudget } from '../../context/BudgetContext';
import { formatCurrency } from '../../utils/formatters';

export default function BudgetSummary() {
  const { categorySpending: categories, isLoading, error, fetchCategorySpending } = useBudget();
  
  useEffect(() => {
    // Fetch category spending data when component mounts
    fetchCategorySpending();
  }, [fetchCategorySpending]);
  
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };
  
  if (isLoading) {
    return <div>Loading budget data...</div>;
  }
  
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <div key={category.id}>
            <div className="flex justify-between text-sm mb-1">
              <span>{category.name}</span>
              <span>{formatCurrency(category.amount)}/{formatCurrency(category.limit)}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
              <div
                className={`${getProgressColor(category.percentage)} h-2 rounded-full`}
                style={{ width: `${Math.min(100, category.percentage)}%` }}
              ></div>
            </div>
          </div>
        ))}
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between">
            <span className="font-medium">Total Spent</span>
            <span className="font-medium">
              {formatCurrency(categories.reduce((sum, cat) => sum + cat.amount, 0))}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Total Budget</span>
            <span>
              {formatCurrency(categories.reduce((sum, cat) => sum + cat.limit, 0))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}