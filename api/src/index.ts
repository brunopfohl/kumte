import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

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
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 