import { create } from 'zustand';

import { CollectionType } from './constants';

function restLoupe() {
  return {
    loupeCoords: { x: 0, y: 0 },
    loupeScale: 2,
  };
}

function clearedSelection() {
  return {
    selectedStampId: '',
    isZoomed: false,
    ...restLoupe(),
  };
}

interface StampStore {
  selectedStampId: string;
  collection: CollectionType;
  isZoomed: boolean;
  loupeCoords: { x: number; y: number };
  loupeScale: number;
  stampsDrawerOpen: boolean;
  overlayOpen: boolean;
  selectStamp: (selectedStampId: string) => void;
  deselectStamp: () => void;
  setZoomed: (isZoomed: boolean) => void;
  setLoupeCoords: (loupeCoords: { x: number; y: number }) => void;
  setLoupeScale: (loupeScale: number) => void;
  setCollection: (collection: CollectionType) => void;
  setStampsDrawerOpen: (stampsDrawerOpen: boolean) => void;
  setOverlayOpen: (overlayOpen: boolean) => void;
}

export const useStampStore = create<StampStore>((set) => ({
  selectedStampId: '',
  collection: 'typographic' as CollectionType,
  isZoomed: false,
  ...restLoupe(),
  stampsDrawerOpen: false,
  overlayOpen: false,
  selectStamp: (selectedStampId) =>
    set({
      selectedStampId,
      isZoomed: false,
      ...restLoupe(),
    }),
  deselectStamp: () => set(clearedSelection()),
  setZoomed: (isZoomed) => set({ isZoomed }),
  setLoupeCoords: (loupeCoords) => set({ loupeCoords }),
  setLoupeScale: (loupeScale) => set({ loupeScale }),
  setCollection: (collection) => set({ collection, ...clearedSelection() }),
  setStampsDrawerOpen: (stampsDrawerOpen) => {
    if (stampsDrawerOpen) {
      set({ stampsDrawerOpen: true });
      return;
    }
    set({ stampsDrawerOpen: false, ...clearedSelection() });
  },
  setOverlayOpen: (overlayOpen) => set({ overlayOpen }),
}));
