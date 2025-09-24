import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [
    // Enable React for interactive components
    react(),
    
    // Enable Tailwind CSS
    tailwind({
      // Configure Tailwind if needed
    }),
  ],
  
  // Deploy to Cloudflare Pages
  output: 'server',
  adapter: cloudflare(),
  
  // Configure Vite
  vite: {
    build: {
      // Configure build options if needed
    },
  },
});