import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import { existsSync } from 'node:fs';

const wranglerConfigPath = './wrangler.jsonc';

// /cdn-cgi/image needs a zone with transformations enabled, so previews (workers.dev) and dev
// fall back to /_next/image via the IMAGES binding.
const useEdgeImages = process.env.NEXT_PUBLIC_IMAGE_EDGE === '1';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['rpavlini.local'],
  experimental: {
    optimizePackageImports: ['@react-three/drei'],
  },
  images: useEdgeImages
    ? { loader: 'custom', loaderFile: './image-loader.ts', qualities: [80, 90] }
    : { qualities: [80, 90] },
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
