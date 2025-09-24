import { Hono } from 'hono';
import { transactionController } from '../controllers/transaction';
import { auth } from '../middleware/auth';
import { Database, TransactionFilterOptions } from '../types';
import { getErrorMessage } from '../utils/errorHandler';

// Define the app with proper bindings
interface Bindings {
  DB: Database;
  [key: string]: any;
}

const app = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware to all routes
app.use('*', auth());

// Get all transactions
app.get('/', async (c) => {
  const userId = c.get('userId');
  
  // Query parameters for filtering and pagination
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const typeParam = c.req.query('type');
  // Validate the type parameter
  const type = typeParam === 'income' || typeParam === 'expense' ? typeParam : undefined;
  const categoryId = c.req.query('category');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  
  try {
    const filters: TransactionFilterOptions = { page, limit, categoryId, startDate, endDate };
    if (type) filters.type = type;
    
    const { transactions, pagination } = await transactionController.getTransactions(
      c.env.DB, 
      userId, 
      filters
    );
    
    return c.json({ transactions, pagination });
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Failed to fetch transactions') }, 400);
  }
});

// Create a new transaction
app.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  try {
    const transaction = await transactionController.createTransaction(c.env.DB, userId, body);
    return c.json({ message: 'Transaction created successfully', transaction }, 201);
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Failed to create transaction') }, 400);
  }
});

// Get transaction by ID
app.get('/:id', async (c) => {
  const userId = c.get('userId');
  const transactionId = c.req.param('id');
  
  try {
    const transaction = await transactionController.getTransactionById(c.env.DB, userId, transactionId);
    return c.json({ transaction });
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Transaction not found') }, 404);
  }
});

// Update transaction
app.put('/:id', async (c) => {
  const userId = c.get('userId');
  const transactionId = c.req.param('id');
  const body = await c.req.json();
  
  try {
    const transaction = await transactionController.updateTransaction(c.env.DB, userId, transactionId, body);
    return c.json({ message: 'Transaction updated successfully', transaction });
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Failed to update transaction') }, 400);
  }
});

// Delete transaction
app.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const transactionId = c.req.param('id');
  
  try {
    await transactionController.deleteTransaction(c.env.DB, userId, transactionId);
    return c.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Failed to delete transaction') }, 400);
  }
});

// Get spending by category
app.get('/spending-by-category', async (c) => {
  const userId = c.get('userId');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  
  try {
    const spendingData = await transactionController.getSpendingByCategory(
      c.env.DB, 
      userId,
      startDate,
      endDate
    );
    
    return c.json(spendingData);
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Failed to get spending data') }, 400);
  }
});

export default app;