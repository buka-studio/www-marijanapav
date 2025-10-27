import { create } from 'zustand';

import { CollectionType } from './constants';

interface StampStore {
  selectedStampId: string;
  collection: CollectionType;
  zoomed: boolean;
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
  zoomed: false,
  zoomEnabled: false,
  toggleZoomed: () => set((state) => ({ zoomed: !state.zoomed })),
  setZoomed: (zoomed: boolean) => set({ zoomed }),
  setSelectedStampId: (selectedStampId: string) => set({ selectedStampId }),
  setZoomEnabled: (zoomEnabled: boolean) => set({ zoomEnabled }),
  setCollection: (collection: CollectionType) => {
    set({ collection, selectedStampId: '' });
  },
  reset: () => set({ zoomed: false, zoomEnabled: false }),
}));
