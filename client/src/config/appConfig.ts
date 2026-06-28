export const appConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  notificationPollingIntervalMs: Number(import.meta.env.VITE_NOTIFICATION_POLLING_INTERVAL_MS) || 30000,
};
