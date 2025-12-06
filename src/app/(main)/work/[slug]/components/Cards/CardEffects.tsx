'use client';

import { Dialog } from 'radix-ui';

import { ExitIcon } from '~/src/components/icons';
import Button from '~/src/components/ui/Button';

import './CardEffects.css';

import Solitaire from './Solitaire';

export default function Effects({ onClose, effect }: { effect?: string; onClose?: () => void }) {
  return (
    <>
      <Dialog.Root open={Boolean(effect)} onOpenChange={onClose} modal={false}>
        <Dialog.Overlay className="effects-overlay fixed inset-0 bg-white in-[.theme-dark]:bg-black" />
        <Dialog.Content className="effects-content fixed left-1/2 top-1/2 z-10 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-white/70 in-[.theme-dark]:bg-black/50">
          <Dialog.Close className="fixed right-5 top-5 z-10 text-lg" asChild>
            <Button aria-label="Close" iconLeft={<ExitIcon />} />
          </Dialog.Close>
          {effect === 'solitaire' && <Solitaire cardSrc="" />}
          {/* {effect === 'memory' && <Memory />} */}
          {/* {effect === 'house-of-cards' && <HouseOfCards />} */}
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
