import { create } from 'zustand';

import { CollectionType } from './constants';

interface StampStore {
  selectedStampId: string;
  collection: CollectionType;
  isZoomed: boolean;
  zoomEnabled: boolean;
  toggleZoomed: () => void;
  setZoomed: (zoomed: boolean) => void;
  setSelectedStampId: (selectedStampId: string) => void;
  setZoomEnabled: (zoomEnabled: boolean) => void;
  setCollection: (collection: CollectionType) => void;
  reset: () => void;
}

export const useStampStore = create<StampStore>((set) => ({
  selectedStampId: '',
  collection: 'typographic' as CollectionType,
  isZoomed: false,
  zoomEnabled: false,
  toggleZoomed: (force?: boolean) => {
    set((state) => ({ isZoomed: force !== undefined ? force : !state.isZoomed }));
  },
  setZoomed: (zoomed: boolean) => set({ isZoomed: zoomed }),
  setSelectedStampId: (selectedStampId: string) => set({ selectedStampId }),
  setZoomEnabled: (zoomEnabled: boolean) => set({ zoomEnabled }),
  setCollection: (collection: CollectionType) => {
    set({ collection, selectedStampId: '' });
  },
  reset: () => set({ isZoomed: false, zoomEnabled: false, selectedStampId: '' }),
}));
