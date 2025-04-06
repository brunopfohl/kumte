import { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware
 * @param err Error object
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  
  // Send error response
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
}; 