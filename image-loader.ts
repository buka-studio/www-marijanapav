import type { ImageLoaderProps } from 'next/image';

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps) {
  const params = [`width=${width}`, `quality=${quality ?? 75}`, 'format=auto', 'onerror=redirect'];

  return `/cdn-cgi/image/${params.join(',')}/${src.replace(/^\//, '')}`;
}
