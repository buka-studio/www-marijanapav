'use client';

import { ErrorBoundary } from 'react-error-boundary';

import PhotosCard from '../PhotosCard';
import type { PhotoDistortParams } from './params';
import WebglCard from './WebglCard';

export default function PhotosCardWebgl(props: { params?: PhotoDistortParams }) {
  return (
    <div className="h-full min-w-0">
      <ErrorBoundary
        fallback={<PhotosCard />}
        onError={(error, errorInfo) => {
          console.error('WebGL photo card failed to render.', error, errorInfo);
        }}
      >
        <WebglCard {...props} />
      </ErrorBoundary>
    </div>
  );
}
