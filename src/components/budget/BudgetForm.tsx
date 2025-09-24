import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectGroup, SelectOption } from '../ui/select';
import { Badge } from '../ui/badge';
import { useBudget } from '../../context/BudgetContext';

interface BudgetFormData {
  monthlyIncome: number;
  categories: Array<{
    name: string;
    amount: number;
    color?: string;
    period?: 'daily' | 'weekly' | 'monthly';
  }>;
}

export default function BudgetForm() {
  const { register, handleSubmit, formState: { errors }, control } = useForm<BudgetFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const { createOrUpdateBudget } = useBudget();
  
  const onSubmit = async (data: BudgetFormData) => {
    setIsLoading(true);
    try {
      // Budget creation logic will be implemented here
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create budget');
      }
      
      // Redirect or update UI
    } catch (error) {
      console.error('Budget creation error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Your Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyIncome">Monthly Income</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
              <Input
                id="monthlyIncome"
                type="number"
                step="0.01"
                className="pl-7"
                placeholder="0.00"
                {...register('monthlyIncome', { 
                  required: 'Monthly income is required',
                  min: { value: 0, message: 'Income must be positive' }
                })}
              />
            </div>
            {errors.monthlyIncome && (
              <p className="text-sm text-red-500">{errors.monthlyIncome.message as string}</p>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Budget Categories</Label>
              <Button type="button" variant="outline" size="sm">+ Add Category</Button>
            </div>
            
            {/* Example Category - This would be mapped from an array in a full implementation */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                <Input placeholder="Category name" {...register('categories.0.name')} />
              </div>
              <div className="col-span-4 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input 
                  type="number" 
                  step="0.01" 
                  className="pl-7" 
                  placeholder="0.00" 
                  {...register('categories.0.amount')} 
                />
              </div>
              <div className="col-span-3">
                <Select 
                  defaultValue="monthly"
                  {...register('categories.0.period')}
                >
                  <SelectGroup>
                    <SelectOption value="daily">Daily</SelectOption>
                    <SelectOption value="weekly">Weekly</SelectOption>
                    <SelectOption value="monthly">Monthly</SelectOption>
                  </SelectGroup>
                </Select>
              </div>
              <div className="col-span-1 flex justify-center">
                <button type="button" className="text-red-500 hover:text-red-700">
                  &times;
                </button>
              </div>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Create Budget'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}