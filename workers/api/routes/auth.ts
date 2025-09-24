import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { authController } from '../controllers/auth';
import { auth } from '../middleware/auth';
import { Database } from '../types';
import { getErrorMessage } from '../utils/errorHandler';

// Define the app with proper bindings
interface Bindings {
  DB: Database;
  JWT_SECRET: string;
  [key: string]: any;
}

const app = new Hono<{ Bindings: Bindings }>();

// Register a new user
app.post('/register', async (c) => {
  const body = await c.req.json();
  
  // Validate request body
  if (!body.name || !body.email || !body.password) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  try {
    const result = await authController.registerUser(c.env.DB, body);
    
    // Generate JWT token
    const token = await sign(
      { sub: result.id, email: result.email, name: result.name },
      c.env.JWT_SECRET || 'budge_development_secret'
    );
    
    return c.json({ 
      message: 'User registered successfully',
      token,
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
      }
    }, 201);
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Failed to register user') }, 400);
  }
});

// Login
app.post('/login', async (c) => {
  const body = await c.req.json();
  
  // Validate request body
  if (!body.email || !body.password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }
  
  try {
    const user = await authController.loginUser(c.env.DB, body.email, body.password);
    
    // Generate JWT token
    const token = await sign(
      { sub: user.id, email: user.email, name: user.name },
      c.env.JWT_SECRET || 'budge_development_secret'
    );
    
    return c.json({ 
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'Login failed') }, 401);
  }
});

// Get current user info
app.get('/me', auth(), async (c) => {
  const userId = c.get('userId');
  
  try {
    const user = await authController.getUserById(c.env.DB, userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error, 'User not found') }, 404);
  }
});

export default app;