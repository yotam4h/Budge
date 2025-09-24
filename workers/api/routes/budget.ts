import { Hono } from 'hono';
import { budgetController } from '../controllers/budget';
import { auth } from '../middleware/auth';
import { Database } from '../types';
import { getErrorMessage } from '../utils/errorHandler';

// Define the app with proper bindings
interface Bindings {
  DB: Database;
  [key: string]: any;
}

const app = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware to all routes
app.use('*', auth());

// Get user's budget
app.get('/', async (c) => {
  const userId = c.get('userId');
  
  try {
    const budget = await budgetController.getBudgetByUserId(c.env.DB, userId);
    return c.json({ budget });
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Budget not found') }, 404);
  }
});

// Create or update budget
app.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  try {
    const budget = await budgetController.createOrUpdateBudget(c.env.DB, userId, body);
    return c.json({ budget });
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Failed to create or update budget') }, 400);
  }
});

// Get budget categories
app.get('/categories', async (c) => {
  const userId = c.get('userId');
  
  try {
    const categories = await budgetController.getCategoriesByUserId(c.env.DB, userId);
    return c.json(categories);
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Categories not found') }, 404);
  }
});

// Create budget category
app.post('/categories', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  try {
    const category = await budgetController.createCategory(c.env.DB, userId, body);
    return c.json({ message: 'Category created successfully', category });
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Failed to create category') }, 400);
  }
});

// Update budget category
app.put('/categories/:id', async (c) => {
  const userId = c.get('userId');
  const categoryId = c.req.param('id');
  const body = await c.req.json();
  
  try {
    const category = await budgetController.updateCategory(c.env.DB, userId, categoryId, body);
    return c.json({ message: 'Category updated successfully', category });
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Failed to update category') }, 400);
  }
});

// Delete budget category
app.delete('/categories/:id', async (c) => {
  const userId = c.get('userId');
  const categoryId = c.req.param('id');
  
  try {
    await budgetController.deleteCategory(c.env.DB, userId, categoryId);
    return c.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Failed to delete category') }, 400);
  }
});

// Get budget summary (spending vs budget)
app.get('/summary', async (c) => {
  const userId = c.get('userId');
  
  try {
    const summary = await budgetController.getBudgetSummary(c.env.DB, userId);
    return c.json(summary);
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Budget summary not found') }, 404);
  }
});

export default app;