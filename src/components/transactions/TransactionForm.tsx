import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectGroup, SelectOption } from '../ui/select';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { format } from 'date-fns';

type Category = {
  id: string;
  name: string;
};

type TransactionFormData = {
  type: string;
  amount: number;
  description: string;
  category: string;
  date: string;
};

export default function TransactionForm() {
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  useEffect(() => {
    // Fetch categories
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/budgets/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error instanceof Error ? error.message : 'Unknown error');
        // Mock categories for development
        setCategories([
          { id: '1', name: 'Food' },
          { id: '2', name: 'Rent' },
          { id: '3', name: 'Entertainment' },
          { id: '4', name: 'Transport' },
          { id: '5', name: 'Utilities' },
        ]);
      }
    };
    
    fetchCategories();
  }, []);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const amountValue = formData.get('amount');
    const data: TransactionFormData = {
      type: formData.get('type') as string || 'expense',
      amount: amountValue ? parseFloat(amountValue.toString()) : 0,
      description: formData.get('description') as string || '',
      category: formData.get('category') as string || '',
      date: format(date, 'yyyy-MM-dd'),
    };
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to create transaction');
      
      // Reset form
      (event.target as HTMLFormElement).reset();
      setDate(new Date());
    } catch (error) {
      console.error('Error creating transaction:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select name="type" defaultValue="expense">
              <SelectGroup>
                <SelectOption value="income">Income</SelectOption>
                <SelectOption value="expense">Expense</SelectOption>
              </SelectGroup>
            </Select>
          </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              className="pl-7"
              placeholder="0.00"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            placeholder="Enter a description"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category">
            <SelectGroup>
              {categories.map((category) => (
                <SelectOption key={category.id} value={category.id}>
                  {category.name}
                </SelectOption>
              ))}
            </SelectGroup>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={format(date, 'yyyy-MM-dd')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(new Date(e.target.value))}
            className="cursor-pointer"
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Add Transaction'}
        </Button>
      </form>
      </CardContent>
    </Card>
  );
}