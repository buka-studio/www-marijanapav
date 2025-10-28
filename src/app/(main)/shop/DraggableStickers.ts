'use client';

import dynamic from 'next/dynamic';

const DraggableStickers = dynamic(() => import('./components/DraggableStickers'), { ssr: false });

export default DraggableStickers;
