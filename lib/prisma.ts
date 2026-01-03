// lib/prisma.ts
// Prisma Client Singleton with Connection Pooling

import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: 'pretty',
  }).$extends({
    query: {
      $allOperations({ operation, model, args, query }) {
        const start = performance.now();
        return query(args).finally(() => {
          const end = performance.now();
          if (process.env.NODE_ENV === 'development' && end - start > 100) {
            console.warn(`Slow query [${model}.${operation}]: ${end - start}ms`);
          }
        });
      },
    },
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export { prisma };
export default prisma;
