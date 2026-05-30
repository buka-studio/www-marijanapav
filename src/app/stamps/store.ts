import { create } from 'zustand';

import { CollectionType } from './constants';

interface StampStore {
  selectedStampId: string;
  collection: CollectionType;
  isZoomed: boolean;
  zoomEnabled: boolean;
  toggleZoomed: (force?: boolean) => void;
  setZoomed: (zoomed: boolean) => void;
  setSelectedStampId: (selectedStampId: string) => void;
  selectStamp: (
    selectedStampId: string,
    options?: { isZoomed?: boolean; zoomEnabled?: boolean },
  ) => void;
  setZoomEnabled: (zoomEnabled: boolean) => void;
  setCollection: (collection: CollectionType) => void;
  reset: () => void;
  stampsDrawerOpen: boolean;
  setStampsDrawerOpen: (stampsDrawerOpen: boolean) => void;
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
  selectStamp: (selectedStampId: string, options) =>
    set((state) => ({
      selectedStampId,
      zoomEnabled: options?.zoomEnabled ?? false,
      isZoomed: options?.isZoomed ?? state.isZoomed,
    })),
  setZoomEnabled: (zoomEnabled: boolean) => set({ zoomEnabled }),
  setCollection: (collection: CollectionType) => {
    set({ collection, selectedStampId: '' });
  },
  reset: () => set({ isZoomed: false, zoomEnabled: false, selectedStampId: '' }),
  stampsDrawerOpen: false,
  setStampsDrawerOpen: (state: boolean) => {
    if (!state) {
      set({ stampsDrawerOpen: false, isZoomed: false, zoomEnabled: false, selectedStampId: '' });
    } else {
      set({ stampsDrawerOpen: true });
    }
  },
}));
