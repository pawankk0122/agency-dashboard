import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@agency_postgres:5432/agency_db?schema=public',
  },
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@agency_postgres:5432/agency_db?schema=public',
    },
  },
});

