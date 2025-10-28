import { SmileyIcon } from '@phosphor-icons/react';
import { useCallback } from 'react';

import { cn } from '~/src/util';

import { collectionTypes } from '../../constants';
import { useStampStore } from '../../store';

export function Footer({ className }: { className?: string }) {
  const store = useStampStore();
  const collectionIndex = collectionTypes.indexOf(store.collection);

  const indexLabel = String(collectionIndex + 1).padStart(2, '0');

  const handlePreviousCollection = useCallback(() => {
    const prevIndex = (collectionIndex - 1 + collectionTypes.length) % collectionTypes.length;
    store.setCollection(collectionTypes[prevIndex]);
  }, [collectionIndex, store]);

  const handleNextCollection = useCallback(() => {
    const nextIndex = (collectionIndex + 1) % collectionTypes.length;
    store.setCollection(collectionTypes[nextIndex]);
  }, [collectionIndex, store]);

  return (
    <div
      className={cn(
        'grid grid-cols-2 items-center justify-center justify-items-center gap-2 py-2 font-mono text-xs font-bold uppercase text-stone-400 lg:grid-cols-3',
        {
          'blur-sm': store.selectedStampId,
        },
        className,
      )}
    >
      <div className="mr-auto flex items-center gap-2 font-mono">
        Leuchtturm <SmileyIcon className="hidden h-4 w-4 lg:block" weight='bold' />{' '}
        <span className="hidden lg:block">G-System</span>
      </div>
      <div className="hidden lg:block">2020-{new Date().getFullYear()}</div>
      <div className="ml-auto flex items-center gap-2">
        <div>{store.collection}</div>
        <div>{indexLabel} </div>

        <div className="flex items-center gap-2 text-[0.5rem]">
          <button aria-label="Previous collection" onClick={handlePreviousCollection}>
            ◄
          </button>
          <button aria-label="Next collection" onClick={handleNextCollection}>
            ►
          </button>
        </div>
      </div>
    </div>
  );
}
