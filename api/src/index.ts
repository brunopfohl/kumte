import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { errorHandler } from './middleware/error.middleware';
import localtunnel from 'localtunnel';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;
// Use a static subdomain for consistency
const subdomain = process.env.TUNNEL_SUBDOMAIN || 'kumte-pdf-api-8749';

// Middleware
app.use(express.json());

// CORS middleware
const corsMiddleware = ((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
}) as express.RequestHandler;

app.use(corsMiddleware);

// Create routes and controllers directories if they don't exist
const routesDir = path.join(__dirname, 'routes');
const controllersDir = path.join(__dirname, 'controllers');
const servicesDir = path.join(__dirname, 'services');
const middlewareDir = path.join(__dirname, 'middleware');

if (!fs.existsSync(routesDir)) {
  fs.mkdirSync(routesDir, { recursive: true });
}

if (!fs.existsSync(controllersDir)) {
  fs.mkdirSync(controllersDir, { recursive: true });
}

if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir, { recursive: true });
}

if (!fs.existsSync(middlewareDir)) {
  fs.mkdirSync(middlewareDir, { recursive: true });
}

// Routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'API is running' });
});

// Import routes
try {
  const geminiRoutes = require('./routes/gemini.routes').default;
  app.use('/api/gemini', geminiRoutes);
} catch (error) {
  console.error('Error loading gemini routes:', error);
}

// Error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  
  // Setup localtunnel to expose the API
  setupTunnel();
});

/**
 * Setup localtunnel to expose the API to the internet
 */
async function setupTunnel() {
  try {
    const tunnel = await localtunnel({ 
      port: Number(port),
      subdomain: subdomain 
    });
    
    console.log(`
    ============================================
    🌍 API available through tunnel:
    ${tunnel.url}
    
    Access Gemini API at:
    ${tunnel.url}/api/gemini
    ============================================
    `);
    
    // Handle tunnel closure
    tunnel.on('close', () => {
      console.log('Tunnel closed');
      // You could attempt to reopen the tunnel here if needed
    });
    
    // Handle tunnel errors
    tunnel.on('error', (err: Error) => {
      console.error('Tunnel error:', err);
      console.log('Attempting to reopen tunnel in 10 seconds...');
      setTimeout(setupTunnel, 10000);
    });
    
  } catch (error) {
    console.error('Failed to create tunnel:', error);
    console.log('Attempting to restart tunnel in 10 seconds...');
    setTimeout(setupTunnel, 10000);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
}); 