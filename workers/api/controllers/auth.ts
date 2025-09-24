import { compare, hash } from 'bcryptjs';
import { nanoid } from 'nanoid';
import { Database, User, RegisterData, LoginData, AuthResponse } from '../types';

export const authController = {
  async registerUser(db: Database, userData: RegisterData): Promise<Omit<User, 'password_hash'>> {
    const { name, email, password } = userData;
    
    // Check if user already exists
    const existingUser = await db.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();
    
    if (existingUser) {
      throw new Error('Email already in use');
    }
    
    // Hash the password
    const hashedPassword = await hash(password, 10);
    
    // Create the user
    const userId = nanoid();
    const timestamp = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      name,
      email,
      hashedPassword,
      timestamp,
      timestamp
    ).run();
    
    // Return the user (without password)
    const user: Omit<User, 'password_hash'> = {
      id: userId,
      name,
      email,
      created_at: timestamp,
      updated_at: timestamp,
    };
    return user;
  },
  
  async loginUser(db: Database, email: string, password: string): Promise<Omit<User, 'password_hash'>> {
    // Find the user
    const user = await db.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first() as User | null;
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Check password
    const passwordValid = await compare(password, user.password_hash);
    
    if (!passwordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Return the user (without password)
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  async getUserById(db: Database, userId: string): Promise<Omit<User, 'password_hash'> | null> {
    // Get user by ID
    const user = await db.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first() as User | null;
    
    if (!user) {
      return null;
    }
    
    // Remove password from user object
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
};