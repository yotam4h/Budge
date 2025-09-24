import { nanoid } from 'nanoid';
import { Database, Budget, Category, BudgetData } from '../types';

interface CategoryData {
  id?: string;
  name: string;
  amount: number;
  period?: string;
}

interface BudgetInput {
  monthlyIncome: number;
  categories?: CategoryData[];
}

interface CategorySummary {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  percentage: number;
}

export const budgetController = {
  async getBudgetByUserId(db: Database, userId: string): Promise<Budget & { categories: Category[] }> {
    // Get the user's budget
    const budget = await db.prepare(`
      SELECT * FROM budgets WHERE user_id = ?
    `).bind(userId).first();
    
    if (!budget) {
      throw new Error('Budget not found');
    }
    
    // Get the categories for this budget
    const categories = await db.prepare(`
      SELECT * FROM categories WHERE budget_id = ?
    `).bind(budget.id).all();
    
    return {
      ...budget,
      categories: categories.results || []
    };
  },
  
  async createOrUpdateBudget(db: Database, userId: string, budgetData: BudgetInput): Promise<Budget & { categories: Category[] }> {
    const { monthlyIncome, categories = [] } = budgetData;
    const timestamp = new Date().toISOString();
    
    // Check if user already has a budget
    const existingBudget = await db.prepare(`
      SELECT * FROM budgets WHERE user_id = ?
    `).bind(userId).first();
    
    let budgetId;
    
    if (existingBudget) {
      // Update existing budget
      budgetId = existingBudget.id;
      
      await db.prepare(`
        UPDATE budgets 
        SET monthly_income = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        monthlyIncome, 
        timestamp, 
        budgetId
      ).run();
    } else {
      // Create new budget
      budgetId = nanoid();
      
      await db.prepare(`
        INSERT INTO budgets (id, user_id, monthly_income, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        budgetId,
        userId,
        monthlyIncome,
        timestamp,
        timestamp
      ).run();
    }
    
    // Process categories if provided
    if (categories && categories.length > 0) {
      // Handle categories - create or update them
      for (const category of categories) {
        if (category.id) {
          // Update existing category
          await db.prepare(`
            UPDATE categories
            SET name = ?, amount = ?, period = ?, updated_at = ?
            WHERE id = ? AND budget_id = ?
          `).bind(
            category.name,
            category.amount,
            category.period || 'monthly',
            timestamp,
            category.id,
            budgetId
          ).run();
        } else {
          // Create new category
          await db.prepare(`
            INSERT INTO categories (id, budget_id, name, amount, period, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            nanoid(),
            budgetId,
            category.name,
            category.amount,
            category.period || 'monthly',
            timestamp,
            timestamp
          ).run();
        }
      }
    }
    
    // Return the updated budget
    return this.getBudgetByUserId(db, userId);
  },
  
  async getCategoriesByUserId(db: Database, userId: string): Promise<Category[]> {
    // First, get the user's budget
    const budget = await db.prepare(`
      SELECT id FROM budgets WHERE user_id = ?
    `).bind(userId).first();
    
    if (!budget) {
      return []; // No budget yet
    }
    
    // Get all categories for this budget
    const categories = await db.prepare(`
      SELECT * FROM categories 
      WHERE budget_id = ?
      ORDER BY name ASC
    `).bind(budget.id).all();
    
    return categories.results || [];
  },
  
  async createCategory(db: Database, userId: string, categoryData: CategoryData): Promise<Category> {
    const { name, amount, period = 'monthly' } = categoryData;
    
    if (!name || amount === undefined) {
      throw new Error('Category name and amount are required');
    }
    
    // Get the user's budget
    const budget = await db.prepare(`
      SELECT id FROM budgets WHERE user_id = ?
    `).bind(userId).first();
    
    if (!budget) {
      throw new Error('Budget not found. Please create a budget first.');
    }
    
    const categoryId = nanoid();
    const timestamp = new Date().toISOString();
    
    // Create the category
    await db.prepare(`
      INSERT INTO categories (id, budget_id, name, amount, period, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      categoryId,
      budget.id,
      name,
      amount,
      period,
      timestamp,
      timestamp
    ).run();
    
    // Return the new category
    return {
      id: categoryId,
      budget_id: budget.id,
      name,
      amount,
      period,
      created_at: timestamp,
      updated_at: timestamp
    };
  },
  
  async updateCategory(db: Database, userId: string, categoryId: string, categoryData: Partial<CategoryData>): Promise<Category> {
    const { name, amount, period } = categoryData;
    const timestamp = new Date().toISOString();
    
    // Verify ownership by checking if category belongs to user's budget
    const validCategory = await db.prepare(`
      SELECT c.* 
      FROM categories c
      JOIN budgets b ON c.budget_id = b.id
      WHERE c.id = ? AND b.user_id = ?
    `).bind(categoryId, userId).first();
    
    if (!validCategory) {
      throw new Error('Category not found or does not belong to your budget');
    }
    
    // Build the update query dynamically based on provided fields
    let updateFields = [];
    let params = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    
    if (amount !== undefined) {
      updateFields.push('amount = ?');
      params.push(amount);
    }
    
    if (period !== undefined) {
      updateFields.push('period = ?');
      params.push(period);
    }
    
    // Always update the updated_at timestamp
    updateFields.push('updated_at = ?');
    params.push(timestamp);
    
    // Add the WHERE clause parameters
    params.push(categoryId);
    
    if (updateFields.length === 1) {
      // Only the timestamp is being updated, nothing changed
      throw new Error('No changes to update');
    }
    
    // Update the category
    await db.prepare(`
      UPDATE categories
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...params).run();
    
    // Return the updated category
    const updatedCategory = await db.prepare(`
      SELECT * FROM categories WHERE id = ?
    `).bind(categoryId).first();
    
    return updatedCategory;
  },
  
  async deleteCategory(db: Database, userId: string, categoryId: string): Promise<boolean> {
    // Verify ownership by checking if category belongs to user's budget
    const validCategory = await db.prepare(`
      SELECT c.* 
      FROM categories c
      JOIN budgets b ON c.budget_id = b.id
      WHERE c.id = ? AND b.user_id = ?
    `).bind(categoryId, userId).first();
    
    if (!validCategory) {
      throw new Error('Category not found or does not belong to your budget');
    }
    
    // Check if there are transactions with this category
    const transactions = await db.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE category_id = ?
    `).bind(categoryId).first();
    
    // If there are transactions, update them to have a null category
    if (transactions.count > 0) {
      await db.prepare(`
        UPDATE transactions
        SET category_id = NULL
        WHERE category_id = ?
      `).bind(categoryId).run();
    }
    
    // Delete the category
    await db.prepare(`
      DELETE FROM categories
      WHERE id = ?
    `).bind(categoryId).run();
    
    return true;
  },
  
  async getBudgetSummary(db: Database, userId: string): Promise<CategorySummary[]> {
    // First, get the user's budget and categories
    const budget = await db.prepare(`
      SELECT * FROM budgets WHERE user_id = ?
    `).bind(userId).first();
    
    if (!budget) {
      throw new Error('Budget not found');
    }
    
    const categories = await db.prepare(`
      SELECT * FROM categories WHERE budget_id = ?
    `).bind(budget.id).all();
    
    if (!categories.results || categories.results.length === 0) {
      return [];
    }
    
    // Get the current month's start and end dates
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    // Calculate spending for each category in the current month
    const summaryPromises = categories.results.map(async (category: Category) => {
      const spending = await db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as spent
        FROM transactions
        WHERE user_id = ?
          AND category_id = ?
          AND type = 'expense'
          AND date >= ?
          AND date <= ?
      `).bind(userId, category.id, firstDay, lastDay).first();
      
      const spent = spending ? spending.spent : 0;
      const percentage = category.amount > 0 ? (spent / category.amount) * 100 : 0;
      
      return {
        id: category.id,
        name: category.name,
        budgeted: category.amount,
        spent,
        percentage: parseFloat(percentage.toFixed(2)),
      };
    });
    
    const summaries = await Promise.all(summaryPromises);
    return summaries;
  },
};