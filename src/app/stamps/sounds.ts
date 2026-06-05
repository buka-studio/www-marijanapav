'use client';

import type { SoundDefinition } from '@web-kits/audio';
import { useSound } from '@web-kits/audio/react';

export const loupeActivationSound = {
  layers: [
    {
      source: { type: 'noise', color: 'white' },
      envelope: { decay: 0.006 },
      filter: [
        { type: 'highpass', frequency: 1800, resonance: 0.15 },
        { type: 'lowpass', frequency: 10000, resonance: 0.2 },
      ],
      gain: 0.072,
    },
    {
      source: { type: 'triangle', frequency: 4100 },
      envelope: { decay: 0.012 },
      filter: { type: 'highpass', frequency: 2200, resonance: 0.2 },
      delay: 0.002,
      gain: 0.024,
    },
    {
      source: { type: 'triangle', frequency: 2850 },
      envelope: { decay: 0.018 },
      filter: { type: 'lowpass', frequency: 5200, resonance: 0.25 },
      delay: 0.006,
      gain: 0.018,
    },
  ],
  effects: [{ type: 'compressor', threshold: -23, ratio: 3, attack: 0.001, release: 0.025 }],
} satisfies SoundDefinition;

export const loupeDeactivationSound = {
  layers: [
    {
      source: { type: 'noise', color: 'white' },
      envelope: { decay: 0.005 },
      filter: [
        { type: 'highpass', frequency: 1400, resonance: 0.15 },
        { type: 'lowpass', frequency: 7600, resonance: 0.2 },
      ],
      gain: 0.052,
    },
    {
      source: { type: 'triangle', frequency: 2800 },
      envelope: { decay: 0.014 },
      filter: { type: 'lowpass', frequency: 5200, resonance: 0.25 },
      delay: 0.004,
      gain: 0.016,
    },
    {
      source: { type: 'triangle', frequency: 1800 },
      envelope: { decay: 0.028 },
      filter: { type: 'lowpass', frequency: 3800, resonance: 0.25 },
      delay: 0.012,
      gain: 0.014,
    },
  ],
  effects: [{ type: 'compressor', threshold: -25, ratio: 2.6, attack: 0.001, release: 0.035 }],
} satisfies SoundDefinition;

export const loupeZoomClickSound = {
  layers: [
    {
      source: { type: 'triangle', frequency: 5200 },
      envelope: { attack: 0.003, decay: 0.014 },
      filter: { type: 'highpass', frequency: 3200, resonance: 0.12 },
      gain: 0.012,
    },
    {
      source: { type: 'triangle', frequency: 6800 },
      envelope: { attack: 0.002, decay: 0.01 },
      filter: { type: 'highpass', frequency: 4200, resonance: 0.1 },
      delay: 0.002,
      gain: 0.004,
    },
  ],
  effects: [{ type: 'gain', value: 0.55 }],
} satisfies SoundDefinition;

export function usePlayLoupeActivationSound() {
  const play = useSound(loupeActivationSound);
  return play;
}

export function usePlayLoupeDeactivationSound() {
  const play = useSound(loupeDeactivationSound);
  return play;
}

export function usePlayLoupeZoomClick() {
  const play = useSound(loupeZoomClickSound);
  return play;
}
