'use client';

import { SoundProvider as SoundProviderBase } from '@web-kits/audio/react';
import { useState } from 'react';

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.8);

  return (
    <SoundProviderBase
      enabled={enabled}
      volume={volume}
      onEnabledChange={setEnabled}
      onVolumeChange={setVolume}
    >
      {children}
    </SoundProviderBase>
  );
}
