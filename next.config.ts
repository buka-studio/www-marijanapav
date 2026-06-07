import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import { existsSync } from 'node:fs';

const wranglerConfigPath = './wrangler.jsonc';

const nextConfig: NextConfig = {
  images: {
    qualities: [80, 90, 100],
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: [
                  {
                    name: 'preset-default',
                    params: {
                      overrides: {
                        cleanupIds: false,
                        removeViewBox: false,
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
        as: '*.js',
      },
      '*.{vert,frag}': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
};

export default function config(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER && existsSync(wranglerConfigPath)) {
    initOpenNextCloudflareForDev({
      configPath: wranglerConfigPath,
      persist: {
        path: './.alchemy/miniflare/v3',
      },
      remoteBindings: false,
    });
  }

  return nextConfig;
}
