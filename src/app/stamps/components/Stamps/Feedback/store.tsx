import * as THREE from 'three';
import { create } from 'zustand';

interface FeedbackStore {
  isOpen: boolean;
  isRevealed: boolean;
  setIsRevealed: (isRevealed: boolean) => void;
  setIsOpen: (isOpen: boolean) => void;
  snapshots: Record<string, Snapshot>;
}

type Snapshot = {
  canvas: HTMLCanvasElement;
  texture: THREE.Texture;
  width: number;
  height: number;
};

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  isOpen: false,
  isRevealed: false,
  setIsOpen: (isOpen: boolean) => set({ isOpen }),
  snapshots: {},
  captureSnapshot: async (target: HTMLElement, key: string): Promise<Snapshot | null> => {
    return null;
  },
  setIsRevealed: (isRevealed: boolean) => set({ isRevealed }),
}));
