import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const monitoringQueue = new Queue('monitoring-queue', {
  connection: redisConnection,
});

export const setupRepeatableJobs = async () => {
  try {
    // Remove existing repeatable jobs to avoid duplicates on restarts/hot-reloads
    const repeatableJobs = await monitoringQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await monitoringQueue.removeRepeatableByKey(job.key);
    }

    // Schedule 'check-active-goals' to run every hour: '0 * * * *'
    await monitoringQueue.add(
      'check-active-goals',
      {},
      {
        repeat: {
          pattern: '0 * * * *',
        },
      }
    );
    console.log('[Queue] Periodic monitoring job scheduled successfully (every hour).');
  } catch (error) {
    console.error('[Queue] Failed to setup repeatable jobs:', error);
  }
};

export const queueMonitoringSweep = async () => {
  await monitoringQueue.add('check-active-goals', {});
  console.log('[Queue] On-demand monitoring job added to queue.');
};
