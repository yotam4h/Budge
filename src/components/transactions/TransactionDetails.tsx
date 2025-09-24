import { format } from 'date-fns';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

type TransactionDetailsProps = {
  transaction: {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category: string;
    categoryName?: string;
    date: string;
    createdAt: string;
  };
  onClose: () => void;
};

export default function TransactionDetails({ transaction, onClose }: TransactionDetailsProps) {
  const formattedDate = format(new Date(transaction.date), 'PPP');
  const formattedCreatedAt = format(new Date(transaction.createdAt), 'PPP p');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Transaction Details
          <Badge variant={transaction.type === 'income' ? 'success' : 'default'}>
            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b">
          <span className="text-gray-500">Amount</span>
          <span className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : ''}`}>
            ${transaction.amount.toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between items-center pb-2 border-b">
          <span className="text-gray-500">Description</span>
          <span>{transaction.description}</span>
        </div>
        
        <div className="flex justify-between items-center pb-2 border-b">
          <span className="text-gray-500">Category</span>
          <span>{transaction.categoryName || 'Unknown'}</span>
        </div>
        
        <div className="flex justify-between items-center pb-2 border-b">
          <span className="text-gray-500">Date</span>
          <span>{formattedDate}</span>
        </div>
        
        <div className="flex justify-between items-center pb-2 border-b text-sm">
          <span className="text-gray-500">Created</span>
          <span>{formattedCreatedAt}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button variant="outline">Edit</Button>
      </CardFooter>
    </Card>
  );
}