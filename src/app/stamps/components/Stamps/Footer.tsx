import { SmileyIcon } from '@phosphor-icons/react';
import { ComponentProps, useCallback } from 'react';

import { cn } from '~/src/util';

import { collections, CollectionType, collectionTypes } from '../../constants';
import { useStampStore } from '../../store';

function CollectionButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'text-stone-400 hover:text-stone-600  focus:outline-none focus-visible:text-stone-600 focus-visible:outline-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function getPreviousCollectionIndex(collectionIndex: number) {
  return (collectionIndex - 1 + collectionTypes.length) % collectionTypes.length;
}

function getNextCollectionIndex(collectionIndex: number) {
  return (collectionIndex + 1) % collectionTypes.length;
}

export function Footer({
  className,
  onSelectCollection,
  children,
}: {
  className?: string;
  onSelectCollection: (collection: CollectionType) => void;
  children?: React.ReactNode;
}) {
  const store = useStampStore();
  const collectionIndex = collectionTypes.indexOf(store.collection);

  const indexLabel = String(collectionIndex + 1).padStart(2, '0');

  const handlePreviousCollection = useCallback(() => {
    const prevIndex = getPreviousCollectionIndex(collectionIndex);
    onSelectCollection(collectionTypes[prevIndex]);
  }, [collectionIndex, onSelectCollection]);

  const handleNextCollection = useCallback(() => {
    const nextIndex = getNextCollectionIndex(collectionIndex);
    onSelectCollection(collectionTypes[nextIndex]);
  }, [collectionIndex, onSelectCollection]);

  const prevCollection = collectionTypes[getPreviousCollectionIndex(collectionIndex)];
  const nextCollection = collectionTypes[getNextCollectionIndex(collectionIndex)];

  const nextDisabled = collections[nextCollection].stamps.length === 0;
  const prevDisabled = collections[prevCollection].stamps.length === 0;

  return (
    <div
      className={cn(
        'grid grid-cols-1 items-center justify-center justify-items-center gap-2 py-2 font-mono text-xs font-bold uppercase text-stone-400 lg:grid-cols-3',
        className,
      )}
    >
      <div className="mr-auto hidden items-center gap-2 font-mono lg:flex">
        Leuchtturm <SmileyIcon className="hidden h-4 w-4 lg:block" weight="bold" />{' '}
        <span className="hidden lg:block">G-System</span>
      </div>
      {children}
      <div className="ml-auto hidden items-center gap-2 lg:flex">
        <div>{store.collection}</div>
        <div>{indexLabel} </div>

        <div className="flex items-center gap-2 text-[0.5rem]">
          <CollectionButton
            aria-label="Previous collection"
            onClick={handlePreviousCollection}
            disabled={prevDisabled}
          >
            ◄
          </CollectionButton>
          <CollectionButton
            aria-label="Next collection"
            onClick={handleNextCollection}
            disabled={nextDisabled}
          >
            ►
          </CollectionButton>
        </div>
      </div>
    </div>
  );
}
