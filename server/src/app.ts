import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import goalRoutes from './routes/goal.routes';
import taskRoutes from './routes/task.routes';
import progressRoutes from './routes/progress.routes';
import aiRoutes from './routes/ai.routes';

const app = express();

// Generic Middlewares
app.use(cors());
app.use(express.json());

// API Base Path: /api/v1
// Health Check Route
app.use('/api/v1/health', healthRoutes);
// Authentication Routes
app.use('/api/v1/auth', authRoutes);
// Goals Routes
app.use('/api/v1/goals', goalRoutes);
// Tasks Routes
app.use('/api/v1/tasks', taskRoutes);
// Progress Routes
app.use('/api/v1/progress', progressRoutes);
// AI Agent Routes
app.use('/api/v1/ai', aiRoutes);

// Fallback Route for Undefined Paths
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Centralized Error Handling Middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
