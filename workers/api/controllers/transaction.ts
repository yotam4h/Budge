import { nanoid } from 'nanoid';
import { 
  Database, 
  Transaction, 
  TransactionData, 
  TransactionFilterOptions,
  TransactionsResponse,
  SpendingByCategory
} from '../types';

export const transactionController = {
  async getTransactions(db: Database, userId: string, options: TransactionFilterOptions = {}): Promise<TransactionsResponse> {
    // Default options
    const { 
      page = 1, 
      limit = 20, 
      type, 
      categoryId, 
      startDate, 
      endDate 
    } = options;
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = ['user_id = ?'];
    const params = [userId];
    
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }
    
    if (categoryId) {
      conditions.push('category_id = ?');
      params.push(categoryId);
    }
    
    if (startDate) {
      conditions.push('date >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push('date <= ?');
      params.push(endDate);
    }
    
    // Build the WHERE clause
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    // Get total count for pagination
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total
      FROM transactions
      ${whereClause}
    `).bind(...params).first();
    
    const total = countResult ? countResult.total : 0;
    
    // Add pagination parameters
    const paginatedParams = [...params, limit, offset];
    
    // Get transactions
    const transactionsResult = await db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...paginatedParams).all();
    
    const transactions = transactionsResult.results || [];
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    };
  },
  
  async createTransaction(db: Database, userId: string, transactionData: TransactionData): Promise<Transaction> {
    const { type, amount, description, category: categoryId, date } = transactionData;
    
    // Validate required fields
    if (!type || amount === undefined || !description || !date) {
      throw new Error('Type, amount, description, and date are required');
    }
    
    // Validate type
    if (type !== 'income' && type !== 'expense') {
      throw new Error('Type must be either "income" or "expense"');
    }
    
    // If a category is provided, verify it belongs to the user
    if (categoryId && categoryId !== 'income') {
      const validCategory = await db.prepare(`
        SELECT c.* 
        FROM categories c
        JOIN budgets b ON c.budget_id = b.id
        WHERE c.id = ? AND b.user_id = ?
      `).bind(categoryId, userId).first();
      
      if (!validCategory) {
        throw new Error('Invalid category');
      }
    }
    
    const transactionId = nanoid();
    const timestamp = new Date().toISOString();
    
    // Create the transaction
    await db.prepare(`
      INSERT INTO transactions (
        id, user_id, type, amount, description, category_id, 
        date, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      transactionId,
      userId,
      type,
      amount,
      description,
      categoryId === 'income' ? null : categoryId, // Use null for income with no category
      date,
      timestamp,
      timestamp
    ).run();
    
    // Return the new transaction
    const transaction = await this.getTransactionById(db, userId, transactionId);
    return transaction;
  },
  
  async getTransactionById(db: Database, userId: string, transactionId: string): Promise<Transaction> {
    const transaction = await db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ? AND t.user_id = ?
    `).bind(transactionId, userId).first();
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    return transaction;
  },
  
  async updateTransaction(db: Database, userId: string, transactionId: string, transactionData: Partial<TransactionData>): Promise<Transaction> {
    // First, check if the transaction exists and belongs to the user
    const existingTransaction = await this.getTransactionById(db, userId, transactionId);
    
    if (!existingTransaction) {
      throw new Error('Transaction not found');
    }
    
    const { type, amount, description, category: categoryId, date } = transactionData;
    const timestamp = new Date().toISOString();
    
    // If a category is provided, verify it belongs to the user
    if (categoryId && categoryId !== 'income') {
      const validCategory = await db.prepare(`
        SELECT c.* 
        FROM categories c
        JOIN budgets b ON c.budget_id = b.id
        WHERE c.id = ? AND b.user_id = ?
      `).bind(categoryId, userId).first();
      
      if (!validCategory) {
        throw new Error('Invalid category');
      }
    }
    
    // Build the update query dynamically based on provided fields
    let updateFields = [];
    let params = [];
    
    if (type !== undefined) {
      // Validate type
      if (type !== 'income' && type !== 'expense') {
        throw new Error('Type must be either "income" or "expense"');
      }
      updateFields.push('type = ?');
      params.push(type);
    }
    
    if (amount !== undefined) {
      updateFields.push('amount = ?');
      params.push(amount);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    
    if (categoryId !== undefined) {
      updateFields.push('category_id = ?');
      params.push(categoryId === 'income' ? null : categoryId);
    }
    
    if (date !== undefined) {
      updateFields.push('date = ?');
      params.push(date);
    }
    
    // Always update the updated_at timestamp
    updateFields.push('updated_at = ?');
    params.push(timestamp);
    
    // Add the WHERE clause parameters
    params.push(transactionId);
    params.push(userId);
    
    if (updateFields.length === 1) {
      // Only the timestamp is being updated, nothing changed
      throw new Error('No changes to update');
    }
    
    // Update the transaction
    await db.prepare(`
      UPDATE transactions
      SET ${updateFields.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...params).run();
    
    // Return the updated transaction
    const updatedTransaction = await this.getTransactionById(db, userId, transactionId);
    return updatedTransaction;
  },
  
  async deleteTransaction(db: Database, userId: string, transactionId: string): Promise<boolean> {
    // First, check if the transaction exists and belongs to the user
    const existingTransaction = await db.prepare(`
      SELECT * FROM transactions
      WHERE id = ? AND user_id = ?
    `).bind(transactionId, userId).first();
    
    if (!existingTransaction) {
      throw new Error('Transaction not found');
    }
    
    // Delete the transaction
    await db.prepare(`
      DELETE FROM transactions
      WHERE id = ? AND user_id = ?
    `).bind(transactionId, userId).run();
    
    return true;
  },
  
  async getSpendingByCategory(db: Database, userId: string, startDate?: string, endDate?: string): Promise<SpendingByCategory[]> {
    // Get the current month's range if not specified
    if (!startDate || !endDate) {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }
    
    // Get all expense transactions grouped by category
    const spending = await db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.amount as limit_amount,
        SUM(t.amount) as spent_amount
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      JOIN budgets b ON c.budget_id = b.id
      WHERE t.user_id = ?
        AND t.type = 'expense'
        AND t.date >= ?
        AND t.date <= ?
        AND b.user_id = ?
      GROUP BY c.id
    `).bind(userId, startDate, endDate, userId).all();
    
    const results = (spending.results || []).map(item => {
      const percentage = item.limit_amount > 0 
        ? (item.spent_amount / item.limit_amount) * 100 
        : 0;
      
      return {
        id: item.id,
        name: item.name,
        amount: parseFloat(item.spent_amount.toFixed(2)),
        limit: parseFloat(item.limit_amount.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
      };
    });
    
    return results;
  }
};