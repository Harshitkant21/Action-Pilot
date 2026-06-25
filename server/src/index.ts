import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import app from './app';
import { prisma } from './config/prisma';

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
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
