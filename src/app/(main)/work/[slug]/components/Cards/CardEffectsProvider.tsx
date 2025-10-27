'use client';

import { createContext, useContext, useRef, useState } from 'react';

const cardEffects = ['solitaire'] as const; //, "memory", "house-of-cards"] as const;
type CardEffect = (typeof cardEffects)[number];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const CardEffectsContext = createContext<{
  effect: CardEffect | null;
  pickEffect(): void;
  closeEffect(): void;
}>({ effect: null, pickEffect: () => {}, closeEffect: () => {} });

export function useCardEffects() {
  return useContext(CardEffectsContext);
}

export default function CardEffectsProvider({ children }: { children: React.ReactNode }) {
  const [effect, setEffect] = useState<CardEffect | null>(null);
  const availableEffects = useRef([...cardEffects]);

  function pickEffect() {
    if (availableEffects.current.length === 0) {
      availableEffects.current = [...cardEffects];
    }

    const index = randomInt(0, availableEffects.current.length - 1);
    availableEffects.current.splice(index, 1);

    setEffect(cardEffects[index]);
  }

  function closeEffect() {
    setEffect(null);
  }

  return (
    <CardEffectsContext.Provider value={{ effect, pickEffect, closeEffect }}>
      {children}
    </CardEffectsContext.Provider>
  );
}
