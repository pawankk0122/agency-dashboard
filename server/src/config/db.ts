import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgrespassword@agency_postgres:5432/agency_db?schema=public';

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});
