import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import dotenv from 'dotenv';

dotenv.config();

let prisma;

try {
  const dbUrl = new URL(process.env.DATABASE_URL);
  
  const adapter = new PrismaMariaDb({
    host: dbUrl.hostname,
    port: dbUrl.port ? parseInt(dbUrl.port) : 3306,
    user: dbUrl.username,
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.slice(1),
    connectionLimit: 5,
  });

  prisma = new PrismaClient({ adapter });
} catch (error) {
  console.error('Failed to initialize Prisma Client with MySQL Adapter:', error);
}

export { prisma };
