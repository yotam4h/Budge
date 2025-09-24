import { verify } from 'hono/jwt';
import { Context, Next } from 'hono';

interface Bindings {
  DB: any;
  JWT_SECRET: string;
  [key: string]: any;
}

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
  }
}

export const auth = () => {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    try {
      // Get the JWT token from the Authorization header
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized - Missing or invalid token' }, 401);
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify the token
      const payload = await verify(token, c.env.JWT_SECRET || 'budge_development_secret');
      
      // Set user ID in the context for later use
      c.set('userId', payload.sub);
      
      // Continue to the next middleware or route handler
      await next();
    } catch (error) {
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }
  };
};