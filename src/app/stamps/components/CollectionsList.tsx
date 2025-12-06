import { LockSimpleIcon } from '@phosphor-icons/react';

import { remap } from '~/src/math';
import { cn } from '~/src/util';

import { collections, CollectionType, collectionTypes } from '../constants';

export default function CollectionsList({
  collection,
  onCollectionClick,
  className,
  onCollectionMouseOver,
  onCollectionFocus,
}: {
  collection: CollectionType;
  onCollectionClick: (collection: CollectionType) => void;
  onCollectionMouseOver: (collection: CollectionType) => void;
  onCollectionFocus: (collection: CollectionType) => void;
  className?: string;
}) {
  const maxZ = collectionTypes.length + 1;

  return (
    <ul
      className={cn('flex h-8 flex-row overflow-clip lg:h-10', className)}
      style={{ '--max-z': maxZ } as React.CSSProperties}
    >
      {collectionTypes.map((c, i, arr) => {
        const colors = collections[c].colors;
        const hasStamps = collections[c].stamps.length > 0;
        const isSelected = c === collection;

        return (
          <li
            key={c}
            className={cn(
              'relative -ml-2 flex min-w-[100px] items-center overflow-clip rounded-br-md rounded-bl-md border border-stone-300 shadow-[2px_0px_5px_0px_rgba(0,0,0,0.1)] first:ml-0 first:rounded-tl-none lg:rounded-tl-md lg:rounded-tr-md lg:rounded-br-none lg:rounded-bl-none lg:first:rounded-tl-md',
              'border-dashed border-(--muted-fg)',
              {
                'z-(--max-z) border-solid': isSelected,
              },
            )}
            style={
              {
                zIndex: isSelected ? maxZ : remap(i, arr.length, 0, 1, maxZ),

                '--bg': colors.bg,
                '--fg': colors.fg,
                '--muted-bg': colors.mutedBg,
                '--muted-fg': colors.mutedFg,
              } as React.CSSProperties
            }
          >
            <button
              onClick={() => onCollectionClick(c)}
              onMouseOver={() => onCollectionMouseOver(c)}
              onFocus={() => onCollectionFocus(c)}
              disabled={!hasStamps}
              className={cn(
                'flex h-full w-full items-center justify-center gap-1 bg-(--muted-bg) px-4 py-2 font-mono text-xs font-bold tracking-widest text-(--muted-fg) uppercase transition-colors duration-0 focus:outline-none focus-visible:bg-(--bg) focus-visible:text-(--fg) focus-visible:outline-none hover:enabled:border-solid hover:enabled:bg-(--bg) hover:enabled:text-(--fg) disabled:opacity-50',
                { 'bg-(--bg) text-(--fg)': isSelected },
              )}
            >
              {c} {!hasStamps && <LockSimpleIcon weight="fill" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
