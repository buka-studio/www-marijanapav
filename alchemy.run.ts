import alchemy from 'alchemy';
import { D1Database, Images, Nextjs, R2Bucket } from 'alchemy/cloudflare';
import { CloudflareStateStore, FileSystemStateStore } from 'alchemy/state';

const app = await alchemy('www-marijanasimag', {
  stateStore: (scope) => {
    if (scope.local) {
      return new FileSystemStateStore(scope);
    }

    if (!process.env.ALCHEMY_STATE_TOKEN) {
      if (process.env.CI) {
        throw new Error('Missing ALCHEMY_STATE_TOKEN for CI deploy.');
      }

      return new FileSystemStateStore(scope);
    }

    return new CloudflareStateStore(scope, {
      scriptName: 'www-marijanasimag-alchemy-state',
    });
  },
});

export const db = await D1Database('site-db', {
  name: 'marijana-site-db',
  adopt: true,
  migrationsDir: './migrations/d1',
  jurisdiction: 'eu',
});

export const sketches = await R2Bucket('sketches', {
  name: 'marijana-sketches',
  adopt: true,
});

export const images = Images();

export const website = await Nextjs('website', {
  adopt: true,
  domains: [
    {
      domainName: 'marijanapav.com',
      adopt: true,
    },
    {
      domainName: 'www.marijanapav.com',
      adopt: true,
    },
  ],
  wrangler: {
    transform: (spec) => ({
      ...spec,
      keep_names: false,
    }),
  },
  bindings: {
    DB: db,
    SKETCHES: sketches,
    IMAGES: images,
    NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST ?? '',
    NEXT_PUBLIC_BUILD_TIME: `${Math.floor(Date.now() / 1000)}`,
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? '',
  },
});

console.log({
  url: website.url,
});

await app.finalize();
