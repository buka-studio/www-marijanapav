import { getCloudflareContext } from '@opennextjs/cloudflare';

export function getCloudflareEnv() {
  const { env } = getCloudflareContext();
  return env as Env;
}

export async function getCloudflareEnvAsync() {
  const { env } = await getCloudflareContext({ async: true });
  return env as Env;
}
