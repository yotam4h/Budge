import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';

import authRoutes from './routes/auth';
import budgetRoutes from './routes/budget';
import transactionRoutes from './routes/transaction';

// Create Hono app
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check route
app.get('/', (c) => c.json({ status: 'ok', message: 'Budge API is running!' }));

// Protected routes middleware
const authenticate = jwt({
  secret: process.env.JWT_SECRET || 'budge_development_secret',
});

// Routes
app.route('/auth', authRoutes);
app.route('/budgets', budgetRoutes);
app.route('/transactions', transactionRoutes);

export default app;