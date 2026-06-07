import alchemy from 'alchemy';
import { D1Database, Images, Nextjs, R2Bucket } from 'alchemy/cloudflare';
import { GitHubComment } from 'alchemy/github';
import { CloudflareStateStore, FileSystemStateStore } from 'alchemy/state';

const app = await alchemy('www-marijanasimag', {
  password: process.env.ALCHEMY_PASSWORD,
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

const isProduction = app.stage === 'production';
const stageSlug =
  app.stage
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'development';
const resourceSuffix = isProduction ? '' : `-${stageSlug}`;
const cloudflareZoneId = process.env.CLOUDFLARE_ZONE_ID;
const pullRequestNumber = Number(process.env.PULL_REQUEST);
const githubRepositoryParts = process.env.GITHUB_REPOSITORY?.split('/') ?? [];
const githubOwner = process.env.GITHUB_REPOSITORY_OWNER ?? githubRepositoryParts[0];
const githubRepository = githubRepositoryParts[1];
const shortSha = process.env.GITHUB_SHA?.slice(0, 7) ?? 'local';

if (isProduction && !cloudflareZoneId) {
  throw new Error('Missing CLOUDFLARE_ZONE_ID for production custom domains.');
}

export const db = await D1Database('site-db', {
  name: `marijana-site-db${resourceSuffix}`,
  adopt: true,
  migrationsDir: './migrations/d1',
  jurisdiction: 'eu',
});

export const sketches = await R2Bucket('sketches', {
  name: `marijana-sketches${resourceSuffix}`,
  adopt: true,
  empty: !isProduction,
});

export const images = Images();

export const website = await Nextjs('website', {
  adopt: true,
  url: !isProduction,
  domains: isProduction
    ? [
        {
          domainName: 'marijanapav.com',
          zoneId: cloudflareZoneId,
          adopt: true,
        },
        {
          domainName: 'www.marijanapav.com',
          zoneId: cloudflareZoneId,
          adopt: true,
        },
      ]
    : undefined,
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
    NEXT_PUBLIC_HOST: isProduction ? (process.env.NEXT_PUBLIC_HOST ?? 'marijanapav.com') : '',
    NEXT_PUBLIC_BUILD_TIME: `${Math.floor(Date.now() / 1000)}`,
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: isProduction
      ? (process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? '')
      : '',
  },
});

if (
  Number.isInteger(pullRequestNumber) &&
  pullRequestNumber > 0 &&
  githubOwner &&
  githubRepository
) {
  await GitHubComment('pr-preview-comment', {
    owner: githubOwner,
    repository: githubRepository,
    issueNumber: pullRequestNumber,
    allowDelete: false,
    body: `## Preview deployed

Preview URL: ${website.url ?? 'pending'}

Stage: \`${app.stage}\`
Commit: \`${shortSha}\`

This comment updates when new commits are pushed to this PR.`,
  });
}

console.log({
  url: website.url,
});

await app.finalize();
