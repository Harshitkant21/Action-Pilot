import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import app from './app';
import { prisma } from './config/prisma';
import { setupRepeatableJobs } from './queues/monitoring.queue';
import './workers/monitoring.worker'; // Boot background worker

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  try {
    // Verify database connection on startup
    console.log('Connecting to PostgreSQL database...');
    await prisma.$connect();
    console.log('Database connection established successfully.');

    // Start Express listener
    app.listen(PORT, () => {
      console.log(`[Server] ActionPilot backend running on port ${PORT}`);
      // Initialize BullMQ jobs
      setupRepeatableJobs().then(() => {
        console.log('[Server] Background jobs initialized.');
      }).catch(err => {
        console.error('[Server] Failed to initialize repeatable background jobs:', err);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
