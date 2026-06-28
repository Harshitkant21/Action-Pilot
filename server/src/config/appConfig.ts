import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1024).max(65535).default(3001),
  
  DATABASE_URL: z.string().refine(url => url.startsWith("postgresql://"), {
    message: "DATABASE_URL must start with postgresql://"
  }).default(
    isProduction ? "" : "postgresql://actionpilotdb:actionpilotdbpassword@localhost:5432/actionpilot?schema=public"
  ),
  
  REDIS_URL: z.string().refine(url => url.startsWith("redis://"), {
    message: "REDIS_URL must start with redis://"
  }).default('redis://localhost:6379'),

  JWT_SECRET: isProduction
    ? z.string().min(32, "JWT_SECRET must be at least 32 characters in production")
    : z.string().default("development-secret-key"),
    
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  GEMINI_API_KEY: isProduction
    ? z.string().min(1, "GEMINI_API_KEY is required in production")
    : z.string().default(""),
    
  VAPID_PUBLIC_KEY: isProduction
    ? z.string().min(1, "VAPID_PUBLIC_KEY is required in production")
    : z.string().default(""),
    
  VAPID_PRIVATE_KEY: isProduction
    ? z.string().min(1, "VAPID_PRIVATE_KEY is required in production")
    : z.string().default(""),

  CORS_ALLOWED_ORIGINS: z.string().optional(),

  STANDUP_COOLDOWN_HOURS: z.coerce.number().int().positive().default(22),
  RISK_COOLDOWN_HOURS: z.coerce.number().int().positive().default(4),
  RECOVERY_COOLDOWN_HOURS: z.coerce.number().int().positive().default(4),

  RISK_THRESHOLD: z.coerce.number().int().min(0).max(100).default(70),
  MONITORING_SWEEP_INTERVAL_MS: z.coerce.number().int().positive().default(3600000),
  GEMINI_RETRY_LIMIT: z.coerce.number().int().nonnegative().default(2),
});

// Parse the environment variables
const validatedEnv = (() => {
  const result = environmentSchema.safeParse(process.env);
  if (!result.success) {
    console.error('[Configuration] Invalid environment configuration variables:', result.error.format());
    throw new Error(`[Configuration] Invalid environment configuration: ${result.error.message}`);
  }
  
  // Validate production database URL is non-empty
  if (isProduction && !result.data.DATABASE_URL) {
    throw new Error("[Configuration] DATABASE_URL is required in production environment");
  }
  
  return result.data;
})();

const rawConfig = {
  port: validatedEnv.PORT,
  nodeEnv: validatedEnv.NODE_ENV,
  databaseUrl: validatedEnv.DATABASE_URL,
  redisUrl: validatedEnv.REDIS_URL,
  jwtSecret: validatedEnv.JWT_SECRET,
  jwtExpiresIn: validatedEnv.JWT_EXPIRES_IN,
  geminiApiKey: validatedEnv.GEMINI_API_KEY,
  vapidPublicKey: validatedEnv.VAPID_PUBLIC_KEY,
  vapidPrivateKey: validatedEnv.VAPID_PRIVATE_KEY,

  corsAllowedOrigins: validatedEnv.CORS_ALLOWED_ORIGINS
    ? validatedEnv.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : !isProduction
      ? [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:3001',
        ]
      : [],

  standupCooldownHours: validatedEnv.STANDUP_COOLDOWN_HOURS,
  riskCooldownHours: validatedEnv.RISK_COOLDOWN_HOURS,
  recoveryCooldownHours: validatedEnv.RECOVERY_COOLDOWN_HOURS,
  riskThreshold: validatedEnv.RISK_THRESHOLD,
  monitoringSweepIntervalMs: validatedEnv.MONITORING_SWEEP_INTERVAL_MS,
  geminiRetryLimit: validatedEnv.GEMINI_RETRY_LIMIT,

  // Derived helper configuration flags
  isDevelopment: validatedEnv.NODE_ENV === 'development',
  isProduction: validatedEnv.NODE_ENV === 'production',
  isTest: validatedEnv.NODE_ENV === 'test',
};

export const appConfig = Object.freeze(rawConfig);

export type AppConfig = typeof appConfig;
