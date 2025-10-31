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
        const isSelected = c === collection;

        return (
          <li
            key={c}
            className={cn(
              'relative -ml-2 flex min-w-[100px] items-center overflow-clip rounded-tl-md rounded-tr-md border border-stone-300 shadow-[2px_0px_5px_0px_rgba(0,0,0,0.1)] first:ml-0 first:rounded-tl-none lg:first:rounded-tl-md',
              'border-dashed border-[--muted-fg]',
              {
                'z-[--max-z] border-solid': isSelected,
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
              className={cn(
                'font-commitmono h-full w-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-0 focus:outline-none focus-visible:bg-[--bg] focus-visible:text-[--fg] focus-visible:outline-none',

                ' bg-[--muted-bg] text-[--muted-fg] hover:border-solid hover:bg-[--bg] hover:text-[--fg]',
                { 'bg-[--bg] text-[--fg]': isSelected },
              )}
            >
              {c}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
