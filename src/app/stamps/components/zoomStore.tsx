import { create } from 'zustand';

interface ZoomState {
  zoomed: boolean;
  zoomable: boolean;
  setZoomed: (zoomed: boolean) => void;
  setZoomable: (zoomable: boolean) => void;
  reset: () => void;
}

export const useZoomStore = create<ZoomState>((set) => ({
  zoomed: false,
  zoomable: false,
  setZoomed: (zoomed: boolean) => set({ zoomed }),
  setZoomable: (zoomable: boolean) => set({ zoomable }),
  reset: () => set({ zoomed: false, zoomable: false }),
}));
