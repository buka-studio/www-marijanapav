import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations/d1',
  dialect: 'sqlite',
  verbose: true,
  strict: true,
});
