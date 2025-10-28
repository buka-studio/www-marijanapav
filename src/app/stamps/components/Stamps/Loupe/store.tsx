import { create } from 'zustand';

export interface LoupeStore {
  coords: { x: number; y: number };
  angle: number;
  scale: number;
  setCoords: (coords: { x: number; y: number }) => void;
  setAngle: (angle: number) => void;
  setScale: (scale: number) => void;
}

export const useLoupeStore = create<LoupeStore>((set) => ({
  coords: { x: 0, y: 0 },
  angle: 0,
  scale: 2,
  setCoords: (coords: { x: number; y: number }) => set({ coords }),
  setAngle: (angle: number) => set({ angle }),
  setScale: (scale: number) => set({ scale }),
}));
