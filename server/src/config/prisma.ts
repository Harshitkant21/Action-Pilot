import { PrismaClient } from "@prisma/client";
import { appConfig } from './appConfig';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: appConfig.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
});

if (!appConfig.isProduction) {
  global.prisma = prisma;
}
