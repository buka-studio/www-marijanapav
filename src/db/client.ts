import { drizzle } from 'drizzle-orm/d1';

import { getCloudflareEnv } from '~/src/cloudflare/env';

import * as schema from './schema';

export function getDb(env = getCloudflareEnv()) {
  return drizzle(env.DB, { schema });
}
