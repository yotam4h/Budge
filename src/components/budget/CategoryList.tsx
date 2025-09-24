import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

type Category = {
  id: string;
  name: string;
  amount: number;
  period: string;
};

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/budgets/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError('Could not load categories');
        console.error(err);
        
        // Temporary mock data for development
        setCategories([
          { id: '1', name: 'Food', amount: 400, period: 'monthly' },
          { id: '2', name: 'Rent', amount: 1200, period: 'monthly' },
          { id: '3', name: 'Entertainment', amount: 200, period: 'monthly' },
          { id: '4', name: 'Transport', amount: 250, period: 'monthly' },
          { id: '5', name: 'Utilities', amount: 300, period: 'monthly' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return 'Monthly';
    }
  };
  
  if (isLoading) {
    return <p>Loading categories...</p>;
  }
  
  if (error) {
    return <p className="text-red-500">{error}</p>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p>No categories found. Create your first category.</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => (
              <li 
                key={category.id}
                className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{category.name}</p>
                  <Badge variant={category.period === 'monthly' ? 'default' : 'secondary'}>
                    {getPeriodLabel(category.period)}
                  </Badge>
                </div>
                <div className="font-medium">${category.amount.toFixed(2)}</div>
              </li>
            ))}
          </ul>
        )}
        
        <Button className="w-full mt-4" variant="outline">
          Add Category
        </Button>
      </CardContent>
    </Card>
  );
}